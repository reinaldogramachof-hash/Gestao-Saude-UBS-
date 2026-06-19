/**
 * MIGRATION 016 — Adiciona instrucoes_retirada na tabela medicamentos
 * ─────────────────────────────────────────────────────────────────────────────
 * Finalidade: Campo de texto livre onde o gestor registra as instruções práticas
 *             para retirada do medicamento na UBS (horário, documentos, local).
 *             Exibido ao paciente na tela de consulta de estoque.
 *
 * NOTA: Esta migration já foi aplicada manualmente via Supabase SQL Editor.
 *       Mantida aqui para documentação e rastreabilidade do schema.
 * ─────────────────────────────────────────────────────────────────────────────
 */
exports.up = async function(knex) {
  const hasCol = await knex.schema.hasColumn('medicamentos', 'instrucoes_retirada');
  if (!hasCol) {
    await knex.schema.alterTable('medicamentos', (table) => {
      table.text('instrucoes_retirada').nullable();
    });
  }
};

exports.down = async function(knex) {
  const hasCol = await knex.schema.hasColumn('medicamentos', 'instrucoes_retirada');
  if (hasCol) {
    await knex.schema.alterTable('medicamentos', (table) => {
      table.dropColumn('instrucoes_retirada');
    });
  }
};
