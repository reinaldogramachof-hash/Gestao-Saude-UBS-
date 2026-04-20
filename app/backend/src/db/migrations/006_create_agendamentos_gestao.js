/**
 * MIGRATION 006 — Tabela: agendamentos_gestao
 * Finalidade: Horários disponibilizados pela gestão para atendimento presencial.
 * Quando paciente_id é NULL, o slot está livre para ser reservado.
 * Depende de: ubs, pacientes, usuarios_gestores
 */
exports.up = function(knex) {
  return knex.schema.createTable('agendamentos_gestao', (table) => {
    table.increments('id').primary();
    table.integer('ubs_id').unsigned()
      .references('id').inTable('ubs')
      .onDelete('CASCADE');
    table.integer('paciente_id').unsigned()
      .references('id').inTable('pacientes')
      .onDelete('CASCADE')
      .nullable();                                            // NULL = horário disponível, ainda não reservado
    table.integer('gestor_responsavel_id').unsigned()
      .references('id').inTable('usuarios_gestores')
      .onDelete('SET NULL');                                   // Gestor que vai atender
    table.timestamp('data_hora').notNullable();               // Data e hora do atendimento
    table.integer('duracao_minutos').defaultTo(15);           // Duração prevista em minutos
    table.string('status', 20).defaultTo('disponivel');       // 'disponivel', 'reservado', 'concluido', 'cancelado'
    table.text('motivo');                                     // Motivo informado pelo paciente ao reservar
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('agendamentos_gestao');
};
