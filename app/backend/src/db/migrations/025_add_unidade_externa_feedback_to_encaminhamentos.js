/**
 * MIGRATION 025 - Guard de campos do portal externo em encaminhamentos
 * -----------------------------------------------------------------------------
 * Reaplica de forma idempotente os campos que o portal externo precisa para
 * listar, agendar e devolver feedback de encaminhamentos. Esta migration existe
 * como rede de seguranca para ambientes em que a 021 foi aplicada parcialmente.
 */
exports.up = async function up(knex) {
  const [
    temUnidadeExterna,
    temDataProcedimento,
    temConfirmadoPaciente,
    temFeedbackTipo,
    temFeedbackConduta,
    temFeedbackDataRetorno,
  ] = await Promise.all([
    knex.schema.hasColumn('encaminhamentos', 'unidade_externa_id'),
    knex.schema.hasColumn('encaminhamentos', 'data_procedimento_unidade'),
    knex.schema.hasColumn('encaminhamentos', 'confirmado_paciente'),
    knex.schema.hasColumn('encaminhamentos', 'feedback_tipo'),
    knex.schema.hasColumn('encaminhamentos', 'feedback_conduta'),
    knex.schema.hasColumn('encaminhamentos', 'feedback_data_retorno'),
  ]);

  await knex.schema.alterTable('encaminhamentos', (table) => {
    if (!temUnidadeExterna) {
      table.integer('unidade_externa_id').unsigned().nullable()
        .references('id').inTable('unidades_externas')
        .onDelete('SET NULL');
    }

    if (!temDataProcedimento) {
      table.date('data_procedimento_unidade').nullable();
    }

    if (!temConfirmadoPaciente) {
      table.boolean('confirmado_paciente').notNullable().defaultTo(false);
    }

    if (!temFeedbackTipo) {
      table.string('feedback_tipo', 60).nullable();
    }

    if (!temFeedbackConduta) {
      table.text('feedback_conduta').nullable();
    }

    if (!temFeedbackDataRetorno) {
      table.timestamp('feedback_data_retorno').nullable();
    }
  });
};

exports.down = async function down() {
  // Nao removemos colunas no rollback: elas podem ter sido criadas pela
  // migration 021 e ja sao contrato ativo do portal externo/paciente.
};
