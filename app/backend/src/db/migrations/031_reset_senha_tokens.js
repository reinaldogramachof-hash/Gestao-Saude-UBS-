/**
// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION: 031_reset_senha_tokens.js
// TABELA: reset_senha_tokens
// FUNÇÃO: Cria a tabela para controle e validação de tokens de redefinição
//         de senha para os usuários gestores do sistema.
// DEPENDÊNCIAS: usuarios_gestores (cascade ao excluir gestor)
// ─────────────────────────────────────────────────────────────────────────────
 */

exports.up = function(knex) {
  return knex.schema.createTable('reset_senha_tokens', (table) => {
    table.increments('id').primary();
    
    // gestor_id aponta para usuarios_gestores (plural) em conformidade com o BD real
    table.integer('gestor_id').unsigned()
      .references('id').inTable('usuarios_gestores')
      .onDelete('CASCADE')
      .notNullable();

    table.string('token', 64).notNullable().unique();
    table.timestamp('expira_em').notNullable();
    table.boolean('usado').defaultTo(false);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  }).then(() => {
    // Cria índice específico para o token para agilizar buscas no login/reset
    return knex.schema.alterTable('reset_senha_tokens', (table) => {
      table.index('token');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('reset_senha_tokens');
};
