/**
 * MIDDLEWARES DE AUTORIZACAO
 * -----------------------------------------------------------------------------
 * Funcoes reutilizaveis para declarar, perto da rota, qual tipo de usuario e
 * quais perfis podem executar determinada acao.
 */
function requireTipo(tipoEsperado) {
  return (req, res, next) => {
    if (req.user?.tipo !== tipoEsperado) {
      return res.status(403).json({ error: `Acesso exclusivo para ${tipoEsperado}.` });
    }
    next();
  };
}

function requirePerfil(perfisPermitidos) {
  return (req, res, next) => {
    if (!perfisPermitidos.includes(req.user?.perfil)) {
      return res.status(403).json({ error: 'Perfil sem permissao para esta acao.' });
    }
    next();
  };
}

// Bloqueia médicos em rotas administrativas de // escrita (regulação, vigilância). Médicos têm acesso GET mas não POST/PUT/DELETE.
function soNaoMedico(req, res, next) {
  if (req.user?.perfil === 'medico') {
    return res.status(403).json({
      error: 'Perfil médico não autorizado para operações de escrita neste módulo.',
    });
  }
  return next();
}

module.exports = { requireTipo, requirePerfil, soNaoMedico };
