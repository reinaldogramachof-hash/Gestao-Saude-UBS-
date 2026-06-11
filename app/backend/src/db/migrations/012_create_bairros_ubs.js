/**
 * MIGRATION 012 — Tabela: bairros_ubs
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Mapeia bairros de São José dos Campos (SJC) para a UBS responsável.
 *         Resolve o problema de auto-cadastro onde o cidadão sabe onde mora,
 *         mas não sabe qual UBS cobre a sua região.
 *
 * DETALHES:
 * - ubs_id: FK para a tabela de UBS
 * - bairro: Nome oficial do bairro para exibição
 * - bairro_busca: Nome normalizado (sem acentos/lowercase) para match rápido
 * ─────────────────────────────────────────────────────────────────────────────
 */

exports.up = function(knex) {
  return knex.schema.createTable('bairros_ubs', (table) => {
    table.increments('id').primary();
    
    // Relação com a tabela UBS
    table.integer('ubs_id').unsigned().notNullable()
      .references('id').inTable('ubs')
      .onDelete('CASCADE');

    table.string('bairro', 150).notNullable();
    table.string('bairro_busca', 150).notNullable();

    // Garante que não tenhamos duplicidade exata do mesmo bairro para a mesma UBS
    table.unique(['ubs_id', 'bairro']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('bairros_ubs');
};
