/**
 * MIGRATION 004 — Tabela: medicamentos
 * Finalidade: Controle de disponibilidade de medicamentos por UBS.
 * O paciente consulta esta tabela antes de ir à unidade buscar o remédio.
 * Depende de: ubs, usuarios_gestores
 */
exports.up = function(knex) {
  return knex.schema.createTable('medicamentos', (table) => {
    table.increments('id').primary();
    table.integer('ubs_id').unsigned()
      .references('id').inTable('ubs')
      .onDelete('CASCADE');                                    // UBS onde o medicamento está (ou não)
    table.string('nome', 200).notNullable();                   // Nome do medicamento
    table.string('principio_ativo', 200);                      // Substância ativa (ex: "Metformina 500mg")
    table.boolean('disponivel').defaultTo(false);              // Está disponível no estoque agora?
    table.text('observacao');                                  // Ex: "Previsão de chegada na quinta-feira"
    table.timestamp('atualizado_em').defaultTo(knex.fn.now()); // Quando o estoque foi atualizado pela última vez
    table.integer('atualizado_por').unsigned()
      .references('id').inTable('usuarios_gestores')
      .onDelete('SET NULL');                                   // SET NULL: se gestor for removido, mantém o registro
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('medicamentos');
};
