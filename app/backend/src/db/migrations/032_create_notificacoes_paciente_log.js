// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 032 — Tabela: notificacoes_paciente_log
// FUNÇÃO: Estrutura de banco de dados para a auditoria imutável e histórico de
//         notificações enviadas aos pacientes (Web Push, Comunicados e Alertas).
//
// CONTRATO DE AUDITORIA:
//   - Timestamps salvos em ISO 8601 (disparado_em, entregue_em, lido_em).
//   - RETENÇÃO: Consultas padrão filtram a janela operacional dos últimos 12 meses.
// ─────────────────────────────────────────────────────────────────────────────

exports.up = async function up(knex) {
  const existeTabela = await knex.schema.hasTable('notificacoes_paciente_log');
  if (!existeTabela) {
    await knex.schema.createTable('notificacoes_paciente_log', (table) => {
      table.increments('id').primary();
      
      // Vinculação obrigatória com o paciente e a UBS responsável
      table.integer('paciente_id').unsigned().notNullable()
        .references('id').inTable('pacientes').onDelete('CASCADE');
      table.integer('ubs_id').unsigned().notNullable()
        .references('id').inTable('ubs').onDelete('CASCADE');
        
      // Canal e Categoria do evento para filtros de auditoria
      table.string('canal', 30).notNullable();       // 'web_push', 'comunicado_app', 'whatsapp', 'sms'
      table.string('categoria', 50).notNullable();   // 'status_solicitacao', 'agendamento_externo', 'comunicado_urgente', 'retorno_prioritario'
      
      // Conteúdo transmitido ao paciente
      table.string('titulo', 255).notNullable();
      table.text('corpo_mensagem').notNullable();
      
      // Status de ciclo de vida do disparo
      table.string('status_envio', 30).notNullable().defaultTo('DISPARADO'); // 'DISPARADO', 'ENTREGUE', 'FALHA_DISPOSITIVO', 'LIDO'
      table.text('detalhe_erro'); // Motivo de falha caso o WebPush rejeite a subscrição
      
      // Referências cruzadas a entidades do sistema
      table.string('entidade', 50); // ex: 'solicitacoes', 'encaminhamentos', 'comunicados'
      table.integer('entidade_id');
      table.jsonb('metadata_json');
      
      // Timestamps de auditoria
      table.timestamp('disparado_em').defaultTo(knex.fn.now());
      table.timestamp('entregue_em');
      table.timestamp('lido_em');

      // Índices para performance em pesquisas por paciente, UBS e data
      table.index(['paciente_id', 'disparado_em']);
      table.index(['ubs_id', 'disparado_em']);
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('notificacoes_paciente_log');
};
