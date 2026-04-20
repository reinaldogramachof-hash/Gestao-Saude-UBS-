/**
 * MIGRATION 001 — Tabela: ubs
 * Finalidade: Representa cada Unidade Básica de Saúde cadastrada no sistema.
 * Esta é a tabela raiz — quase todas as outras dependem dela.
 */
exports.up = function(knex) {
  return knex.schema.createTable('ubs', (table) => {
    table.increments('id').primary();                          // Identificador único da UBS
    table.string('nome', 200).notNullable();                   // Nome oficial da UBS
    table.text('endereco').notNullable();                      // Endereço completo
    table.string('bairro', 100).notNullable();                 // Bairro onde está localizada
    table.string('telefone', 20);                              // Telefone de contato
    table.boolean('ativa').defaultTo(true);                    // Indica se a UBS está operacional
    table.timestamp('criado_em').defaultTo(knex.fn.now());     // Data de cadastro no sistema
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ubs');
};
