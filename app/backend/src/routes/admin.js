/**
 * ROTAS ADMINISTRATIVAS E SUPERADMIN (routes/admin.js)
 * -----------------------------------------------------------------------------
 * FUNCAO: Concentra duas frentes complementares de administracao:
 *   1. Administracao local da propria UBS (/usuarios, /usuario/:id...)
 *   2. Painel superadmin para onboarding real de UBSs e gestores (/ubs, /gestores)
 *
 * SEGURANCA:
 *   - O JWT e validado em server.js antes de chegar neste router.
 *   - Todas as rotas exigem perfil "admin".
 *   - Endpoints legados continuam limitados a req.user.ubs_id.
 *   - Endpoints de superadmin podem operar globalmente, mas nunca recebem
 *     usuario_id do body e jamais retornam senha_hash.
 * -----------------------------------------------------------------------------
 */
const express = require('express');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
const knex = require('../db/knex');
const auditMiddleware = require('../middleware/auditMiddleware');
const { requirePerfil } = require('../middleware/authorization');
const { registrar } = require('../services/auditService');
const MENSAGENS = require('../utils/mensagens');

const router = express.Router();

// Perfis aceitos na gestao local da equipe. O perfil medico foi mantido para
// suportar o Painel Medico read-only ja existente no portal do gestor.
const PERFIS_VALIDOS = ['recepcionista', 'gestor', 'admin', 'medico'];
// No fluxo de superadmin, a tarefa pede onboarding de gestores reais e nao
// abertura de outras contas admin. Por isso o cadastro global fica restrito.
const PERFIS_SUPERADMIN_CADASTRAVEIS = ['recepcionista', 'gestor', 'medico'];
const CAMPOS_PUBLICOS = ['id', 'nome', 'email', 'perfil', 'ativo', 'criado_em'];

// Bloqueia perfis sem permissao administrativa mesmo que tenham um JWT valido.
// Acesso exclusivo para administradores, preservando o contrato legado da UBS.
const somenteAdmin = (req, res, next) => {
  if (req.user?.perfil !== 'admin') {
    return res.status(403).json({
      error: MENSAGENS.AUTH.ACESSO_NEGADO,
    });
  }
  next();
};

router.use(somenteAdmin);
router.use(requirePerfil(['admin']));
router.use(auditMiddleware({ modulo: 'admin' }));

// Confirma a existencia do usuario dentro da UBS do admin local. Centralizar a
// consulta evita que alguma rota esqueça o filtro de isolamento entre unidades.
const buscarUsuarioDaUbs = (id, ubsId) => knex('usuarios_gestores')
  .where({ id, ubs_id: ubsId })
  .select(...CAMPOS_PUBLICOS)
  .first();

// Busca um gestor por ID em escopo global, com o nome da UBS para a tabela do
// superadmin sem expor senha_hash nem outros campos internos.
const buscarGestorGlobal = (id) => knex('usuarios_gestores as gestor')
  .leftJoin('ubs', 'ubs.id', 'gestor.ubs_id')
  .where('gestor.id', Number(id))
  .select(
    'gestor.id',
    'gestor.nome',
    'gestor.email',
    'gestor.perfil',
    'gestor.ativo',
    'gestor.ubs_id',
    'gestor.criado_em',
    'ubs.nome as ubs_nome',
    'ubs.ativa as ubs_ativa'
  )
  .first();

// Senhas temporarias precisam ser curtas o bastante para o onboarding manual e
// aleatorias o bastante para nunca dependerem de sequencias previsiveis.
function gerarSenhaTemporaria() {
  return randomUUID().replace(/-/g, '').slice(0, 10);
}

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizarTexto(valor) {
  return String(valor || '').trim();
}

