/**
 * MIGRATION 020 — Hardening completo de seguranca
 * -----------------------------------------------------------------------------
 * Adiciona revogacao de sessoes via token_version, soft delete para atendimentos,
 * trilha de auditoria LGPD e RLS para tabelas expostas pela Supabase Data API.
 */
exports.up = async function up(knex) {
  const hasGestorTokenVersion = await knex.schema.hasColumn('usuarios_gestores', 'token_version');
  if (!hasGestorTokenVersion) {
    await knex.schema.alterTable('usuarios_gestores', (table) => {
      table.integer('token_version').notNullable().defaultTo(0);
    });
  }

  const hasPacienteTokenVersion = await knex.schema.hasColumn('pacientes', 'token_version');
  if (!hasPacienteTokenVersion) {
    await knex.schema.alterTable('pacientes', (table) => {
      table.integer('token_version').notNullable().defaultTo(0);
    });
  }

  const hasAtendimentoSoftDelete = await knex.schema.hasColumn('atendimentos', 'excluido_em');
  if (!hasAtendimentoSoftDelete) {
    await knex.schema.alterTable('atendimentos', (table) => {
      table.timestamp('excluido_em').nullable();
      table.integer('excluido_por').unsigned().nullable()
        .references('id').inTable('usuarios_gestores')
        .onDelete('SET NULL');
      table.text('motivo_exclusao').nullable();
    });
  }

  const hasAuditTable = await knex.schema.hasTable('security_audit_logs');
  if (!hasAuditTable) {
    await knex.schema.createTable('security_audit_logs', (table) => {
      table.increments('id').primary();
      table.string('ator_tipo', 30).notNullable();
      table.integer('ator_id').nullable();
      table.string('ator_perfil', 30).nullable();
      table.integer('ator_ubs_id').nullable();
      table.string('acao', 120).notNullable();
      table.string('entidade', 120).notNullable();
      table.integer('entidade_id').nullable();
      table.integer('escopo_ubs_id').nullable();
      table.string('ip', 80).nullable();
      table.text('user_agent').nullable();
      table.jsonb('metadata').nullable();
      table.timestamp('criado_em').notNullable().defaultTo(knex.fn.now());
      table.index(['ator_tipo', 'ator_id']);
      table.index(['acao']);
      table.index(['entidade', 'entidade_id']);
      table.index(['criado_em']);
    });
  }

  await knex.raw(`
    ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.historico_status ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.agendamentos_gestao ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.encaminhamentos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.notificacoes_vigilancia ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.usuarios_gestores ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.comunicados_leitura ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "service_role full access pacientes" ON public.pacientes;
    CREATE POLICY "service_role full access pacientes" ON public.pacientes
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "authenticated matriz read pacientes" ON public.pacientes;
    CREATE POLICY "authenticated matriz read pacientes" ON public.pacientes
      FOR SELECT TO authenticated
      USING (
        (auth.jwt() ->> 'tipo') = 'gestor'
        OR ((auth.jwt() ->> 'tipo') = 'paciente' AND id = ((auth.jwt() ->> 'id')::integer))
      );

    DROP POLICY IF EXISTS "service_role full access solicitacoes" ON public.solicitacoes;
    CREATE POLICY "service_role full access solicitacoes" ON public.solicitacoes
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "authenticated matriz read solicitacoes" ON public.solicitacoes;
    CREATE POLICY "authenticated matriz read solicitacoes" ON public.solicitacoes
      FOR SELECT TO authenticated
      USING (
        (auth.jwt() ->> 'tipo') = 'gestor'
        OR ((auth.jwt() ->> 'tipo') = 'paciente' AND paciente_id = ((auth.jwt() ->> 'id')::integer))
      );

    DROP POLICY IF EXISTS "service_role full access historico_status" ON public.historico_status;
    CREATE POLICY "service_role full access historico_status" ON public.historico_status
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "authenticated read historico autorizado" ON public.historico_status;
    CREATE POLICY "authenticated read historico autorizado" ON public.historico_status
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.solicitacoes s
          WHERE s.id = historico_status.solicitacao_id
          AND (
            (auth.jwt() ->> 'tipo') = 'gestor'
            OR ((auth.jwt() ->> 'tipo') = 'paciente' AND s.paciente_id = ((auth.jwt() ->> 'id')::integer))
          )
        )
      );

    DROP POLICY IF EXISTS "service_role full access medicamentos" ON public.medicamentos;
    CREATE POLICY "service_role full access medicamentos" ON public.medicamentos
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "authenticated read medicamentos ubs" ON public.medicamentos;
    CREATE POLICY "authenticated read medicamentos ubs" ON public.medicamentos
      FOR SELECT TO authenticated
      USING (ubs_id = ((auth.jwt() ->> 'ubs_id')::integer));

    DROP POLICY IF EXISTS "service_role full access comunicados" ON public.comunicados;
    CREATE POLICY "service_role full access comunicados" ON public.comunicados
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "authenticated read comunicados ubs" ON public.comunicados;
    CREATE POLICY "authenticated read comunicados ubs" ON public.comunicados
      FOR SELECT TO authenticated
      USING (
        ubs_id = ((auth.jwt() ->> 'ubs_id')::integer)
        AND (tipo = 'geral' OR paciente_id = ((auth.jwt() ->> 'id')::integer) OR (auth.jwt() ->> 'tipo') = 'gestor')
      );

    DROP POLICY IF EXISTS "service_role full access agendamentos_gestao" ON public.agendamentos_gestao;
    CREATE POLICY "service_role full access agendamentos_gestao" ON public.agendamentos_gestao
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "authenticated read agendamentos ubs" ON public.agendamentos_gestao;
    CREATE POLICY "authenticated read agendamentos ubs" ON public.agendamentos_gestao
      FOR SELECT TO authenticated
      USING (ubs_id = ((auth.jwt() ->> 'ubs_id')::integer));

    DROP POLICY IF EXISTS "service_role full access encaminhamentos" ON public.encaminhamentos;
    CREATE POLICY "service_role full access encaminhamentos" ON public.encaminhamentos
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "authenticated read encaminhamentos ubs" ON public.encaminhamentos;
    CREATE POLICY "authenticated read encaminhamentos ubs" ON public.encaminhamentos
      FOR SELECT TO authenticated
      USING (ubs_id = ((auth.jwt() ->> 'ubs_id')::integer));

    DROP POLICY IF EXISTS "service_role full access notificacoes_vigilancia" ON public.notificacoes_vigilancia;
    CREATE POLICY "service_role full access notificacoes_vigilancia" ON public.notificacoes_vigilancia
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "authenticated read vigilancia ubs" ON public.notificacoes_vigilancia;
    CREATE POLICY "authenticated read vigilancia ubs" ON public.notificacoes_vigilancia
      FOR SELECT TO authenticated
      USING (ubs_id = ((auth.jwt() ->> 'ubs_id')::integer));

    DROP POLICY IF EXISTS "service_role full access usuarios_gestores" ON public.usuarios_gestores;
    CREATE POLICY "service_role full access usuarios_gestores" ON public.usuarios_gestores
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "authenticated read gestores propria ubs" ON public.usuarios_gestores;
    CREATE POLICY "authenticated read gestores propria ubs" ON public.usuarios_gestores
      FOR SELECT TO authenticated
      USING ((auth.jwt() ->> 'tipo') = 'gestor' AND ubs_id = ((auth.jwt() ->> 'ubs_id')::integer));

    DROP POLICY IF EXISTS "service_role full access comunicados_leitura" ON public.comunicados_leitura;
    CREATE POLICY "service_role full access comunicados_leitura" ON public.comunicados_leitura
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "authenticated own comunicados_leitura" ON public.comunicados_leitura;
    CREATE POLICY "authenticated own comunicados_leitura" ON public.comunicados_leitura
      FOR ALL TO authenticated
      USING (paciente_id = ((auth.jwt() ->> 'id')::integer))
      WITH CHECK (paciente_id = ((auth.jwt() ->> 'id')::integer));

    DROP POLICY IF EXISTS "service_role full access push_subscriptions" ON public.push_subscriptions;
    CREATE POLICY "service_role full access push_subscriptions" ON public.push_subscriptions
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "authenticated own push_subscriptions" ON public.push_subscriptions;
    CREATE POLICY "authenticated own push_subscriptions" ON public.push_subscriptions
      FOR ALL TO authenticated
      USING (usuario_id = ((auth.jwt() ->> 'id')::integer) AND tipo_usuario = (auth.jwt() ->> 'tipo'))
      WITH CHECK (usuario_id = ((auth.jwt() ->> 'id')::integer) AND tipo_usuario = (auth.jwt() ->> 'tipo'));

    DROP POLICY IF EXISTS "service_role full access security_audit_logs" ON public.security_audit_logs;
    CREATE POLICY "service_role full access security_audit_logs" ON public.security_audit_logs
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  `);
};

