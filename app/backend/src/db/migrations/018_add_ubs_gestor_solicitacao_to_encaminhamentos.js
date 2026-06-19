// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 018 — Adiciona isolamento multi-tenant à tabela encaminhamentos.
//
// PROBLEMA CORRIGIDO: A migration original (20260618030419) criou a tabela sem
// ubs_id, permitindo que gestores de UBSs diferentes vissem os mesmos dados.
//
// NOVAS COLUNAS:
//   ubs_id        — isolamento por UBS (filtragem em todas as queries)
//   gestor_id     — rastreabilidade de quem criou o encaminhamento
//   solicitacao_id — bridge opcional com a tabela solicitacoes (NULL = avulso)
//   atualizado_em — timestamp de última modificação para auditoria
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('encaminhamentos', table => {
    // FK para UBS — isola dados por unidade (pode ser NULL em registros legados)
    table.integer('ubs_id').unsigned().nullable().references('id').inTable('ubs').onDelete('CASCADE');
    // FK para gestor que criou — SET NULL se gestor for removido do sistema
    table.integer('gestor_id').unsigned().nullable().references('id').inTable('usuarios_gestores').onDelete('SET NULL');
    // Bridge opcional com solicitacoes — permite o ciclo de status automático
    table.integer('solicitacao_id').unsigned().nullable().references('id').inTable('solicitacoes').onDelete('SET NULL');
    // Timestamp de última atualização
    table.timestamp('atualizado_em').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('encaminhamentos', table => {
    table.dropColumn('ubs_id');
    table.dropColumn('gestor_id');
    table.dropColumn('solicitacao_id');
    table.dropColumn('atualizado_em');
  });
};
