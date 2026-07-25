// ─────────────────────────────────────────────────────────────────────────────
// ROTAS PÚBLICAS (routes/publico.js)
// FUNÇÃO: Endpoints públicos sem autenticação JWT, protegidos por tokens opacos (nonces).
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const knex    = require('../db/knex');

const router = express.Router();

// ─── POST /api/public/notificacoes/ack ────────────────────────────────────────
// AUDITORIA: Confirmação de recebimento/entrega do WebPush via Service Worker sem JWT.
// SEGURANÇA: Exige obrigatoriamente um ack_token opaco (nonce de 64 caracteres) gerado
//            pelo servidor no momento do disparo. Não aceita requisições apenas com log_id.
router.post('/notificacoes/ack', async (req, res) => {
  try {
    const { ack_token } = req.body;
    
    // Validação estrita do token de segurança opaco
    if (!ack_token || typeof ack_token !== 'string' || ack_token.trim().length !== 64) {
      return res.status(400).json({ error: 'ack_token inválido ou ausente.' });
    }

    const log = await knex('notificacoes_paciente_log')
      .where({ ack_token: ack_token.trim() })
      .first();

    if (!log) {
      return res.status(404).json({ error: 'Registro de notificação não encontrado para o token fornecido.' });
    }

    // Transição idempotente: atualiza para ENTREGUE apenas se ainda estiver como DISPARADO
    if (log.status_envio === 'DISPARADO') {
      await knex('notificacoes_paciente_log')
        .where({ id: log.id })
        .update({
          status_envio: 'ENTREGUE',
          entregue_em: knex.fn.now(),
        });
    }

    return res.json({ ok: true, status: 'ENTREGUE' });
  } catch (err) {
    console.error('[POST /api/public/notificacoes/ack]', err);
    return res.status(500).json({ error: 'Erro interno ao registrar confirmação de entrega.' });
  }
});

module.exports = router;
