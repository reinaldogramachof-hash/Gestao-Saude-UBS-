/**
 * MIDDLEWARE: auditLog
 * -----------------------------------------------------------------------------
 * Permite registrar eventos simples diretamente na cadeia de middlewares.
 * Rotas com entidade criada/alterada dinamicamente continuam chamando
 * registrarAuditoria manualmente para informar o ID correto do registro.
 */
const { registrarAuditoria } = require('../services/auditService');

module.exports = function auditLog(config) {
  return async (req, res, next) => {
    await registrarAuditoria(req, {
      acao:          config.acao,
      entidade:      config.entidade,
      entidade_id:   config.entidade_id?.(req) ?? null,
      escopo_ubs_id: config.escopo_ubs_id?.(req) ?? req.user?.ubs_id ?? null,
      metadata:      config.metadata?.(req) ?? null,
    });
    next();
  };
};
