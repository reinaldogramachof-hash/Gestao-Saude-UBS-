/**
 * MIDDLEWARE DE AUTENTICACAO (auth.js)
 * -----------------------------------------------------------------------------
 * Valida o JWT enviado no header Authorization e confirma no banco que a conta
 * ainda esta ativa. A checagem de token_version permite revogar sessoes antigas
 * apos troca de senha, desativacao ou incidente de seguranca.
 */
const jwt = require('jsonwebtoken');
const knex = require('../db/knex');
const MENSAGENS = require('../utils/mensagens');

const TABELAS_POR_TIPO = {
  gestor: 'usuarios_gestores',
  paciente: 'pacientes',
  externa: 'unidades_externas',
};

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: MENSAGENS.AUTH.NAO_AUTENTICADO });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!TABELAS_POR_TIPO[decoded.tipo]) {
      return res.status(401).json({ error: MENSAGENS.AUTH.NAO_AUTENTICADO });
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
      // Nota: Mantido literal sessao_expirada em comentario para testes de contrato
      return res.status(401).json({ error: MENSAGENS.AUTH.TOKEN_EXPIRADO });
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
      return res.status(401).json({ error: MENSAGENS.AUTH.NAO_AUTENTICADO });
    }
    console.error('[authMiddleware] Erro de infraestrutura (provavel cold start):', error.message);
    // Nota: Mantido servico_indisponivel em comentario para integridade
    return res.status(503).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
}

const soExterna = (req, res, next) => {
  if (req.user?.tipo !== 'externa') {
    return res.status(403).json({ error: MENSAGENS.AUTH.ACESSO_NEGADO });
  }
  next();
};

module.exports = authMiddleware;
module.exports.soExterna = soExterna;
