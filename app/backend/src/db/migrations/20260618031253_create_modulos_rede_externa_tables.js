/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Tabela: casos_sociais
  await knex.schema.createTable('casos_sociais', table => {
    table.increments('id').primary();
    table.integer('paciente_id').unsigned().references('id').inTable('pacientes').onDelete('CASCADE');
    table.string('vulnerabilidade').notNullable(); // FOME, VIOLENCIA_DOMESTICA, ABANDONO_TRATAMENTO, HIGIENE
    table.string('status').notNullable().defaultTo('EM_ACOMPANHAMENTO'); // EM_ACOMPANHAMENTO, ENCAMINHADO_CRAS, ALTA
    table.datetime('data_identificacao').notNullable().defaultTo(knex.fn.now());
    table.string('assistente_responsavel').nullable();
    table.text('relatorio_acoes').nullable();
  });

  // Tabela: transporte_sanitario
  await knex.schema.createTable('transporte_sanitario', table => {
    table.increments('id').primary();
    table.integer('paciente_id').unsigned().references('id').inTable('pacientes').onDelete('CASCADE');
    table.string('destino').notNullable(); // Ex: Hospital Francisca Júlia
    table.date('data_viagem').notNullable();
    table.time('horario_saida').notNullable();
    table.string('veiculo').notNullable(); // Ex: Van 01, Ambulância A
    table.string('status').notNullable().defaultTo('AGENDADO'); // AGENDADO, EM_TRANSITO, CONCLUIDO, FALTOU
    table.boolean('necessita_acompanhante').notNullable().defaultTo(false);
    table.boolean('cadeirante').notNullable().defaultTo(false);
  });

  // Tabela: notificacoes_vigilancia
  await knex.schema.createTable('notificacoes_vigilancia', table => {
    table.increments('id').primary();
    table.integer('paciente_id').unsigned().nullable().references('id').inTable('pacientes').onDelete('SET NULL');
    table.string('agravo').notNullable(); // Dengue, COVID-19, Sarampo, Tuberculose
    table.string('bairro').notNullable();
    table.string('cep').nullable();
    table.string('status_investigacao').notNullable().defaultTo('SUSPEITO'); // SUSPEITO, CONFIRMADO, DESCARTADO
    table.datetime('data_notificacao').notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('notificacoes_vigilancia');
  await knex.schema.dropTableIfExists('transporte_sanitario');
  await knex.schema.dropTableIfExists('casos_sociais');
};
