/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('encaminhamentos', table => {
    table.increments('id').primary();
    table.integer('paciente_id').unsigned().references('id').inTable('pacientes').onDelete('CASCADE');
    table.string('destino').notNullable(); // HOSPITAL_MUNICIPAL, CAPS, AME, OUTROS
    table.string('especialidade').notNullable(); // Psiquiatria, Ortopedia, Cirurgia Geral, etc
    table.string('prioridade').notNullable(); // VERDE, AMARELO, VERMELHO
    table.string('status').notNullable().defaultTo('AGUARDANDO_VAGA'); // AGUARDANDO_VAGA, AGENDADO, REALIZADO, CANCELADO
    table.datetime('data_solicitacao').notNullable().defaultTo(knex.fn.now());
    table.datetime('data_agendamento').nullable();
    table.text('observacoes').nullable();
    table.string('documento_guia').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('encaminhamentos');
};
