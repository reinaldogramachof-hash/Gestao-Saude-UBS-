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
const { registrarAuditoria } = require('../services/auditService');
const pushService = require('../services/pushService');
const { loginGestorSchema, loginPacienteSchema, loginExternaSchema } = require('../validators/securitySchemas');

const router = express.Router();

function gerarJwtSeguro(payload, options) {
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64)) {
    throw new Error('JWT_SECRET inseguro ou ausente em producao.');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Muitas tentativas de login a partir deste IP. Por favor, tente novamente apos 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const cadastroRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
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
      return res.status(401).json({ error: 'Credenciais invalidas.' });
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
      return res.status(401).json({ error: 'Credenciais invalidas.' });
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
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.post('/login-paciente', loginRateLimiter, validateBody(loginPacienteSchema), async (req, res) => {
  try {
    const { cra, data_nascimento } = req.body;

    const paciente = await knex('pacientes')
      .where({ cra, ativo: true })
      .whereRaw('data_nascimento = ?', [data_nascimento])
      .first();

    if (!paciente) {
      await registrarAuditoria(req, {
        ator_tipo: 'paciente',
        acao: 'login_paciente_falha',
        entidade: 'pacientes',
        metadata: { cra },
      });
      return res.status(401).json({ error: 'CRA ou data de nascimento nao conferem.' });
    }

    const payload = {
      id: paciente.id,
      nome: paciente.nome,
      ubs_id: paciente.ubs_id,
      tipo: 'paciente',
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
    return res.status(500).json({ error: 'Erro interno do servidor.' });
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
    return res.status(500).json({ error: 'Erro interno do servidor.' });
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
    return res.status(500).json({ error: 'Erro ao buscar unidades de saude.' });
  }
});

router.post('/cadastro-paciente', cadastroRateLimiter, async (req, res) => {
  try {
    const { nome, data_nascimento, ubs_id, bairro, telefone, email, cpf } = req.body;
    const ubsId = Number(ubs_id);

    if (!nome || !data_nascimento || !ubsId || !bairro) {
      return res.status(400).json({
        error: 'Nome completo, data de nascimento, unidade de saude e bairro sao obrigatorios.',
      });
    }

    const ubs = await knex('ubs').where({ id: ubsId, ativa: true }).first();
    if (!ubs) {
      return res.status(404).json({ error: 'Unidade de saude nao encontrada ou inativa.' });
    }

    let cpfLimpo = null;
    if (cpf) {
      cpfLimpo = cpf.replace(/[^\d]/g, '');

      if (cpfLimpo.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpo)) {
        return res.status(400).json({ error: 'CPF invalido.' });
      }

      const cpfExiste = await knex('pacientes').where({ cpf: cpfLimpo }).first();
      if (cpfExiste) {
        return res.status(409).json({ error: 'CPF ja cadastrado no sistema.' });
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
      return res.status(500).json({ error: 'Nao foi possivel gerar CRA unico. Tente novamente.' });
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
        ativo: true,
      })
      .returning(['id', 'cra', 'nome', 'ubs_id']);

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
      return res.status(409).json({ error: 'Dados ja cadastrados. Tente novamente.' });
    }
    return res.status(500).json({ error: 'Erro ao realizar cadastro.' });
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
    return res.status(500).json({ error: 'Erro ao buscar bairro.' });
  }
});

module.exports = router;
