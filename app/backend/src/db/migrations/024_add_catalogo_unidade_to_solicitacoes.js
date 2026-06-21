/**
 * MIGRATION 024 - Vinculos opcionais de catalogo em solicitacoes
 * -----------------------------------------------------------------------------
 * Adiciona catalogo_id e unidade_externa_id como campos nullable. Isso preserva
 * todos os dados existentes e permite que a Parte B evolua gradualmente sem
 * obrigar o frontend a preencher os novos vinculos.
 */
exports.up = async function up(knex) {
  const hasCatalogoId = await knex.schema.hasColumn('solicitacoes', 'catalogo_id');
  if (!hasCatalogoId) {
    await knex.schema.alterTable('solicitacoes', (table) => {
      table.integer('catalogo_id').nullable()
        .references('id').inTable('catalogo_procedimentos')
        .onDelete('SET NULL');
    });
  }

  const hasUnidadeExternaId = await knex.schema.hasColumn('solicitacoes', 'unidade_externa_id');
  if (!hasUnidadeExternaId) {
    await knex.schema.alterTable('solicitacoes', (table) => {
      table.integer('unidade_externa_id').nullable()
        .references('id').inTable('unidades_externas')
        .onDelete('SET NULL');
    });
  }
};

exports.down = async function down(knex) {
  const hasUnidadeExternaId = await knex.schema.hasColumn('solicitacoes', 'unidade_externa_id');
  if (hasUnidadeExternaId) {
    await knex.schema.alterTable('solicitacoes', (table) => {
      table.dropColumn('unidade_externa_id');
    });
  }

  const hasCatalogoId = await knex.schema.hasColumn('solicitacoes', 'catalogo_id');
  if (hasCatalogoId) {
    await knex.schema.alterTable('solicitacoes', (table) => {
      table.dropColumn('catalogo_id');
    });
  }
};
