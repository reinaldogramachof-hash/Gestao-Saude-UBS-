/**
 * MIGRATION 002 — Tabela: usuarios_gestores
 * Finalidade: Profissionais da UBS que acessam o Portal do Gestor.
 * Depende de: ubs (002 deve rodar depois de 001)
 */
exports.up = function(knex) {
  return knex.schema.createTable('usuarios_gestores', (table) => {
    table.increments('id').primary();
    table.integer('ubs_id').unsigned()
      .references('id').inTable('ubs')
      .onDelete('CASCADE');                                    // Se a UBS for removida, remove os gestores também
    table.string('nome', 150).notNullable();                   // Nome completo do profissional
    table.string('email', 150).unique().notNullable();         // E-mail de login (único no sistema)
    table.string('senha_hash', 255).notNullable();             // Senha criptografada com bcrypt (nunca em texto puro)
    table.string('perfil', 30).notNullable();                  // 'recepcionista', 'gestor' ou 'admin'
    table.boolean('ativo').defaultTo(true);                    // Conta ativa ou desativada
    table.timestamp('criado_em').defaultTo(knex.fn.now());     // Data de criação da conta
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('usuarios_gestores');
};
