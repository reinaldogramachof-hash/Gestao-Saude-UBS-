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
 * @param {number} usuarioId   — ID do paciente ou gestor
 * @param {string} tipoUsuario — 'paciente' ou 'gestor'
 * @param {object} payload     — { titulo, corpo, url } da notificação
 */
async function enviar(usuarioId, tipoUsuario, payload) {
  try {
    // Busca todas as subscriptions ativas deste usuário (pode ter celular + desktop)
    const subscriptions = await knex('push_subscriptions')
      .where({ usuario_id: usuarioId, tipo_usuario: tipoUsuario });

    if (subscriptions.length === 0) return;

    const mensagem = JSON.stringify({
      titulo: payload.titulo,
      corpo:  payload.corpo,
      url:    payload.url || '/',
    });

    // Dispara para todos os dispositivos em paralelo
    const envios = subscriptions.map(async (sub) => {
      const subscriptionObj = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(subscriptionObj, mensagem);
      } catch (err) {
        // 410 Gone = subscription expirou ou foi removida pelo usuário — limpa do banco
        if (err.statusCode === 410 || err.statusCode === 404) {
          await knex('push_subscriptions').where({ id: sub.id }).delete();
        }
        // Outros erros são logados mas não interrompem os demais envios
      }
    });

    await Promise.allSettled(envios);
  } catch (err) {
    console.error('[pushService.enviar]', err.message);
  }
}

module.exports = { enviar };