function toId(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

// Centraliza o contrato de auditoria explicita exigido pela task 4.8.
async function registrarAcaoAdmin(req, dados) {
  await registrar(req, {
    ...dados,
    ubs_id: dados.ubs_id ?? req.user?.ubs_id ?? null,
    usuarioId: req.user?.id ?? null,
    usuarioTipo: req.user?.tipo ?? 'gestor',
    usuarioPerfil: req.user?.perfil ?? 'admin',
  });
}

async function registrarFalhaEResponder(req, res, config) {
  await registrarAcaoAdmin(req, {
    acao: config.acao,
    entidade: config.entidade,
    entidadeId: config.entidadeId ?? null,
    resultado: 'falha',
    httpStatus: config.status,
    detalhe: config.detalhe,
    ubs_id: config.ubs_id ?? null,
  });

  return res.status(config.status).json({ error: config.mensagem });
}

function aplicarFiltrosAuditoria(query, filtros) {
  if (filtros.ubs_id) {
    query.where('logs.ubs_id', Number(filtros.ubs_id));
  }

  if (filtros.resultado) {
    query.where('logs.resultado', String(filtros.resultado).toLowerCase());
  }

  if (filtros.data_inicio) {
    query.where('logs.created_at', '>=', filtros.data_inicio);
  }

  if (filtros.data_fim) {
    query.where('logs.created_at', '<=', filtros.data_fim);
  }
}

// GET /api/admin/usuarios
// Lista somente campos publicos dos usuarios vinculados a unidade autenticada.
router.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await knex('usuarios_gestores')
      .where({ ubs_id: req.user.ubs_id })
      .select('id', 'nome', 'email', 'perfil', 'ativo', 'criado_em')
      .orderBy('nome', 'asc');

    await registrarAcaoAdmin(req, {
      acao: 'ADMIN_USUARIOS_LISTADOS_SUCESSO',
      entidade: 'usuario_gestor',
      resultado: 'sucesso',
      httpStatus: 200,
      detalhe: { total: usuarios.length, escopo: 'propria_ubs' },
    });

    return res.json(usuarios);
  } catch (err) {
    console.error('[GET /admin/usuarios]', err);
    await registrarAcaoAdmin(req, {
      acao: 'ADMIN_USUARIOS_LISTADOS_ERRO',
      entidade: 'usuario_gestor',
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message, escopo: 'propria_ubs' },
    });
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// POST /api/admin/usuario
// Cria uma conta ativa na mesma UBS do admin, ignorando qualquer UBS do body.
router.post('/usuario', async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;

    if (!nome || !email || !senha || !perfil) {
      return registrarFalhaEResponder(req, res, {
        acao: 'ADMIN_USUARIO_CRIADO_FALHA',
        entidade: 'usuario_gestor',
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'campos_obrigatorios_ausentes', bodyKeys: Object.keys(req.body || {}) },
      });
    }

    if (senha.length < 6) {
      return registrarFalhaEResponder(req, res, {
        acao: 'ADMIN_USUARIO_CRIADO_FALHA',
        entidade: 'usuario_gestor',
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'senha_curta' },
      });
    }

    if (!PERFIS_VALIDOS.includes(perfil)) {
      return registrarFalhaEResponder(req, res, {
        acao: 'ADMIN_USUARIO_CRIADO_FALHA',
        entidade: 'usuario_gestor',
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'perfil_invalido', perfil },
      });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const emailExistente = await knex('usuarios_gestores')
      .where({ email: emailNormalizado })
      .first();

    if (emailExistente) {
      await registrarAcaoAdmin(req, {
        acao: 'ADMIN_USUARIO_CRIADO_FALHA',
        entidade: 'usuario_gestor',
        resultado: 'falha',
        httpStatus: 409,
        detalhe: { motivo: 'email_duplicado', email: emailNormalizado },
      });
      return res.status(409).json({ error: MENSAGENS.AUTH.EMAIL_JA_CADASTRADO });
    }

    // O custo 12 equilibra seguranca e tempo de resposta para uma operacao rara.
    const senhaHash = await bcrypt.hash(senha, 12);
    const [usuario] = await knex('usuarios_gestores')
      .insert({
        nome: nome.trim(),
        email: emailNormalizado,
        senha_hash: senhaHash,
        perfil,
        ubs_id: req.user.ubs_id,
        ativo: true,
      })
      .returning(['id', 'nome', 'email', 'perfil', 'ubs_id']);

    await registrarAcaoAdmin(req, {
      acao: 'ADMIN_USUARIO_CRIADO_SUCESSO',
      entidade: 'usuario_gestor',
      entidadeId: usuario.id,
      resultado: 'sucesso',
      httpStatus: 201,
      detalhe: { perfil, email: emailNormalizado, escopo: 'propria_ubs' },
    });

    return res.status(201).json(usuario);
  } catch (err) {
    console.error('[POST /admin/usuario]', err);
    if (err.code === '23505') {
      return registrarFalhaEResponder(req, res, {
        acao: 'ADMIN_USUARIO_CRIADO_FALHA',
        entidade: 'usuario_gestor',
        status: 409,
        mensagem: MENSAGENS.AUTH.EMAIL_JA_CADASTRADO,
        detalhe: { motivo: 'violacao_unique', codigo: err.code },
      });
    }

    await registrarAcaoAdmin(req, {
      acao: 'ADMIN_USUARIO_CRIADO_ERRO',
      entidade: 'usuario_gestor',
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message, escopo: 'propria_ubs' },
    });

    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// PATCH /api/admin/usuario/:id
