/**
 * ROTAS DE AUDITORIA CENTRAL (routes/audit.js)
 * -----------------------------------------------------------------------------
 * FUNCAO: Permite que administradores consultem a trilha central de auditoria
 *         do sistema com filtros operacionais e paginação simples.
 *
 * SEGURANCA:
 * - Todas as rotas chegam aqui somente apos JWT valido.
 * - GET /logs exige perfil admin.
 * - GET /logs/paciente/:pacienteId aceita admin e gestor, com escopo limitado
 *   pela UBS do token quando o perfil nao for admin.
 * -----------------------------------------------------------------------------
 */
const express = require('express');
const knex = require('../db/knex');
const { requirePerfil } = require('../middleware/authorization');

const router = express.Router();

function requerPerfilAdminOuGestor(req, res, next) {
  if (!['admin', 'gestor'].includes(req.user?.perfil)) {
    return res.status(403).json({ error: 'Perfil sem permissao para consultar auditoria.' });
  }
  return next();
}

function aplicarFiltrosBase(query, filtros) {
  if (filtros.usuario_id) {
    query.where('usuario_id', Number(filtros.usuario_id));
  }

  if (filtros.entidade) {
    query.where('entidade', String(filtros.entidade).toLowerCase());
  }

  if (filtros.resultado) {
    query.where('resultado', String(filtros.resultado).toLowerCase());
  }

  if (filtros.ubs_id) {
    query.where('ubs_id', Number(filtros.ubs_id));
  }

  if (filtros.data_inicio) {
    query.where('created_at', '>=', filtros.data_inicio);
  }

  if (filtros.data_fim) {
    query.where('created_at', '<=', filtros.data_fim);
  }
}

router.get('/logs', requirePerfil(['admin']), async (req, res) => {
  try {
    const limit = 50;
    const offset = Number(req.query.offset || 0);
    const query = knex('security_audit_logs')
      .select(
        'id',
        'created_at',
        'usuario_id',
        'usuario_tipo',
        'ubs_id',
        'acao',
        'entidade',
        'entidade_id',
        'resultado',
        'detalhe',
        'ip_origem',
        'http_status'
      )
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    aplicarFiltrosBase(query, req.query);

    const logs = await query;
    return res.json({ limit, offset, total: logs.length, logs });
  } catch (err) {
    console.error('[GET /audit/logs]', err);
    return res.status(500).json({ error: 'Erro ao consultar logs de auditoria.' });
  }
});

router.get('/logs/paciente/:pacienteId', requerPerfilAdminOuGestor, async (req, res) => {
  try {
    const pacienteId = Number(req.params.pacienteId);
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
        'gestor.perfil as usuario_perfil',
        'ubs.nome as ubs_nome'
      )
      .where((builder) => {
        builder
          .where(function () {
            this.where('logs.entidade', 'paciente')
              .where('logs.entidade_id', pacienteId)
              .where('logs.acao', 'VISUALIZACAO_PACIENTE');
          })
          .orWhere(function () {
            this.where('logs.acao', 'VISUALIZACAO_PACIENTE')
              .whereRaw("CAST(logs.detalhe AS TEXT) ILIKE ?", [`%${pacienteId}%`]);
          })
          .orWhere(function () {
            this.where('logs.acao', 'VISUALIZACAO_PACIENTE')
              .whereRaw("CAST(logs.metadata AS TEXT) ILIKE ?", [`%${pacienteId}%`]);
          });
      })
      .orderBy('logs.created_at', 'desc');

    if (req.user?.perfil !== 'admin') {
      query.andWhere('logs.ubs_id', Number(req.user.ubs_id));
    }

    if (req.query.data_inicio) {
      query.andWhere('logs.created_at', '>=', req.query.data_inicio);
    }

    if (req.query.data_fim) {
      query.andWhere('logs.created_at', '<=', `${req.query.data_fim} 23:59:59`);
    }

    const logs = await query;
    return res.json({ paciente_id: pacienteId, total: logs.length, logs });
  } catch (err) {
    console.error('[GET /audit/logs/paciente/:pacienteId]', err);
    return res.status(500).json({ error: 'Erro ao consultar auditoria do paciente.' });
  }
});

module.exports = router;
