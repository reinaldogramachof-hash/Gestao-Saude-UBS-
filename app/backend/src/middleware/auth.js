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
    const usuarioAtual = await knex(tabela)
      .where({ id: decoded.id, ativo: true })
      .select('id', 'token_version')
      .first();

    if (!usuarioAtual || Number(usuarioAtual.token_version || 0) !== Number(decoded.token_version || 0)) {
      return res.status(401).json({ error: 'sessao_expirada' });
    }

    req.userId = decoded.id;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido!' });
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
