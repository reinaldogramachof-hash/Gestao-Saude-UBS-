// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 033 — Adiciona coluna ack_token na tabela notificacoes_paciente_log
// FUNÇÃO: Token de segurança opaco (nonce) de 64 caracteres único por disparo.
//         Permite a confirmação de entrega segura (ACK) via Service Worker sem JWT.
// ─────────────────────────────────────────────────────────────────────────────

exports.up = async function up(knex) {
  const existeColuna = await knex.schema.hasColumn('notificacoes_paciente_log', 'ack_token');
  if (!existeColuna) {
    await knex.schema.alterTable('notificacoes_paciente_log', (table) => {
      table.string('ack_token', 64).unique().nullable();
      table.index('ack_token');
    });
  }
};

exports.down = async function down(knex) {
  const existeColuna = await knex.schema.hasColumn('notificacoes_paciente_log', 'ack_token');
  if (existeColuna) {
    await knex.schema.alterTable('notificacoes_paciente_log', (table) => {
      table.dropColumn('ack_token');
    });
  }
};
