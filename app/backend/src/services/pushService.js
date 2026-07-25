/**
 * SERVIÇO: pushService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Centraliza o envio de push notifications para pacientes e gestores.
 *         Usa a biblioteca web-push com autenticação VAPID.
 *
 * COMO FUNCIONA:
 *   1. O browser do usuário se inscreve e envia um objeto de subscription ao backend
 *   2. O backend salva essa subscription na tabela push_subscriptions
 *   3. Quando um evento ocorre (status atualizado, comunicado enviado...), este
 *      serviço busca as subscriptions do destinatário e envia a notificação
 *   4. Se a subscription expirou ou foi revogada, remove do banco automaticamente
 *
 * USO:
 *   const push = require('./pushService');
 *   await push.enviar(usuarioId, 'paciente', { titulo: '...', corpo: '...' });
 * ─────────────────────────────────────────────────────────────────────────────
 */
const crypto  = require('crypto');
const webpush = require('web-push');
const knex    = require('../db/knex');

// Configura as credenciais VAPID — geradas uma única vez e salvas no .env
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Envia uma notificação push para todos os dispositivos de um usuário.
 * E grava log de auditoria imutável na tabela notificacoes_paciente_log para pacientes.
 *
 * @param {number} usuarioId   — ID do paciente ou gestor
 * @param {string} tipoUsuario — 'paciente' ou 'gestor'
 * @param {object} payload     — { titulo, corpo, url, categoria, entidade, entidade_id, ubs_id }
 */
async function enviar(usuarioId, tipoUsuario, payload) {
  try {
    let logId = null;
    let ackToken = null;

    // ── AUDITORIA: Registra disparo no banco de dados para pacientes ─────────────
    if (tipoUsuario === 'paciente') {
      try {
        let ubsId = payload.ubs_id;
        if (!ubsId) {
          const pac = await knex('pacientes').where({ id: usuarioId }).select('ubs_id').first();
          if (pac) ubsId = pac.ubs_id;
        }

        // SEGURANÇA: Não atribuir UBS padrão (evita atribuição arbitrária de UBS).
        // Se a UBS não puder ser identificada com certeza, registra alerta e aborta a auditoria.
        if (!ubsId) {
          console.warn(`[pushService] Não foi possível determinar a UBS do paciente #${usuarioId}. Auditoria de log não criada.`);
        } else {
          // Geração de token opaco (nonce) seguro de 64 caracteres
          ackToken = crypto.randomBytes(32).toString('hex');

          const [novoLog] = await knex('notificacoes_paciente_log').insert({
            paciente_id: usuarioId,
            ubs_id: ubsId,
            ack_token: ackToken,
            canal: 'web_push',
            categoria: payload.categoria || 'status_solicitacao',
            titulo: payload.titulo,
            corpo_mensagem: payload.corpo,
            status_envio: 'DISPARADO',
            entidade: payload.entidade || null,
            entidade_id: payload.entidade_id || null,
            metadata_json: payload.metadata || { url: payload.url },
            disparado_em: knex.fn.now(),
          }).returning('id');

          logId = typeof novoLog === 'object' ? novoLog.id : novoLog;
        }
      } catch (logErr) {
        console.error('[pushService] Erro ao gravar log de auditoria:', logErr.message);
      }
    }

    // Busca todas as subscriptions ativas deste usuário (pode ter celular + desktop)
    const subscriptions = await knex('push_subscriptions')
      .where({ usuario_id: usuarioId, tipo_usuario: tipoUsuario });

    if (subscriptions.length === 0) {
      if (logId) {
        await knex('notificacoes_paciente_log')
          .where({ id: logId })
          .update({ status_envio: 'FALHA_DISPOSITIVO', detalhe_erro: 'Nenhuma assinatura Push cadastrada para o dispositivo.' });
      }
      return;
    }

    // Em producao o Service Worker roda no dominio do frontend. Por isso o ACK
    // recebe a URL publica do backend quando BACKEND_PUBLIC_URL/API_PUBLIC_URL existir.
    const apiBaseUrl = payload.api_base_url ||
      process.env.BACKEND_PUBLIC_URL ||
      process.env.API_PUBLIC_URL ||
      '';

    const mensagem = JSON.stringify({
      ack_token: ackToken,
      api_base_url: apiBaseUrl,
      titulo: payload.titulo,
      corpo:  payload.corpo,
      url:    payload.url || '/',
    });

    let houveSucesso = false;
    let ultimoErro = null;

    // Dispara para todos os dispositivos em paralelo
    const envios = subscriptions.map(async (sub) => {
      const subscriptionObj = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(subscriptionObj, mensagem);
        houveSucesso = true;
      } catch (err) {
        ultimoErro = err.message || 'Erro no envio WebPush';
        // 410 Gone = subscription expirou ou foi removida pelo usuário — limpa do banco
        if (err.statusCode === 410 || err.statusCode === 404) {
          await knex('push_subscriptions').where({ id: sub.id }).delete();
        }
      }
    });

    await Promise.allSettled(envios);

    // Se nenhum envio obteve sucesso, atualiza o log para FALHA_DISPOSITIVO
    if (logId && !houveSucesso) {
      await knex('notificacoes_paciente_log')
        .where({ id: logId })
        .update({ status_envio: 'FALHA_DISPOSITIVO', detalhe_erro: ultimoErro });
    }
  } catch (err) {
    console.error('[pushService.enviar]', err.message);
  }
}

module.exports = { enviar };
