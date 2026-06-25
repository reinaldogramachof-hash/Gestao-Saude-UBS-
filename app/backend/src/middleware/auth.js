/**
 * MIDDLEWARE DE AUTENTICACAO (auth.js)
 * -----------------------------------------------------------------------------
 * Valida o JWT enviado no header Authorization e confirma no banco que a conta
 * ainda esta ativa. A checagem de token_version permite revogar sessoes antigas
 * apos troca de senha, desativacao ou incidente de seguranca.
 */
const jwt = require('jsonwebtoken');
const knex = require('../db/knex');

const TABELAS_POR_TIPO = {
  gestor: 'usuarios_gestores',
  paciente: 'pacientes',
  externa: 'unidades_externas',
};

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token nao fornecido!' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!TABELAS_POR_TIPO[decoded.tipo]) {
      return res.status(401).json({ error: 'Token invalido!' });
    }

    const tabela = TABELAS_POR_TIPO[decoded.tipo];
    const query = knex(tabela).where({ id: decoded.id });

    // ─────────────────────────────────────────────────────────────────────────
    // REGRA BANCA: Gestores e unidades externas precisam estar ativos (ativo = true).
    // Para pacientes, permitimos ativo = false para que recém-cadastrados consigam
    // manter a sessão autenticada, visualizar o onboarding e fazer o agendamento
    // que ativa sua conta automaticamente.
    // RISCO (PÓS-BANCA): Pacientes inativados por admin também passarão por aqui.
    // Pós-banca, deve-se implementar a coluna 'motivo_inativacao' ou similar
    // para distinguir pendentes de cadastro de inativados por exclusão/segurança.
    // ─────────────────────────────────────────────────────────────────────────
    if (decoded.tipo !== 'paciente') {
      query.where({ ativo: true });
    }

    const usuarioAtual = await query
      .select('id', 'token_version')
      .first();

    if (!usuarioAtual || Number(usuarioAtual.token_version || 0) !== Number(decoded.token_version || 0)) {
      return res.status(401).json({ error: 'sessao_expirada' });
    }

    req.userId = decoded.id;
    req.user = decoded;
    next();
  } catch (error) {
    // Erros de JWT (assinatura inválida, expirado, malformado) → 401
    // O jsonwebtoken lança JsonWebTokenError, TokenExpiredError ou NotBeforeError.
    // Qualquer outro erro (timeout de banco, query falha no cold start serverless)
    // deve retornar 503 para o frontend NÃO limpar o token nem forçar logout.
    const JWT_ERRORS = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'];
    if (JWT_ERRORS.includes(error.name)) {
      return res.status(401).json({ error: 'Token invalido!' });
    }
    console.error('[authMiddleware] Erro de infraestrutura (provavel cold start):', error.message);
    return res.status(503).json({ error: 'servico_indisponivel' });
  }
}

const soExterna = (req, res, next) => {
  if (req.user?.tipo !== 'externa') {
    return res.status(403).json({ error: 'Acesso exclusivo para unidades externas.' });
  }
  next();
};

module.exports = authMiddleware;
module.exports.soExterna = soExterna;
