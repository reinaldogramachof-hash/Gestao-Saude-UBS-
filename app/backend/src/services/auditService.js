/**
 * SERVICO: auditService
 * -----------------------------------------------------------------------------
 * Centraliza o registro de eventos sensiveis de seguranca e LGPD.
 * A auditoria nunca deve derrubar a operacao principal: se o insert falhar,
 * registramos no console e seguimos para nao bloquear atendimento na UBS.
 */
const knex = require('../db/knex');

async function registrarAuditoria(req, dados) {
  try {
    const usuario = req?.user || {};
    const metadata = dados.metadata === undefined ? null : dados.metadata;

    await knex('security_audit_logs').insert({
      ator_tipo:     dados.ator_tipo || usuario.tipo || 'sistema',
      ator_id:       dados.ator_id ?? usuario.id ?? null,
      ator_perfil:   dados.ator_perfil || usuario.perfil || null,
      ator_ubs_id:   dados.ator_ubs_id ?? usuario.ubs_id ?? null,
      acao:          dados.acao,
      entidade:      dados.entidade,
      entidade_id:   dados.entidade_id ?? null,
      escopo_ubs_id: dados.escopo_ubs_id ?? null,
      ip:            req?.ip || req?.headers?.['x-forwarded-for'] || null,
      user_agent:    req?.headers?.['user-agent'] || null,
      metadata:      metadata ? JSON.stringify(metadata) : null,
    });
  } catch (err) {
    console.error('[auditService] falha ao registrar auditoria', err.message);
  }
}

module.exports = { registrarAuditoria };
