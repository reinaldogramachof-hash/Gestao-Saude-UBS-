/**
 * MIGRATION 026 - Indice unico de slots por UBS e data/hora
 * -----------------------------------------------------------------------------
 * Garante que a criacao em lote possa usar onConflict(['ubs_id', 'data_hora'])
 * para ignorar duplicatas. Antes de criar o indice, remove duplicatas antigas
 * preservando o menor id de cada combinacao UBS + horario.
 */
exports.up = async function up(knex) {
  await knex.raw(`
    DELETE FROM agendamentos_gestao a
    USING agendamentos_gestao b
    WHERE a.ubs_id = b.ubs_id
      AND a.data_hora = b.data_hora
      AND a.id > b.id
      AND a.status = 'disponivel'
      AND a.paciente_id IS NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS agendamentos_gestao_ubs_data_hora_unique
      ON agendamentos_gestao (ubs_id, data_hora);
  `);
};

exports.down = async function down(knex) {
  await knex.raw(`
    DROP INDEX IF EXISTS agendamentos_gestao_ubs_data_hora_unique;
  `);
};