// Atualiza dados publicos e tambem aceita "ativo" para a reativacao solicitada
// pela interface. A desativacao continua exclusiva do DELETE logico.
router.patch('/usuario/:id', async (req, res) => {
  try {
    // Impede que o administrador altere o próprio perfil por esta rota.
    if (Number(req.params.id) === Number(req.user.id)) {
      return registrarFalhaEResponder(req, res, {
        acao: 'ADMIN_USUARIO_ATUALIZADO_FALHA',
        entidade: 'usuario_gestor',
        entidadeId: Number(req.params.id),
        status: 403,
        mensagem: MENSAGENS.AUTH.ACESSO_NEGADO,
        detalhe: { motivo: 'proprio_perfil' },
      });
    }

    const existente = await buscarUsuarioDaUbs(req.params.id, req.user.ubs_id);
    if (!existente) {
      return registrarFalhaEResponder(req, res, {
        acao: 'ADMIN_USUARIO_ATUALIZADO_FALHA',
        entidade: 'usuario_gestor',
        entidadeId: Number(req.params.id),
        status: 404,
        mensagem: MENSAGENS.GERAL.NAO_ENCONTRADO,
        detalhe: { motivo: 'usuario_fora_do_escopo' },
      });
    }

    const { nome, email, perfil, ativo } = req.body;
    if (perfil !== undefined && !PERFIS_VALIDOS.includes(perfil)) {
      return registrarFalhaEResponder(req, res, {
        acao: 'ADMIN_USUARIO_ATUALIZADO_FALHA',
        entidade: 'usuario_gestor',
        entidadeId: Number(req.params.id),
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'perfil_invalido', perfil },
      });
    }

    const emailNormalizado = email?.trim().toLowerCase();
    if (emailNormalizado && emailNormalizado !== existente.email) {
      const emailEmUso = await knex('usuarios_gestores')
        .where({ email: emailNormalizado })
        .whereNot({ id: req.params.id })
        .first();
      if (emailEmUso) {
        return registrarFalhaEResponder(req, res, {
          acao: 'ADMIN_USUARIO_ATUALIZADO_FALHA',
          entidade: 'usuario_gestor',
          entidadeId: Number(req.params.id),
          status: 409,
          mensagem: MENSAGENS.AUTH.EMAIL_JA_CADASTRADO,
          detalhe: { motivo: 'email_duplicado', email: emailNormalizado },
        });
      }
    }

    // Somente campos enviados entram no update para nao apagar dados existentes.
    const alteracoes = {};
    if (nome !== undefined) alteracoes.nome = nome.trim();
    if (email !== undefined) alteracoes.email = emailNormalizado;
    if (perfil !== undefined) alteracoes.perfil = perfil;
    if (typeof ativo === 'boolean') alteracoes.ativo = ativo;

    if (Object.keys(alteracoes).length === 0) {
      return registrarFalhaEResponder(req, res, {
        acao: 'ADMIN_USUARIO_ATUALIZADO_FALHA',
        entidade: 'usuario_gestor',
        entidadeId: Number(req.params.id),
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'sem_alteracoes' },
      });
    }

    await knex('usuarios_gestores')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .update(alteracoes);

    const atualizado = await buscarUsuarioDaUbs(req.params.id, req.user.ubs_id);
    await registrarAcaoAdmin(req, {
      acao: 'ADMIN_USUARIO_ATUALIZADO_SUCESSO',
      entidade: 'usuario_gestor',
      entidadeId: atualizado.id,
      resultado: 'sucesso',
      httpStatus: 200,
      detalhe: { campos: Object.keys(alteracoes), escopo: 'propria_ubs' },
    });

    return res.json(atualizado);
  } catch (err) {
    console.error('[PATCH /admin/usuario/:id]', err);
    if (err.code === '23505') {
      return registrarFalhaEResponder(req, res, {
        acao: 'ADMIN_USUARIO_ATUALIZADO_FALHA',
        entidade: 'usuario_gestor',
        entidadeId: Number(req.params.id),
        status: 409,
        mensagem: MENSAGENS.AUTH.EMAIL_JA_CADASTRADO,
        detalhe: { motivo: 'violacao_unique', codigo: err.code },
      });
    }

    await registrarAcaoAdmin(req, {
      acao: 'ADMIN_USUARIO_ATUALIZADO_ERRO',
      entidade: 'usuario_gestor',
      entidadeId: Number(req.params.id),
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message, escopo: 'propria_ubs' },
    });

    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// PATCH /api/admin/usuario/:id/senha
