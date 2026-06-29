/**
 * ROTAS DE AUTENTICACAO (routes/auth.js)
 * -----------------------------------------------------------------------------
 * Define as portas publicas de entrada do sistema: login de gestor, login de
 * paciente, listagem publica de UBS/bairros e auto-cadastro pendente.
 *
 * SEGURANCA:
 * - Login usa rate limit para reduzir forca bruta.
 * - JWT carrega token_version para permitir revogacao de sessoes antigas.
 * - Eventos de sucesso e falha sao gravados em security_audit_logs sem senha.
 */
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const knex = require('../db/knex');
const validateBody = require('../middleware/validateBody');
const auditMiddleware = require('../middleware/auditMiddleware');
const { registrarAuditoria } = require('../services/auditService');
const pushService = require('../services/pushService');
const gestorNotificationService = require('../services/gestorNotificationService');
const { loginGestorSchema, loginPacienteSchema, loginExternaSchema } = require('../validators/securitySchemas');
const MENSAGENS = require('../utils/mensagens');
const { VERSAO_ATUAL } = require('../utils/lgpd');

const crypto = require('crypto');
const emailService = require('../services/emailService');

const router = express.Router();
router.use(['/login-gestor', '/login-paciente', '/login-externa', '/cadastro-paciente'], auditMiddleware({ modulo: 'auth' }));

