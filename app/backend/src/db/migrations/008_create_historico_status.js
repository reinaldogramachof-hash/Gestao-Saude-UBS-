/**
 * MIGRATION 008 — Tabela: historico_status
 * Finalidade: Registra CADA mudança de status de uma solicitação.
 * É a "linha do tempo" que o paciente vê na tela de detalhes.
 * Imutável por design: nunca deletar ou editar registros desta tabela.
 * Depende de: solicitacoes, usuarios_gestores
 */
exports.up = function(knex) {
  return knex.schema.createTable('historico_status', (table) => {
    table.increments('id').primary();
    table.integer('solicitacao_id').unsigned()
      .references('id').inTable('solicitacoes')
      .onDelete('CASCADE');                                    // Se a solicitação for removida, remove o histórico junto
    table.integer('gestor_id').unsigned()
      .references('id').inTable('usuarios_gestores')
      .onDelete('SET NULL');                                   // SET NULL: preserva o histórico mesmo se o gestor sair
    table.string('status_anterior', 50);                      // Status antes da mudança (NULL na criação inicial)
    table.string('status_novo', 50).notNullable();             // Novo status aplicado
    table.text('observacao');                                  // Justificativa ou mensagem registrada pelo gestor
    table.timestamp('alterado_em').defaultTo(knex.fn.now());  // Data e hora exata da alteração
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('historico_status');
};
