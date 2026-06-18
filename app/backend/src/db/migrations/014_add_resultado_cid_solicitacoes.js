/**
 * MIGRATION 014 — Resultado clínico e CID-10 em solicitacoes
 * Finalidade: Permite registrar o RESULTADO de um exame ou consulta e o
 *             diagnóstico (CID-10) vinculado à solicitação, transformando
 *             o sistema de "rastreador de fila" em "rastreador clínico".
 *
 * Depende de: solicitacoes (007)
 */
exports.up = function (knex) {
  return knex.schema.alterTable('solicitacoes', (table) => {
    // Resultado em texto livre — laudos, conclusões de especialistas, etc.
    table.text('resultado').nullable();

    // CID-10: código de diagnóstico internacional (ex: 'E11', 'I10', 'J45.0')
    table.string('cid_10', 10).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('solicitacoes', (table) => {
    table.dropColumn('resultado');
    table.dropColumn('cid_10');
  });
};
