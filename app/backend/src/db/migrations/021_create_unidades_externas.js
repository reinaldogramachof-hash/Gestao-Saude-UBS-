/**
 * MIGRATION 021 - Portal de Unidades Externas
 * -----------------------------------------------------------------------------
 * Cria a tabela de login das unidades externas e amplia encaminhamentos para
 * registrar o ciclo completo: recebimento, agendamento, confirmacao do paciente
 * e retorno para a UBS. Os guards com hasColumn tornam a migration idempotente
 * para ambientes que possam ter recebido ajustes manuais durante homologacao.
 */
exports.up = async function up(knex) {
  const existeUnidadesExternas = await knex.schema.hasTable('unidades_externas');

  if (!existeUnidadesExternas) {
    await knex.schema.createTable('unidades_externas', (table) => {
      table.increments('id').primary();
      table.string('nome', 200).notNullable();
      table.string('tipo', 50).notNullable();
      table.string('email', 150).unique().notNullable();
      table.string('senha_hash', 255).notNullable();
      table.string('municipio', 100).defaultTo('Sao Jose dos Campos');
      table.text('endereco').nullable();
      table.string('telefone', 20).nullable();
      table.integer('token_version').notNullable().defaultTo(0);
      table.boolean('ativo').defaultTo(true);
      table.timestamp('criado_em', { useTz: true }).defaultTo(knex.fn.now());
    });

    await knex.raw(`
      ALTER TABLE unidades_externas
      ADD CONSTRAINT unidades_externas_tipo_check
      CHECK (tipo IN ('CAPS', 'AME', 'CENTRO_ESPECIALIDADES', 'HOSPITAL', 'OUTRO'))
    `);
  }

  const alteracoes = [
    ['unidade_externa_id', (table) => {
      table.integer('unidade_externa_id').unsigned()
        .references('id').inTable('unidades_externas')
        .onDelete('SET NULL');
    }],
    ['data_procedimento_unidade', (table) => table.timestamp('data_procedimento_unidade', { useTz: true }).nullable()],
    ['confirmado_paciente', (table) => table.boolean('confirmado_paciente').defaultTo(false)],
    ['data_confirmacao_paciente', (table) => table.timestamp('data_confirmacao_paciente', { useTz: true }).nullable()],
    ['feedback_tipo', (table) => table.string('feedback_tipo', 80).nullable()],
    ['feedback_conduta', (table) => table.text('feedback_conduta').nullable()],
    ['feedback_data_retorno', (table) => table.timestamp('feedback_data_retorno', { useTz: true }).nullable()],
  ];

  for (const [coluna, aplicar] of alteracoes) {
    const existeColuna = await knex.schema.hasColumn('encaminhamentos', coluna);
    if (!existeColuna) {
      await knex.schema.alterTable('encaminhamentos', aplicar);
    }
  }

  await knex.raw(`
    ALTER TABLE public.unidades_externas ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "service_role full access unidades_externas" ON public.unidades_externas;
    CREATE POLICY "service_role full access unidades_externas" ON public.unidades_externas
      FOR ALL TO service_role USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "authenticated read own unidade externa" ON public.unidades_externas;
    CREATE POLICY "authenticated read own unidade externa" ON public.unidades_externas
      FOR SELECT TO authenticated
      USING (
        (auth.jwt() ->> 'tipo') = 'externa'
        AND id = ((auth.jwt() ->> 'id')::integer)
      );
  `);
};

exports.down = async function down(knex) {
  const colunas = [
    'feedback_data_retorno',
    'feedback_conduta',
    'feedback_tipo',
    'data_confirmacao_paciente',
    'confirmado_paciente',
    'data_procedimento_unidade',
    'unidade_externa_id',
  ];

  for (const coluna of colunas) {
    const existeColuna = await knex.schema.hasColumn('encaminhamentos', coluna);
    if (existeColuna) {
      await knex.schema.alterTable('encaminhamentos', (table) => {
        table.dropColumn(coluna);
      });
    }
  }

  await knex.schema.dropTableIfExists('unidades_externas');
};
