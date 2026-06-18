/**
 * MIGRATION 013 — Campos clínicos na tabela pacientes
 * Finalidade: Adiciona dados de saúde fundamentais ao cadastro do paciente,
 *             permitindo que médicos e gestores registrem informações clínicas
 *             diretamente no sistema sem depender de prontuários externos.
 *
 * Por que texto livre e não tabelas normalizadas:
 *   Para o MVP e a banca, campos TEXT são suficientes e rápidos de preencher.
 *   Em produção real, alergias e comorbidades seriam entidades próprias com
 *   codificação padronizada (SNOMED, CID-10). Isso é escopo pós-aprovação.
 *
 * Depende de: pacientes (003)
 */
exports.up = function (knex) {
  return knex.schema.alterTable('pacientes', (table) => {
    // Dados vitais básicos
    table.string('tipo_sanguineo', 5).nullable();          // Ex: 'A+', 'O-', 'AB+'
    table.decimal('peso_kg', 5, 2).nullable();             // Ex: 72.50
    table.smallint('altura_cm').nullable();                // Ex: 175

    // Informações críticas de segurança — um médico DEVE ver antes de prescrever
    table.text('alergias').nullable();                     // Ex: "Penicilina, Dipirona"
    table.text('comorbidades').nullable();                 // Ex: "Diabetes tipo 2, Hipertensão arterial"
    table.text('medicamentos_uso_continuo').nullable();    // Ex: "Metformina 500mg 2x/dia, Losartana 50mg"

    // Espaço livre para anotações clínicas da equipe
    table.text('observacoes_clinicas').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('pacientes', (table) => {
    table.dropColumn('tipo_sanguineo');
    table.dropColumn('peso_kg');
    table.dropColumn('altura_cm');
    table.dropColumn('alergias');
    table.dropColumn('comorbidades');
    table.dropColumn('medicamentos_uso_continuo');
    table.dropColumn('observacoes_clinicas');
  });
};
