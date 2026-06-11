/**
 * MIGRATION 011 — Campo: solicitacoes.local_executor
 * Finalidade: Indica onde o serviço será EXECUTADO quando não for na UBS local.
 * Exemplos: "Hospital Municipal de SJC", "Centro de Especialidades Médicas"
 *
 * Por que não é uma tabela separada agora:
 *   Para o MVP e a apresentação à banca, texto livre é suficiente e rápido.
 *   No futuro (parceria com a Prefeitura), este campo vira uma FK para uma
 *   tabela de locais_atendimento com logins próprios por unidade.
 *
 * Depende de: solicitacoes (007)
 */
exports.up = function (knex) {
  return knex.schema.alterTable('solicitacoes', (table) => {
    // NULL = atendimento na própria UBS de referência do paciente
    // Preenchido = nome do local externo (Hospital, Centro de Especialidades, etc.)
    table.string('local_executor', 200).nullable().defaultTo(null);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('solicitacoes', (table) => {
    table.dropColumn('local_executor');
  });
};
