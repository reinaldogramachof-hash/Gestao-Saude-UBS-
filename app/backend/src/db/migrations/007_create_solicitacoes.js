/**
 * MIGRATION 007 — Tabela: solicitacoes
 * Finalidade: Cada pedido médico (exame, consulta, procedimento, cirurgia) de um paciente.
 * Esta é a tabela principal do sistema — o core da "transparência de fila".
 * O campo descricao_paciente exibe linguagem simples; descricao é o nome técnico.
 * Depende de: pacientes, ubs
 */
exports.up = function(knex) {
  return knex.schema.createTable('solicitacoes', (table) => {
    table.increments('id').primary();
    table.integer('paciente_id').unsigned()
      .references('id').inTable('pacientes')
      .onDelete('CASCADE');                                    // A quem pertence esta solicitação
    table.integer('ubs_id').unsigned()
      .references('id').inTable('ubs')
      .onDelete('CASCADE');                                    // UBS que gerou a solicitação
    table.string('tipo', 30).notNullable();                    // 'exame', 'consulta', 'procedimento', 'cirurgia'
    table.string('descricao', 300).notNullable();              // Nome técnico (ex: "Hemograma Completo")
    table.string('descricao_paciente', 300).notNullable();     // Versão simples para o paciente (ex: "Exame de sangue")
    table.string('status', 50).notNullable();                  // Estado atual — ver CHECK CONSTRAINT abaixo
    table.string('prioridade', 20).defaultTo('rotina');        // 'urgente', 'prioritario', 'rotina'
    table.date('data_solicitacao').notNullable();              // Quando o médico fez o pedido
    table.date('data_prevista');                               // Previsão de realização (ou data confirmada)
    table.date('data_conclusao');                              // Quando foi concluído (NULL se ainda em andamento)
    table.text('observacao_gestor');                           // Nota interna da equipe (não exibida ao paciente)
    table.text('observacao_paciente');                         // Mensagem exibida ao paciente sobre esta solicitação
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').defaultTo(knex.fn.now());
  }).then(() => {
    // CHECK CONSTRAINT: garante que apenas status válidos sejam gravados no banco.
    // Isso evita que um bug no código grave um status inválido (ex: "erro_digitacao").
    return knex.raw(`
      ALTER TABLE solicitacoes
      ADD CONSTRAINT check_status_valido
      CHECK (status IN (
        'em_analise',
        'aguardando_regulacao',
        'autorizado',
        'data_marcada',
        'aguardando_resultado',
        'concluido',
        'cancelado'
      ))
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('solicitacoes');
};
