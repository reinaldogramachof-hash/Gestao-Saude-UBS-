/**
 * MIGRATION 028 — Tabelas: notificacoes_gestor e notificacoes_gestor_leitura
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Cria a estrutura de dados para o subsistema de notificações operacionais
 *         dos gestores de UBS.
 * 
 * ESTRUTURA:
 *   1. notificacoes_gestor: Armazena alertas operacionais direcionados a uma UBS inteira.
 *   2. notificacoes_gestor_leitura: Registra a leitura individual de cada gestor
 *      sobre um alerta, garantindo que a visualização de um não interfira no outro.
 * 
 * DEPENDÊNCIAS:
 *   - ubs: para associar a notificação à unidade correta.
 *   - usuarios_gestores: para registrar a leitura de cada gestor individualmente.
 * ─────────────────────────────────────────────────────────────────────────────
 */

exports.up = async function (knex) {
  // Cria a tabela principal de alertas operacionais da UBS
  await knex.schema.createTable('notificacoes_gestor', (table) => {
    table.increments('id').primary();
    // Associação obrigatória com a UBS de destino do alerta
    table.integer('ubs_id').unsigned().notNullable()
      .references('id').inTable('ubs').onDelete('CASCADE');
    
    // Categoria do evento para definição de ícones e lógica de negócio
    table.string('tipo_evento', 50).notNullable(); 
    
    // Título e mensagem descritiva (sem dados sensíveis como CPF para LGPD)
    table.string('titulo', 255).notNullable();
    table.text('mensagem').notNullable();
    
    // Rota amigável para navegação direta no clique do frontend (ex: '/pacientes')
    table.string('rota_destino', 255);
    
    // Campos opcionais de auditoria e vinculação de registros
    table.string('entidade', 50);
    table.integer('entidade_id');
    table.jsonb('metadata_json');
    
    table.timestamp('criado_em').defaultTo(knex.fn.now());

    // Índices de otimização para buscas por UBS e ordenação cronológica
    table.index('ubs_id');
    table.index('criado_em');
  });

  // Cria a tabela secundária para controle individual de leitura
  await knex.schema.createTable('notificacoes_gestor_leitura', (table) => {
    table.increments('id').primary();
    // Vinculação obrigatória com a notificação
    table.integer('notificacao_id').unsigned().notNullable()
      .references('id').inTable('notificacoes_gestor').onDelete('CASCADE');
    // Vinculação obrigatória com o gestor que efetuou a leitura
    table.integer('gestor_id').unsigned().notNullable()
      .references('id').inTable('usuarios_gestores').onDelete('CASCADE');
    
    table.timestamp('lido_em').defaultTo(knex.fn.now());

    // Chave única composta para blindar o banco contra leituras duplicadas do mesmo gestor
    table.unique(['notificacao_id', 'gestor_id']);
    
    // Índice para otimização de contagem e listagem de não lidas por gestor
    table.index('gestor_id');
  });
};

exports.down = async function (knex) {
  // Remove primeiro a tabela dependente para preservar integridade referencial
  await knex.schema.dropTableIfExists('notificacoes_gestor_leitura');
  await knex.schema.dropTableIfExists('notificacoes_gestor');
};
