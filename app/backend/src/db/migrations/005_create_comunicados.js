/**
 * MIGRATION 005 — Tabela: comunicados
 * Finalidade: Mensagens/avisos enviados pela gestão da UBS.
 * Podem ser gerais (para todos os pacientes da UBS) ou individuais (para um paciente específico).
 * Depende de: ubs, usuarios_gestores, pacientes
 */
exports.up = function(knex) {
  return knex.schema.createTable('comunicados', (table) => {
    table.increments('id').primary();
    table.integer('ubs_id').unsigned()
      .references('id').inTable('ubs')
      .onDelete('CASCADE');                                    // UBS que enviou o comunicado
    table.integer('gestor_id').unsigned()
      .references('id').inTable('usuarios_gestores')
      .onDelete('SET NULL');                                   // Quem criou o comunicado
    table.integer('paciente_id').unsigned()
      .references('id').inTable('pacientes')
      .onDelete('CASCADE')
      .nullable();                                            // NULL = comunicado geral para toda a UBS
    table.string('titulo', 200).notNullable();                 // Título do comunicado
    table.text('mensagem').notNullable();                      // Texto completo
    table.string('tipo', 20).defaultTo('geral');              // 'geral' ou 'individual'
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('comunicados');
};
