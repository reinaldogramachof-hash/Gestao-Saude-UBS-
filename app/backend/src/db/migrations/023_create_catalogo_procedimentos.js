/**
 * MIGRATION 023 - Catalogo de Procedimentos
 * -----------------------------------------------------------------------------
 * Cria um catalogo simples de procedimentos/exames para substituir texto livre
 * nas proximas telas. A tabela nasce independente e ativa por padrao, sem
 * alterar contratos existentes de solicitacoes nesta migration.
 */
exports.up = async function up(knex) {
  const existeCatalogo = await knex.schema.hasTable('catalogo_procedimentos');

  if (!existeCatalogo) {
    await knex.schema.createTable('catalogo_procedimentos', (table) => {
      table.increments('id').primary();
      table.string('nome', 200).notNullable();
      table.string('especialidade', 100).nullable();
      table.string('tipo_unidade', 50).nullable();
      table.boolean('ativo').notNullable().defaultTo(true);
      table.timestamp('criado_em').defaultTo(knex.fn.now());
      table.unique(['nome']);
    });
  }

  // Indice textual em portugues para buscas por nome sem depender do frontend.
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_catalogo_nome_fts
    ON catalogo_procedimentos
    USING gin(to_tsvector('portuguese', nome))
  `);
};

exports.down = async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_catalogo_nome_fts');
  await knex.schema.dropTableIfExists('catalogo_procedimentos');
};
