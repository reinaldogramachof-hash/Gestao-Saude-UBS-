/**
 * MIGRATION 030 - Consentimento LGPD no Portal do Paciente
 * -----------------------------------------------------------------------------
 * Finalidade: Registrar o timestamp do aceite explicito do paciente e a versao
 *             da politica de privacidade aceita naquele momento.
 * -----------------------------------------------------------------------------
 */
exports.up = async function up(knex) {
  const possuiAceiteEm = await knex.schema.hasColumn('pacientes', 'lgpd_aceite_em');
  if (!possuiAceiteEm) {
    await knex.schema.alterTable('pacientes', (table) => {
      table.timestamp('lgpd_aceite_em');
    });
  }

  const possuiVersao = await knex.schema.hasColumn('pacientes', 'lgpd_versao');
  if (!possuiVersao) {
    await knex.schema.alterTable('pacientes', (table) => {
      table.string('lgpd_versao', 10);
    });
  }
};

exports.down = async function down(knex) {
  const possuiVersao = await knex.schema.hasColumn('pacientes', 'lgpd_versao');
  if (possuiVersao) {
    await knex.schema.alterTable('pacientes', (table) => {
      table.dropColumn('lgpd_versao');
    });
  }

  const possuiAceiteEm = await knex.schema.hasColumn('pacientes', 'lgpd_aceite_em');
  if (possuiAceiteEm) {
    await knex.schema.alterTable('pacientes', (table) => {
      table.dropColumn('lgpd_aceite_em');
    });
  }
};
