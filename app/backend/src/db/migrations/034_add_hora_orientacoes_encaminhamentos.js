/**
 * MIGRATION 034 - Hora e orientacoes do procedimento externo
 * -----------------------------------------------------------------------------
 * Complementa o agendamento feito pela unidade externa com hora operacional e
 * orientacoes de preparo visiveis ao paciente. A data continua como data civil
 * em data_procedimento_unidade, sem conversao por fuso horario.
 */

exports.up = async function up(knex) {
  const [temHora, temOrientacoes] = await Promise.all([
    knex.schema.hasColumn('encaminhamentos', 'hora_procedimento_unidade'),
    knex.schema.hasColumn('encaminhamentos', 'orientacoes_procedimento'),
  ]);

  await knex.schema.alterTable('encaminhamentos', (table) => {
    if (!temHora) {
      table.string('hora_procedimento_unidade', 5).nullable();
    }

    if (!temOrientacoes) {
      table.text('orientacoes_procedimento').nullable();
    }
  });
};

exports.down = async function down(knex) {
  const [temHora, temOrientacoes] = await Promise.all([
    knex.schema.hasColumn('encaminhamentos', 'hora_procedimento_unidade'),
    knex.schema.hasColumn('encaminhamentos', 'orientacoes_procedimento'),
  ]);

  await knex.schema.alterTable('encaminhamentos', (table) => {
    if (temHora) {
      table.dropColumn('hora_procedimento_unidade');
    }

    if (temOrientacoes) {
      table.dropColumn('orientacoes_procedimento');
    }
  });
};
