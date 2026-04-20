/**
 * MIGRATION 003 — Tabela: pacientes
 * Finalidade: Munícipes de SJC cadastrados no sistema (usuários do Portal do Paciente).
 * Depende de: ubs
 * Login do paciente: CRA + data_nascimento (sem senha — padrão da Prefeitura de SJC)
 */
exports.up = function(knex) {
  return knex.schema.createTable('pacientes', (table) => {
    table.increments('id').primary();
    table.integer('ubs_id').unsigned()
      .references('id').inTable('ubs')
      .onDelete('CASCADE');                                    // UBS de referência do paciente
    table.string('cra', 20).unique().notNullable();            // Cadastro de Regulação Ambulatorial — chave de login
    table.string('nome', 150).notNullable();                   // Nome completo
    table.string('cpf', 14).unique();                          // CPF (armazenado com máscara: 000.000.000-00)
    table.date('data_nascimento').notNullable();               // Usada na autenticação junto com o CRA
    table.string('telefone', 20);                              // Celular para notificações futuras
    table.string('email', 150);                               // E-mail opcional para notificações
    table.boolean('ativo').defaultTo(true);                    // Cadastro ativo ou inativo
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').defaultTo(knex.fn.now()); // Rastrear última atualização cadastral
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('pacientes');
};
