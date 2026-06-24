/**
 * MIGRATION 027
 * Adiciona a coluna segmentacao_clinica na tabela comunicados.
 * Será usada para filtrar avisos direcionados a grupos clínicos específicos (ex: Diabetes, Hipertensão).
 */

exports.up = function(knex) {
  return knex.schema.alterTable('comunicados', table => {
    table.string('segmentacao_clinica', 100).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('comunicados', table => {
    table.dropColumn('segmentacao_clinica');
  });
};
