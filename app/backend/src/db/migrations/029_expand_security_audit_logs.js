/**
 * MIGRATION 029 - Expansao da trilha central de auditoria
 * -----------------------------------------------------------------------------
 * FUNCAO: amplia a tabela security_audit_logs existente com o schema padrao
 * consumido pelo modulo master de logs sem recriar a tabela.
 *
 * OBSERVACAO:
 * - A numeracao 028 ja estava ocupada por outra migration neste repositorio.
 * - Por isso a expansao segue como 029 para manter a ordem real do projeto.
 * -----------------------------------------------------------------------------
 */
exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable('security_audit_logs');
  if (!hasTable) {
    throw new Error('Tabela security_audit_logs nao encontrada para expansao.');
  }

  const colunas = [
    ['created_at', (table) => table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())],
    ['usuario_id', (table) => table.integer('usuario_id').nullable()],
    ['usuario_tipo', (table) => table.string('usuario_tipo', 20).notNullable().defaultTo('sistema')],
    ['ubs_id', (table) => table.integer('ubs_id').nullable()],
    ['resultado', (table) => table.string('resultado', 10).notNullable().defaultTo('sucesso')],
    ['detalhe', (table) => table.text('detalhe').nullable()],
    ['ip_origem', (table) => table.string('ip_origem', 45).nullable()],
    ['http_status', (table) => table.integer('http_status').nullable()],
  ];

  for (const [coluna, adicionar] of colunas) {
    const existe = await knex.schema.hasColumn('security_audit_logs', coluna);
    if (!existe) {
      await knex.schema.alterTable('security_audit_logs', (table) => {
        adicionar(table);
      });
    }
  }

  await knex.raw(`
    UPDATE security_audit_logs
       SET created_at = COALESCE(created_at, criado_em, NOW()),
           usuario_id = COALESCE(usuario_id, ator_id),
           usuario_tipo = COALESCE(usuario_tipo, ator_tipo, 'sistema'),
           ubs_id = COALESCE(ubs_id, ator_ubs_id, escopo_ubs_id),
           resultado = COALESCE(resultado, 'sucesso'),
           detalhe = COALESCE(detalhe, metadata::text),
           ip_origem = COALESCE(ip_origem, ip)
  `);

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs (created_at DESC)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_security_audit_logs_usuario_id ON security_audit_logs (usuario_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_security_audit_logs_ubs_id ON security_audit_logs (ubs_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_security_audit_logs_resultado ON security_audit_logs (resultado)');
};

exports.down = async function down(knex) {
  const hasTable = await knex.schema.hasTable('security_audit_logs');
  if (!hasTable) {
    return;
  }

  await knex.raw('DROP INDEX IF EXISTS idx_security_audit_logs_created_at');
  await knex.raw('DROP INDEX IF EXISTS idx_security_audit_logs_usuario_id');
  await knex.raw('DROP INDEX IF EXISTS idx_security_audit_logs_ubs_id');
  await knex.raw('DROP INDEX IF EXISTS idx_security_audit_logs_resultado');

  const colunasRemoviveis = ['http_status', 'ip_origem', 'detalhe', 'resultado', 'ubs_id', 'usuario_tipo', 'usuario_id', 'created_at'];

  for (const coluna of colunasRemoviveis) {
    const existe = await knex.schema.hasColumn('security_audit_logs', coluna);
    if (existe) {
      await knex.schema.alterTable('security_audit_logs', (table) => {
        table.dropColumn(coluna);
      });
    }
  }
};