function gerarJwtSeguro(payload, options) {
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64)) {
    throw new Error('JWT_SECRET inseguro ou ausente em producao.');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Limite dinâmico: 10 em produção real, 1000 em desenvolvimento e testes locais
  max: process.env.NODE_ENV === 'production' ? 10 : 1000,
  message: {
    error: 'Muitas tentativas de login a partir deste IP. Por favor, tente novamente apos 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const cadastroRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  // Limite dinâmico: 20 em produção real, 1000 em desenvolvimento e testes locais
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
  message: {
    error: 'Muitos cadastros efetuados deste dispositivo. Tente novamente mais tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login-gestor', loginRateLimiter, validateBody(loginGestorSchema), async (req, res) => {
  try {
    const { email, senha } = req.body;

    const gestor = await knex('usuarios_gestores')
      .where({ email, ativo: true })
      .first();

    if (!gestor) {
      await registrarAuditoria(req, {
        ator_tipo: 'gestor',
        acao: 'login_gestor_falha',
        entidade: 'usuarios_gestores',
        metadata: { email },
      });
      return res.status(401).json({ error: MENSAGENS.AUTH.CREDENCIAIS_INVALIDAS });
    }

    const senhaValida = await bcrypt.compare(senha, gestor.senha_hash);
    if (!senhaValida) {
      await registrarAuditoria(req, {
        ator_tipo: 'gestor',
        ator_id: gestor.id,
        ator_perfil: gestor.perfil,
        ator_ubs_id: gestor.ubs_id,
        acao: 'login_gestor_falha',
        entidade: 'usuarios_gestores',
        entidade_id: gestor.id,
        escopo_ubs_id: gestor.ubs_id,
        metadata: { email },
      });
      return res.status(401).json({ error: MENSAGENS.AUTH.CREDENCIAIS_INVALIDAS });
    }

    const payload = {
      id: gestor.id,
      nome: gestor.nome,
      ubs_id: gestor.ubs_id,
      perfil: gestor.perfil,
      tipo: 'gestor',
      token_version: gestor.token_version || 0,
    };

    const token = gerarJwtSeguro(payload, { expiresIn: '8h' });

    await registrarAuditoria(req, {
      ator_tipo: 'gestor',
      ator_id: gestor.id,
      ator_perfil: gestor.perfil,
      ator_ubs_id: gestor.ubs_id,
      acao: 'login_gestor_sucesso',
      entidade: 'usuarios_gestores',
      entidade_id: gestor.id,
      escopo_ubs_id: gestor.ubs_id,
    });

    return res.json({ token, ...payload });
  } catch (err) {
    console.error('[login-gestor]', err);
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

router.post('/login-paciente', loginRateLimiter, validateBody(loginPacienteSchema), async (req, res) => {
  try {
    const { cra, data_nascimento } = req.body;

    const paciente = await knex('pacientes')
      .where({ cra })
      .whereRaw('data_nascimento = ?', [data_nascimento])
      .first();

    if (!paciente) {
      await registrarAuditoria(req, {
        ator_tipo: 'paciente',
        acao: 'login_paciente_falha',
        entidade: 'pacientes',
        metadata: { cra },
      });
      return res.status(401).json({ error: MENSAGENS.AUTH.CREDENCIAIS_INVALIDAS });
    }

    // O aceite fica pendente quando nao existe registro anterior ou quando o
    // paciente aceitou uma versao diferente da politica vigente no backend.
    const lgpdPendente = !paciente.lgpd_aceite_em || paciente.lgpd_versao !== VERSAO_ATUAL;

    const payload = {
      id: paciente.id,
      nome: paciente.nome,
      ubs_id: paciente.ubs_id,
      tipo: 'paciente',
      ativo: paciente.ativo,
      lgpd_aceite_em: paciente.lgpd_aceite_em,
      lgpd_versao: paciente.lgpd_versao,
      lgpd_pendente: lgpdPendente,
      token_version: paciente.token_version || 0,
    };

    const token = gerarJwtSeguro(payload, { expiresIn: '12h' });

    await registrarAuditoria(req, {
      ator_tipo: 'paciente',
      ator_id: paciente.id,
      ator_ubs_id: paciente.ubs_id,
      acao: 'login_paciente_sucesso',
      entidade: 'pacientes',
      entidade_id: paciente.id,
      escopo_ubs_id: paciente.ubs_id,
    });

    return res.json({ token, ...payload });
  } catch (err) {
    console.error('[login-paciente]', err);
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

router.post('/login-externa', loginRateLimiter, validateBody(loginExternaSchema), async (req, res) => {
  try {
    const { email, senha } = req.body;

    const unidade = await knex('unidades_externas')
      .where({ email, ativo: true })
      .first();

    if (!unidade) {
      await registrarAuditoria(req, {
        ator_tipo: 'externa',
        acao: 'login_externa_falha',
        entidade: 'unidades_externas',
        metadata: { email },
      });
      return res.status(401).json({ error: 'Credenciais invalidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, unidade.senha_hash);
    if (!senhaValida) {
      await registrarAuditoria(req, {
        ator_tipo: 'externa',
        ator_id: unidade.id,
        acao: 'login_externa_falha',
        entidade: 'unidades_externas',
        entidade_id: unidade.id,
        metadata: { email },
      });
      return res.status(401).json({ error: 'Credenciais invalidas.' });
    }

    const payload = {
      id: unidade.id,
      nome: unidade.nome,
      tipo: 'externa',
      tipo_unidade: unidade.tipo,
      token_version: unidade.token_version || 0,
    };

    const token = gerarJwtSeguro(payload, { expiresIn: '12h' });

    await registrarAuditoria(req, {
      ator_tipo: 'externa',
      ator_id: unidade.id,
      acao: 'login_externa_sucesso',
      entidade: 'unidades_externas',
      entidade_id: unidade.id,
    });

    return res.json({ token, ...payload });
  } catch (err) {
    console.error('[login-externa]', err);
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

router.get('/ubs', async (req, res) => {
  try {
    const ubs = await knex('ubs')
      .where({ ativa: true })
      .select('id', 'nome', 'bairro', 'endereco', 'telefone')
      .orderBy('bairro');

    return res.json(ubs);
  } catch (err) {
    console.error('[GET /auth/ubs]', err);
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

router.post('/cadastro-paciente', cadastroRateLimiter, async (req, res) => {
  try {
    const { nome, data_nascimento, ubs_id, bairro, telefone, email, cpf } = req.body;
    const ubsId = Number(ubs_id);

    if (!nome || !data_nascimento || !ubsId || !bairro) {
      return res.status(400).json({
        error: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
      });
    }

    const ubs = await knex('ubs').where({ id: ubsId, ativa: true }).first();
    if (!ubs) {
      return res.status(404).json({ error: MENSAGENS.GERAL.NAO_ENCONTRADO });
    }

    let cpfLimpo = null;
    if (cpf) {
      cpfLimpo = cpf.replace(/[^\d]/g, '');

      if (cpfLimpo.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpo)) {
        return res.status(400).json({ error: MENSAGENS.PACIENTE.DADOS_INVALIDOS });
      }

      const cpfExiste = await knex('pacientes').where({ cpf: cpfLimpo }).first();
      if (cpfExiste) {
        return res.status(409).json({ error: MENSAGENS.PACIENTE.DADOS_INVALIDOS });
      }
    }

    // Gera CRA no formato AAMMDD + 4 digitos e tenta ate 5 vezes para evitar colisao
    // rara quando duas pessoas se cadastram no mesmo dia.
    const hoje = new Date();
    const aammdd = String(hoje.getFullYear()).slice(2)
      + String(hoje.getMonth() + 1).padStart(2, '0')
      + String(hoje.getDate()).padStart(2, '0');
    let cra, craUnico = false;
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const sufixo = String(Math.floor(Math.random() * 9000) + 1000);
      cra = `${aammdd}${sufixo}`;
      const craExiste = await knex('pacientes').where({ cra }).first();
      if (!craExiste) {
        craUnico = true;
        break;
      }
    }

    if (!craUnico) {
      return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
    }

    const [paciente] = await knex('pacientes')
      .insert({
        ubs_id: ubsId,
        cra,
        nome: nome.trim(),
        cpf: cpfLimpo,
        data_nascimento,
        telefone: telefone || null,
        email: email || null,
        ativo: false,
      })
      .returning(['id', 'ubs_id', 'cra', 'nome']);

    // Comunicado individual de boas-vindas: aparece no portal do paciente logo no
    // primeiro acesso, sem depender de aprovacao manual do gestor.
    await knex('comunicados').insert({
      titulo: 'Bem-vindo ao Gestao Saude UBS+!',
      mensagem: 'Seu cadastro foi realizado com sucesso. Para ativar todos os recursos do sistema, agende uma visita à sua UBS para validação de documentos. Apresente um documento com foto e comprovante de residência.',
      tipo: 'individual',
      paciente_id: paciente.id,
      ubs_id: ubsId,
      urgente: false,
      criado_em: knex.fn.now(),
    });

    // Notifica gestores ativos da UBS para que acompanhem o novo cadastro sem
    // bloquear o acesso imediato do paciente.
    const gestores = await knex('usuarios_gestores')
      .where({ ubs_id: Number(ubs_id), ativo: true })
      .select('id');
    await Promise.allSettled(gestores.map(gestor => pushService.enviar(
      gestor.id,
      'gestor',
      {
        titulo: 'Novo paciente cadastrado',
        corpo: `${paciente.nome} solicitou acesso a unidade. Acesse Pacientes para visualizar.`,
        url: '/gestor/pacientes',
      }
    )));

    // Registra a notificação operacional no banco de dados para o painel do gestor
    await gestorNotificationService.criarNotificacao(ubsId, {
      tipo_evento: 'novo_paciente',
      titulo: 'Novo paciente cadastrado',
      mensagem: `${paciente.nome} realizou auto-cadastro no portal.`,
      rota_destino: '/pacientes',
      entidade: 'pacientes',
      entidade_id: paciente.id
    });

    await registrarAuditoria(req, {
      ator_tipo: 'paciente',
      acao: 'cadastro_paciente_solicitado',
      entidade: 'pacientes',
      entidade_id: paciente.id,
      escopo_ubs_id: ubsId,
      metadata: { cra: paciente.cra },
    });

    return res.status(201).json({
      mensagem: 'Cadastro realizado com sucesso! Voce ja pode acessar o portal com seu CRA e data de nascimento.',
      cra: paciente.cra,
      nome: paciente.nome,
      ubs: ubs.nome,
    });
  } catch (err) {
    console.error('[POST /auth/cadastro-paciente]', err.message);
    if (err.code === '23505') {
      return res.status(409).json({ error: MENSAGENS.PACIENTE.DADOS_INVALIDOS });
    }
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

function normalizar(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

router.get('/buscar-bairro', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const normalizadoQ = normalizar(q);

    const resultados = await knex('bairros_ubs as b')
      .join('ubs as u', 'u.id', 'b.ubs_id')
      .where('u.ativa', true)
      .where('b.bairro_busca', 'like', `%${normalizadoQ}%`)
      .select(
        'b.bairro',
        'b.ubs_id',
        'u.nome as ubs_nome',
        'u.endereco as ubs_endereco',
        'u.bairro as ubs_bairro',
        'u.telefone as ubs_telefone'
      )
      .orderByRaw('CASE WHEN b.bairro_busca = ? THEN 0 ELSE 1 END', [normalizadoQ])
      .orderBy('b.bairro', 'asc')
      .limit(8);

    return res.json(resultados);
  } catch (err) {
    console.error('[GET /auth/buscar-bairro]', err);
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROTA: POST /auth/reset-senha/solicitar
// FUNÇÃO: Solicita instruções de redefinição de senha para o gestor.
//         Gera um token criptográfico e simula/envia e-mail pelo Resend.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/reset-senha/solicitar', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: MENSAGENS.PACIENTE.DADOS_INVALIDOS });
    }

    const emailNormalizado = email.trim().toLowerCase();
    
    // Busca o gestor ativo pelo e-mail
    const gestor = await knex('usuarios_gestores')
      .where({ email: emailNormalizado, ativo: true })
      .first();

    // Se o gestor não for encontrado, retornamos sucesso genérico mesmo assim.
    // Isso evita ataques de enumeração de e-mail (OWASP Top 10).
    if (!gestor) {
      return res.json({ mensagem: 'Se o e-mail estiver cadastrado, você receberá as instruções.' });
    }

    // Gera um token criptográfico forte e define expiração em 1 hora
    const token = crypto.randomBytes(32).toString('hex');
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // 1 hora a partir de agora

    // Salva o token na tabela reset_senha_tokens
    await knex('reset_senha_tokens').insert({
      gestor_id: gestor.id,
      token,
      expira_em: expiraEm,
      usado: false,
    });

    // Monta o link para o frontend redefinir a senha
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkReset = `${frontendUrl}/reset-senha?token=${token}`;

    // Dispara o envio do e-mail
    await emailService.enviarEmailResetSenha({
      email: emailNormalizado,
      nome: gestor.nome,
      linkReset,
    });

    // Registra o evento de solicitação no log de auditoria
    await registrarAuditoria(req, {
      ator_tipo: 'gestor',
      ator_id: gestor.id,
      ubs_id: gestor.ubs_id,
      escopo_ubs_id: gestor.ubs_id,
      acao: 'RESET_SENHA_SOLICITADO',
      entidade: 'usuarios_gestores',
      entidade_id: gestor.id,
    });

    return res.json({ mensagem: 'Se o e-mail estiver cadastrado, você receberá as instruções.' });
  } catch (err) {
    console.error('[POST /auth/reset-senha/solicitar]', err);
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROTA: POST /auth/reset-senha/confirmar
// FUNÇÃO: Executa a redefinição de senha do gestor de fato, recebendo o token.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/reset-senha/confirmar', async (req, res) => {
  try {
    const { token, nova_senha } = req.body;
    if (!token || !nova_senha) {
      return res.status(400).json({ error: MENSAGENS.PACIENTE.DADOS_INVALIDOS });
    }

    if (nova_senha.length < 8) {
      return res.status(400).json({ error: MENSAGENS.PACIENTE.DADOS_INVALIDOS });
    }

    // Busca o token associado na base de dados
    const tokenValido = await knex('reset_senha_tokens')
      .where({ token, usado: false })
      .andWhere('expira_em', '>', knex.fn.now())
      .first();

    if (!tokenValido) {
      return res.status(400).json({ error: MENSAGENS.PACIENTE.DADOS_INVALIDOS });
    }

    // Faz hash com bcrypt da nova senha
    const hash = await bcrypt.hash(nova_senha, 12);

    await knex.transaction(async (trx) => {
      // Atualiza a senha e incrementa a versão do token do gestor (desloga de outros locais)
      await trx('usuarios_gestores')
        .where({ id: tokenValido.gestor_id })
        .update({
          senha_hash: hash,
          token_version: trx.raw('token_version + 1'),
          atualizado_em: trx.fn.now(),
        });

      // Marca o token como usado
      await trx('reset_senha_tokens')
        .where({ id: tokenValido.id })
        .update({ usado: true });
    });

    // Registra o evento de sucesso de troca de senha no log de auditoria
    await registrarAuditoria(req, {
      ator_tipo: 'gestor',
      ator_id: tokenValido.gestor_id,
      acao: 'RESET_SENHA_CONFIRMADO',
      entidade: 'usuarios_gestores',
      entidade_id: tokenValido.gestor_id,
    });

    return res.json({ mensagem: 'Senha atualizada com sucesso.' });
  } catch (err) {
    console.error('[POST /auth/reset-senha/confirmar]', err);
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

module.exports = router;
