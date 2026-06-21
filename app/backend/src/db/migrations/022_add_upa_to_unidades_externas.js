/**
 * MIGRATION 022 - Adiciona UPA ao tipo de unidade externa.
 * -----------------------------------------------------------------------------
 * Mantem a tabela unidades_externas como catalogo simples para o portal externo,
 * apenas ampliando a CHECK constraint para aceitar UPAs sem alterar solicitacoes
 * ou encaminhamentos nesta etapa pre-banca.
 */
exports.up = async (knex) => {
  await knex.raw(`
    ALTER TABLE unidades_externas
      DROP CONSTRAINT IF EXISTS unidades_externas_tipo_check;
    ALTER TABLE unidades_externas
      ADD CONSTRAINT unidades_externas_tipo_check
      CHECK (tipo IN ('AME','CAPS','CENTRO_ESPECIALIDADES','HOSPITAL','UPA','OUTRO'));
  `);
};

exports.down = async (knex) => {
  await knex.raw(`
    ALTER TABLE unidades_externas
      DROP CONSTRAINT IF EXISTS unidades_externas_tipo_check;
    ALTER TABLE unidades_externas
      ADD CONSTRAINT unidades_externas_tipo_check
      CHECK (tipo IN ('AME','CAPS','CENTRO_ESPECIALIDADES','HOSPITAL','OUTRO'));
  `);
};