// Redefine a senha de outro membro da equipe sem retornar o novo hash.
router.patch('/usuario/:id/senha', async (req, res) => {
  try {
    const { nova_senha } = req.body;
    // A troca exige no mínimo 6 caracteres para manter o contrato de segurança.
    if (!nova_senha || nova_senha.length < 6) {
      return registrarFalhaEResponder(req, res, {
        acao: 'ADMIN_USUARIO_SENHA_ATUALIZADA_FALHA',
        entidade: 'usuario_gestor',
        entidadeId: Number(req.params.id),
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'senha_curta' },
      });
    }
    if (Number(req.params.id) === Number(req.user.id)) {
      return registrarFalhaEResponder(req, res, {
        acao: 'ADMIN_USUARIO_SENHA_ATUALIZADA_FALHA',
        entidade: 'usuario_gestor',
        entidadeId: Number(req.params.id),
        status: 403,
        mensagem: MENSAGENS.AUTH.ACESSO_NEGADO,
        detalhe: { motivo: 'propria_conta' },
      });
    }

    const existente = await buscarUsuarioDaUbs(req.params.id, req.user.ubs_id);
    if (!existente) {
      return registrarFalhaEResponder(req, res, {
        acao: 'ADMIN_USUARIO_SENHA_ATUALIZADA_FALHA',
        entidade: 'usuario_gestor',
        entidadeId: Number(req.params.id),
        status: 404,
        mensagem: MENSAGENS.GERAL.NAO_ENCONTRADO,
        detalhe: { motivo: 'usuario_fora_do_escopo' },
      });
    }

    const senhaHash = await bcrypt.hash(nova_senha, 12);
    await knex('usuarios_gestores')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .update({
        senha_hash: senhaHash,
        token_version: knex.raw('COALESCE(token_version, 0) + 1'),
      });

    await registrarAcaoAdmin(req, {
      acao: 'ADMIN_USUARIO_SENHA_ATUALIZADA_SUCESSO',
      entidade: 'usuario_gestor',
      entidadeId: Number(req.params.id),
      resultado: 'sucesso',
      httpStatus: 200,
      detalhe: { escopo: 'propria_ubs' },
    });

    return res.json({ mensagem: 'Senha atualizada com sucesso.' });
  } catch (err) {
    console.error('[PATCH /admin/usuario/:id/senha]', err);
    await registrarAcaoAdmin(req, {
      acao: 'ADMIN_USUARIO_SENHA_ATUALIZADA_ERRO',
      entidade: 'usuario_gestor',
      entidadeId: Number(req.params.id),
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message, escopo: 'propria_ubs' },
    });
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// DELETE /api/admin/usuario/:id
// A exclusao e logica: preserva auditoria e relacionamentos historicos.
router.delete('/usuario/:id', async (req, res) => {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      await registrarAcaoAdmin(req, {
        acao: 'ADMIN_USUARIO_DESATIVADO_FALHA',
        entidade: 'usuario_gestor',
        entidadeId: Number(req.params.id),
        resultado: 'falha',
        httpStatus: 403,
        detalhe: { motivo: 'autodesativacao' },
      });
      return res.status(403).json({ error: MENSAGENS.AUTH.ACESSO_NEGADO });
    }

    const existente = await buscarUsuarioDaUbs(req.params.id, req.user.ubs_id);
    if (!existente) {
      return registrarFalhaEResponder(req, res, {
        acao: 'ADMIN_USUARIO_DESATIVADO_FALHA',
        entidade: 'usuario_gestor',
        entidadeId: Number(req.params.id),
        status: 404,
        mensagem: MENSAGENS.GERAL.NAO_ENCONTRADO,
        detalhe: { motivo: 'usuario_fora_do_escopo' },
      });
    }

    await knex('usuarios_gestores')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .update({ ativo: false });

    await knex('usuarios_gestores')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .update({ token_version: knex.raw('COALESCE(token_version, 0) + 1') });

    await registrarAcaoAdmin(req, {
      acao: 'ADMIN_USUARIO_DESATIVADO_SUCESSO',
      entidade: 'usuario_gestor',
      entidadeId: Number(req.params.id),
      resultado: 'sucesso',
      httpStatus: 200,
      detalhe: { escopo: 'propria_ubs' },
    });

    return res.json({ mensagem: 'Usuario desativado.' });
  } catch (err) {
    console.error('[DELETE /admin/usuario/:id]', err);
    await registrarAcaoAdmin(req, {
      acao: 'ADMIN_USUARIO_DESATIVADO_ERRO',
      entidade: 'usuario_gestor',
      entidadeId: Number(req.params.id),
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message, escopo: 'propria_ubs' },
    });
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// GET /api/admin/ubs
// Lista UBSs do piloto para o painel superadmin sem expor campos sensiveis.
router.get('/ubs', async (req, res) => {
  try {
    const unidades = await knex('ubs')
      .select('id', 'nome', 'endereco', 'bairro', 'ativa', 'criado_em')
      .orderBy([{ column: 'ativa', order: 'desc' }, { column: 'nome', order: 'asc' }]);

    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_UBS_LISTADAS_SUCESSO',
      entidade: 'ubs',
      resultado: 'sucesso',
      httpStatus: 200,
      detalhe: { total: unidades.length },
      ubs_id: null,
    });

    return res.json(unidades);
  } catch (err) {
    console.error('[GET /admin/ubs]', err);
    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_UBS_LISTADAS_ERRO',
      entidade: 'ubs',
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message },
      ubs_id: null,
    });
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// POST /api/admin/ubs
// Cadastra uma nova UBS do piloto a partir de dados minimos de identificacao.
router.post('/ubs', async (req, res) => {
  try {
    const nome = normalizarTexto(req.body?.nome);
    const endereco = normalizarTexto(req.body?.endereco);
    const bairro = normalizarTexto(req.body?.bairro);

    if (!nome || !endereco || !bairro) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_UBS_CRIADA_FALHA',
        entidade: 'ubs',
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'campos_obrigatorios_ausentes' },
        ubs_id: null,
      });
    }

    const [ubs] = await knex('ubs')
      .insert({
        nome,
        endereco,
        bairro,
        ativa: true,
      })
      .returning(['id', 'nome', 'endereco', 'bairro', 'ativa', 'criado_em']);

    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_UBS_CRIADA_SUCESSO',
      entidade: 'ubs',
      entidadeId: ubs.id,
      resultado: 'sucesso',
      httpStatus: 201,
      detalhe: { nome, bairro },
      ubs_id: ubs.id,
    });

    return res.status(201).json(ubs);
  } catch (err) {
    console.error('[POST /admin/ubs]', err);
    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_UBS_CRIADA_ERRO',
      entidade: 'ubs',
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message },
      ubs_id: null,
    });
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// PATCH /api/admin/ubs/:id/ativar
// Reativa a UBS sem apagar historico, permitindo retomar o piloto depois.
router.patch('/ubs/:id/ativar', async (req, res) => {
  try {
    const ubsId = toId(req.params.id);
    if (!ubsId) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_UBS_ATIVADA_FALHA',
        entidade: 'ubs',
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'id_invalido' },
        ubs_id: null,
      });
    }

    const unidade = await knex('ubs').where({ id: ubsId }).first();
    if (!unidade) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_UBS_ATIVADA_FALHA',
        entidade: 'ubs',
        entidadeId: ubsId,
        status: 404,
        mensagem: MENSAGENS.GERAL.NAO_ENCONTRADO,
        detalhe: { motivo: 'ubs_nao_encontrada' },
        ubs_id: ubsId,
      });
    }

    await knex('ubs').where({ id: ubsId }).update({ ativa: true });
    const atualizada = await knex('ubs')
      .where({ id: ubsId })
      .select('id', 'nome', 'endereco', 'bairro', 'ativa', 'criado_em')
      .first();

    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_UBS_ATIVADA_SUCESSO',
      entidade: 'ubs',
      entidadeId: ubsId,
      resultado: 'sucesso',
      httpStatus: 200,
      detalhe: { nome: atualizada.nome },
      ubs_id: ubsId,
    });

    return res.json(atualizada);
  } catch (err) {
    console.error('[PATCH /admin/ubs/:id/ativar]', err);
    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_UBS_ATIVADA_ERRO',
      entidade: 'ubs',
      entidadeId: toId(req.params.id),
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message },
      ubs_id: toId(req.params.id),
    });
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// PATCH /api/admin/ubs/:id/desativar
// Soft delete operacional: a UBS sai do onboarding novo, mas o historico fica.
router.patch('/ubs/:id/desativar', async (req, res) => {
  try {
    const ubsId = toId(req.params.id);
    if (!ubsId) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_UBS_DESATIVADA_FALHA',
        entidade: 'ubs',
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'id_invalido' },
        ubs_id: null,
      });
    }

    const unidade = await knex('ubs').where({ id: ubsId }).first();
    if (!unidade) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_UBS_DESATIVADA_FALHA',
        entidade: 'ubs',
        entidadeId: ubsId,
        status: 404,
        mensagem: MENSAGENS.GERAL.NAO_ENCONTRADO,
        detalhe: { motivo: 'ubs_nao_encontrada' },
        ubs_id: ubsId,
      });
    }

    await knex('ubs').where({ id: ubsId }).update({ ativa: false });
    const atualizada = await knex('ubs')
      .where({ id: ubsId })
      .select('id', 'nome', 'endereco', 'bairro', 'ativa', 'criado_em')
      .first();

    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_UBS_DESATIVADA_SUCESSO',
      entidade: 'ubs',
      entidadeId: ubsId,
      resultado: 'sucesso',
      httpStatus: 200,
      detalhe: { nome: atualizada.nome },
      ubs_id: ubsId,
    });

    return res.json(atualizada);
  } catch (err) {
    console.error('[PATCH /admin/ubs/:id/desativar]', err);
    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_UBS_DESATIVADA_ERRO',
      entidade: 'ubs',
      entidadeId: toId(req.params.id),
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message },
      ubs_id: toId(req.params.id),
    });
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// GET /api/admin/gestores
// Lista gestores globalmente com o nome da UBS para onboarding centralizado.
router.get('/gestores', async (req, res) => {
  try {
    const gestores = await knex('usuarios_gestores as gestor')
      .leftJoin('ubs', 'ubs.id', 'gestor.ubs_id')
      .select(
        'gestor.id',
        'gestor.nome',
        'gestor.email',
        'gestor.perfil',
        'gestor.ativo',
        'gestor.ubs_id',
        'gestor.criado_em',
        'ubs.nome as ubs_nome',
        'ubs.ativa as ubs_ativa'
      )
      .orderBy([{ column: 'gestor.ativo', order: 'desc' }, { column: 'gestor.nome', order: 'asc' }]);

    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_GESTORES_LISTADOS_SUCESSO',
      entidade: 'usuario_gestor',
      resultado: 'sucesso',
      httpStatus: 200,
      detalhe: { total: gestores.length, escopo: 'global' },
      ubs_id: null,
    });

    return res.json(gestores);
  } catch (err) {
    console.error('[GET /admin/gestores]', err);
    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_GESTORES_LISTADOS_ERRO',
      entidade: 'usuario_gestor',
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message, escopo: 'global' },
      ubs_id: null,
    });
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// POST /api/admin/gestores
// Cria conta para onboarding real da rede, gerando senha inicial uma unica vez.
router.post('/gestores', async (req, res) => {
  try {
    const nome = normalizarTexto(req.body?.nome);
    const emailNormalizado = normalizarEmail(req.body?.email);
    const perfil = normalizarTexto(req.body?.perfil);
    const ubsId = toId(req.body?.ubs_id);

    if (!nome || !emailNormalizado || !perfil || !ubsId) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_GESTOR_CRIADO_FALHA',
        entidade: 'usuario_gestor',
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'campos_obrigatorios_ausentes' },
        ubs_id: ubsId,
      });
    }

    if (!PERFIS_SUPERADMIN_CADASTRAVEIS.includes(perfil)) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_GESTOR_CRIADO_FALHA',
        entidade: 'usuario_gestor',
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'perfil_invalido', perfil },
        ubs_id: ubsId,
      });
    }

    const unidade = await knex('ubs').where({ id: ubsId }).first();
    if (!unidade) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_GESTOR_CRIADO_FALHA',
        entidade: 'usuario_gestor',
        status: 404,
        mensagem: MENSAGENS.GERAL.NAO_ENCONTRADO,
        detalhe: { motivo: 'ubs_nao_encontrada' },
        ubs_id: ubsId,
      });
    }

    const emailExistente = await knex('usuarios_gestores')
      .where({ email: emailNormalizado })
      .first();
    if (emailExistente) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_GESTOR_CRIADO_FALHA',
        entidade: 'usuario_gestor',
        status: 409,
        mensagem: MENSAGENS.AUTH.EMAIL_JA_CADASTRADO,
        detalhe: { motivo: 'email_duplicado', email: emailNormalizado },
        ubs_id: ubsId,
      });
    }

    const senhaTemporaria = gerarSenhaTemporaria();
    const senhaHash = await bcrypt.hash(senhaTemporaria, 12);

    const [novoGestor] = await knex('usuarios_gestores')
      .insert({
        nome,
        email: emailNormalizado,
        senha_hash: senhaHash,
        perfil,
        ubs_id: ubsId,
        ativo: true,
      })
      .returning(['id', 'nome', 'email', 'perfil', 'ubs_id', 'ativo', 'criado_em']);

    const gestor = await buscarGestorGlobal(novoGestor.id);
    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_GESTOR_CRIADO_SUCESSO',
      entidade: 'usuario_gestor',
      entidadeId: gestor.id,
      resultado: 'sucesso',
      httpStatus: 201,
      detalhe: { perfil, email: emailNormalizado, ubs_id: ubsId },
      ubs_id: ubsId,
    });

    return res.status(201).json({
      gestor,
      senha_temporaria: senhaTemporaria,
      aviso: 'Copie esta senha, ela nao sera exibida novamente.',
    });
  } catch (err) {
    console.error('[POST /admin/gestores]', err);
    if (err.code === '23505') {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_GESTOR_CRIADO_FALHA',
        entidade: 'usuario_gestor',
        status: 409,
        mensagem: MENSAGENS.AUTH.EMAIL_JA_CADASTRADO,
        detalhe: { motivo: 'violacao_unique', codigo: err.code },
        ubs_id: toId(req.body?.ubs_id),
      });
    }

    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_GESTOR_CRIADO_ERRO',
      entidade: 'usuario_gestor',
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message },
      ubs_id: toId(req.body?.ubs_id),
    });
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// PATCH /api/admin/gestores/:id/ativar
// Reativa a conta de gestor sem recriar o cadastro nem mudar o historico.
router.patch('/gestores/:id/ativar', async (req, res) => {
  try {
    const gestorId = toId(req.params.id);
    if (!gestorId) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_GESTOR_ATIVADO_FALHA',
        entidade: 'usuario_gestor',
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'id_invalido' },
        ubs_id: null,
      });
    }

    const gestor = await buscarGestorGlobal(gestorId);
    if (!gestor) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_GESTOR_ATIVADO_FALHA',
        entidade: 'usuario_gestor',
        entidadeId: gestorId,
        status: 404,
        mensagem: MENSAGENS.GERAL.NAO_ENCONTRADO,
        detalhe: { motivo: 'gestor_nao_encontrado' },
        ubs_id: null,
      });
    }

    await knex('usuarios_gestores')
      .where({ id: gestorId })
      .update({ ativo: true });

    const atualizado = await buscarGestorGlobal(gestorId);
    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_GESTOR_ATIVADO_SUCESSO',
      entidade: 'usuario_gestor',
      entidadeId: gestorId,
      resultado: 'sucesso',
      httpStatus: 200,
      detalhe: { email: atualizado.email, ubs_id: atualizado.ubs_id },
      ubs_id: atualizado.ubs_id,
    });

    return res.json(atualizado);
  } catch (err) {
    console.error('[PATCH /admin/gestores/:id/ativar]', err);
    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_GESTOR_ATIVADO_ERRO',
      entidade: 'usuario_gestor',
      entidadeId: toId(req.params.id),
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message },
      ubs_id: null,
    });
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// PATCH /api/admin/gestores/:id/desativar
// Desativa a conta e revoga sessoes antigas via token_version.
router.patch('/gestores/:id/desativar', async (req, res) => {
  try {
    const gestorId = toId(req.params.id);
    if (!gestorId) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_GESTOR_DESATIVADO_FALHA',
        entidade: 'usuario_gestor',
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'id_invalido' },
        ubs_id: null,
      });
    }

    const gestor = await buscarGestorGlobal(gestorId);
    if (!gestor) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_GESTOR_DESATIVADO_FALHA',
        entidade: 'usuario_gestor',
        entidadeId: gestorId,
        status: 404,
        mensagem: MENSAGENS.GERAL.NAO_ENCONTRADO,
        detalhe: { motivo: 'gestor_nao_encontrado' },
        ubs_id: null,
      });
    }

    await knex('usuarios_gestores')
      .where({ id: gestorId })
      .update({
        ativo: false,
        token_version: knex.raw('COALESCE(token_version, 0) + 1'),
      });

    const atualizado = await buscarGestorGlobal(gestorId);
    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_GESTOR_DESATIVADO_SUCESSO',
      entidade: 'usuario_gestor',
      entidadeId: gestorId,
      resultado: 'sucesso',
      httpStatus: 200,
      detalhe: { email: atualizado.email, ubs_id: atualizado.ubs_id },
      ubs_id: atualizado.ubs_id,
    });

    return res.json(atualizado);
  } catch (err) {
    console.error('[PATCH /admin/gestores/:id/desativar]', err);
    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_GESTOR_DESATIVADO_ERRO',
      entidade: 'usuario_gestor',
      entidadeId: toId(req.params.id),
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message },
      ubs_id: null,
    });
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// POST /api/admin/gestores/:id/reset-senha
// Gera nova senha aleatoria, salva so o hash e devolve o texto uma unica vez.
router.post('/gestores/:id/reset-senha', async (req, res) => {
  try {
    const gestorId = toId(req.params.id);
    if (!gestorId) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_GESTOR_SENHA_RESETADA_FALHA',
        entidade: 'usuario_gestor',
        status: 400,
        mensagem: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhe: { motivo: 'id_invalido' },
        ubs_id: null,
      });
    }

    const gestor = await buscarGestorGlobal(gestorId);
    if (!gestor) {
      return registrarFalhaEResponder(req, res, {
        acao: 'SUPERADMIN_GESTOR_SENHA_RESETADA_FALHA',
        entidade: 'usuario_gestor',
        entidadeId: gestorId,
        status: 404,
        mensagem: MENSAGENS.GERAL.NAO_ENCONTRADO,
        detalhe: { motivo: 'gestor_nao_encontrado' },
        ubs_id: null,
      });
    }

    const novaSenhaTemporaria = gerarSenhaTemporaria();
    const senhaHash = await bcrypt.hash(novaSenhaTemporaria, 12);
    await knex('usuarios_gestores')
      .where({ id: gestorId })
      .update({
        senha_hash: senhaHash,
        token_version: knex.raw('COALESCE(token_version, 0) + 1'),
      });

    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_GESTOR_SENHA_RESETADA_SUCESSO',
      entidade: 'usuario_gestor',
      entidadeId: gestorId,
      resultado: 'sucesso',
      httpStatus: 200,
      detalhe: { email: gestor.email, ubs_id: gestor.ubs_id },
      ubs_id: gestor.ubs_id,
    });

    return res.json({
      gestor,
      nova_senha: novaSenhaTemporaria,
      aviso: 'Copie esta senha, ela nao sera exibida novamente.',
    });
  } catch (err) {
    console.error('[POST /admin/gestores/:id/reset-senha]', err);
    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_GESTOR_SENHA_RESETADA_ERRO',
      entidade: 'usuario_gestor',
      entidadeId: toId(req.params.id),
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message },
      ubs_id: null,
    });
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// GET /api/admin/audit/logs
// Proxy de consulta para o modulo de auditoria administrativa ja existente.
router.get('/audit/logs', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const offset = Number(req.query.offset || 0);
    const query = knex('security_audit_logs as logs')
      .leftJoin('usuarios_gestores as gestor', 'gestor.id', 'logs.usuario_id')
      .leftJoin('ubs', 'ubs.id', 'logs.ubs_id')
      .select(
        'logs.id',
        'logs.created_at',
        'logs.usuario_id',
        'logs.usuario_tipo',
        'logs.ubs_id',
        'logs.acao',
        'logs.entidade',
        'logs.entidade_id',
        'logs.resultado',
        'logs.detalhe',
        'logs.ip_origem',
        'logs.http_status',
        'gestor.nome as usuario_nome',
        'ubs.nome as ubs_nome'
      )
      .orderBy('logs.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    aplicarFiltrosAuditoria(query, req.query);
    const logs = await query;

    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_AUDIT_LOGS_LISTADOS_SUCESSO',
      entidade: 'security_audit_log',
      resultado: 'sucesso',
      httpStatus: 200,
      detalhe: {
        total: logs.length,
        filtros: {
          ubs_id: req.query.ubs_id || null,
          resultado: req.query.resultado || null,
          data_inicio: req.query.data_inicio || null,
          data_fim: req.query.data_fim || null,
        },
      },
      ubs_id: req.query.ubs_id ? Number(req.query.ubs_id) : null,
    });

    return res.json({ limit, offset, total: logs.length, logs });
  } catch (err) {
    console.error('[GET /admin/audit/logs]', err);
    await registrarAcaoAdmin(req, {
      acao: 'SUPERADMIN_AUDIT_LOGS_LISTADOS_ERRO',
      entidade: 'security_audit_log',
      resultado: 'erro',
      httpStatus: 500,
      detalhe: { mensagem: err.message },
      ubs_id: req.query.ubs_id ? Number(req.query.ubs_id) : null,
    });
    return res.status(500).json({ error: 'Erro ao consultar logs de auditoria.' });
  }
});

module.exports = router;
