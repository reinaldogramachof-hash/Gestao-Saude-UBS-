/**
 * MIGRATION 010 — Tabela: push_subscriptions
 * Finalidade: Armazena as inscrições de push notification de cada usuário.
 * Quando o browser do paciente ou gestor aceita receber notificações, os dados
 * da inscrição (endpoint + chaves) são salvos aqui.
 * Uma pessoa pode ter múltiplos dispositivos inscritos (celular + computador).
 * Depende de: nenhuma — não referencia outras tabelas por design (gestores e
 * pacientes compartilham a tabela, diferenciados pelo campo tipo_usuario).
 */
exports.up = function (knex) {
  return knex.schema.createTable('push_subscriptions', (table) => {
    table.increments('id').primary();
    table.integer('usuario_id').unsigned().notNullable();        // ID do paciente ou gestor
    table.string('tipo_usuario', 10).notNullable();              // 'paciente' ou 'gestor'
    table.text('endpoint').notNullable();                        // URL única do navegador para envio
    table.text('p256dh').notNullable();                          // Chave pública do navegador (criptografia)
    table.text('auth').notNullable();                            // Segredo de autenticação do navegador
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    // Garante que o mesmo endpoint não seja salvo duas vezes
    table.unique(['usuario_id', 'tipo_usuario', 'endpoint']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('push_subscriptions');
};
