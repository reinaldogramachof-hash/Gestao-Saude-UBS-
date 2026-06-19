// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 019 — Adiciona isolamento multi-tenant à tabela notificacoes_vigilancia.
//
// MESMO PROBLEMA DA 018: tabela criada sem ubs_id na migration original.
//
// NOVAS COLUNAS:
//   ubs_id        — isolamento por UBS (filtragem em todas as queries)
//   gestor_id     — rastreabilidade de quem criou a notificação
//   atualizado_em — timestamp de última modificação para auditoria
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('notificacoes_vigilancia', table => {
    // FK para UBS — isola dados por unidade
    table.integer('ubs_id').unsigned().nullable().references('id').inTable('ubs').onDelete('CASCADE');
    // FK para gestor que cadastrou
    table.integer('gestor_id').unsigned().nullable().references('id').inTable('usuarios_gestores').onDelete('SET NULL');
    // Timestamp de última atualização
    table.timestamp('atualizado_em').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('notificacoes_vigilancia', table => {
    table.dropColumn('ubs_id');
    table.dropColumn('gestor_id');
    table.dropColumn('atualizado_em');
  });
};
