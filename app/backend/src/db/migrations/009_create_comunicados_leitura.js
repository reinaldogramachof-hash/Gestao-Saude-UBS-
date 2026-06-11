/**
 * MIGRATION 009 — Criar tabela de leitura de comunicados
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Controlar quais comunicados foram lidos por quais pacientes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

exports.up = function(knex) {
  return knex.schema.createTable('comunicados_leitura', (table) => {
    table.increments('id').primary();
    
    table.integer('comunicado_id')
         .unsigned()
         .notNullable()
         .references('id')
         .inTable('comunicados')
         .onDelete('CASCADE');
         
    table.integer('paciente_id')
         .unsigned()
         .notNullable()
         .references('id')
         .inTable('pacientes')
         .onDelete('CASCADE');
         
    table.timestamp('lido_em').defaultTo(knex.fn.now());
    
    // Um paciente só pode marcar um comunicado como lido uma vez
    table.unique(['comunicado_id', 'paciente_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('comunicados_leitura');
};
