/**
 * MIDDLEWARES DE AUTORIZACAO
 * -----------------------------------------------------------------------------
 * Funcoes reutilizaveis para declarar, perto da rota, qual tipo de usuario e
 * quais perfis podem executar determinada acao.
 */
const MENSAGENS = require('../utils/mensagens');
function requireTipo(tipoEsperado) {
  return (req, res, next) => {
    if (req.user?.tipo !== tipoEsperado) {
      return res.status(403).json({ error: MENSAGENS.AUTH.ACESSO_NEGADO });
    }
    next();
  };
}

function requirePerfil(perfisPermitidos) {
  return (req, res, next) => {
    if (!perfisPermitidos.includes(req.user?.perfil)) {
      return res.status(403).json({ error: MENSAGENS.AUTH.ACESSO_NEGADO });
    }
    next();
  };
}

// Bloqueia médicos em rotas administrativas de // escrita (regulação, vigilância). Médicos têm acesso GET mas não POST/PUT/DELETE.
function soNaoMedico(req, res, next) {
  if (req.user?.perfil === 'medico') {
    return res.status(403).json({
      error: MENSAGENS.AUTH.ACESSO_NEGADO,
    });
  }
  return next();
}

module.exports = { requireTipo, requirePerfil, soNaoMedico };