exports.down = async function down(knex) {
  await knex.raw(`
    ALTER TABLE public.security_audit_logs DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.push_subscriptions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.comunicados_leitura DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.usuarios_gestores DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.notificacoes_vigilancia DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.encaminhamentos DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.agendamentos_gestao DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.comunicados DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.medicamentos DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.historico_status DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.solicitacoes DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.pacientes DISABLE ROW LEVEL SECURITY;
  `);

  const hasAuditTable = await knex.schema.hasTable('security_audit_logs');
  if (hasAuditTable) {
    await knex.schema.dropTable('security_audit_logs');
  }

  const hasAtendimentoSoftDelete = await knex.schema.hasColumn('atendimentos', 'excluido_em');
  if (hasAtendimentoSoftDelete) {
    await knex.schema.alterTable('atendimentos', (table) => {
      table.dropColumn('motivo_exclusao');
      table.dropColumn('excluido_por');
      table.dropColumn('excluido_em');
    });
  }

  const hasPacienteTokenVersion = await knex.schema.hasColumn('pacientes', 'token_version');
  if (hasPacienteTokenVersion) {
    await knex.schema.alterTable('pacientes', (table) => {
      table.dropColumn('token_version');
    });
  }

  const hasGestorTokenVersion = await knex.schema.hasColumn('usuarios_gestores', 'token_version');
  if (hasGestorTokenVersion) {
    await knex.schema.alterTable('usuarios_gestores', (table) => {
      table.dropColumn('token_version');
    });
  }
};
