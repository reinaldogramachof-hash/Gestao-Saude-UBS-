/**
 * MIGRATION 017 — Adiciona campo urgente na tabela comunicados
 * ─────────────────────────────────────────────────────────────────────────────
 * Finalidade: Substitui a heurística de palavras-chave (TASK_15) por um campo
 *             explícito que o gestor marca ao criar o comunicado.
 *             O frontend usa esse campo para:
 *               - Estilização visual com destaque vermelho
 *               - Ordenação prioritária (urgentes sempre no topo)
 *               - Substituir o badge "Urgente" que antes dependia de palavras no título
 *
 * NOTA: Esta migration já foi aplicada manualmente via Supabase SQL Editor.
 *       Mantida aqui para documentação e rastreabilidade do schema.
 * ─────────────────────────────────────────────────────────────────────────────
 */
exports.up = async function(knex) {
  const hasCol = await knex.schema.hasColumn('comunicados', 'urgente');
  if (!hasCol) {
    await knex.schema.alterTable('comunicados', (table) => {
      table.boolean('urgente').defaultTo(false);
    });
  }
};

exports.down = async function(knex) {
  const hasCol = await knex.schema.hasColumn('comunicados', 'urgente');
  if (hasCol) {
    await knex.schema.alterTable('comunicados', (table) => {
      table.dropColumn('urgente');
    });
  }
};
