/**
 * MIGRATION 015 — Tabela: atendimentos
 * Finalidade: Registra encontros clínicos do paciente em QUALQUER unidade de
 *             saúde — UBS, AME, CAPS, Centro de Especialidades, hospital, etc.
 *             Esta é a "linha do tempo clínica" do paciente, distinta das
 *             solicitacoes (que rastreiam processos burocráticos).
 *
 * Diferença de solicitacoes:
 *   solicitacoes = pedido administrative de exame/consulta + rastreio de status
 *   atendimentos = registro do encontro clínico real — o que aconteceu, quando,
 *                  onde, com quem, qual diagnóstico, qual conduta
 *
 * Depende de: pacientes (003), ubs (001), usuarios_gestores (002)
 */
exports.up = function (knex) {
  return knex.schema.createTable('atendimentos', (table) => {
    table.increments('id').primary();

    // Paciente atendido
    table.integer('paciente_id').unsigned().notNullable()
      .references('id').inTable('pacientes')
      .onDelete('CASCADE');

    // Gestor que registrou este atendimento no sistema
    table.integer('registrado_por').unsigned().nullable()
      .references('id').inTable('usuarios_gestores')
      .onDelete('SET NULL');

    // Quando ocorreu o atendimento (pode ser retroativo)
    table.date('data_atendimento').notNullable();

    // Onde ocorreu — nome livre da unidade
    table.string('unidade', 200).notNullable();            // Ex: "UBS Vila Industrial", "AME Zona Leste"

    // Categoria da unidade para filtros e ícones no frontend
    // Valores: 'ubs', 'ame', 'caps', 'centro_especialidades', 'hospital', 'pronto_socorro', 'outro'
    table.string('tipo_unidade', 30).nullable();

    // Especialidade médica do atendimento
    table.string('especialidade', 100).nullable();         // Ex: "Cardiologia", "Ortopedia", "Clínica Geral"

    // Nome do profissional que realizou o atendimento (não vinculado ao sistema)
    table.string('profissional', 150).nullable();

    // Diagnósticos CID-10 — principal e secundário
    table.string('cid_10_principal', 10).nullable();       // Ex: 'I10' (Hipertensão)
    table.string('cid_10_secundario', 10).nullable();

    // O que foi decidido/prescrito durante o encontro
    table.text('conduta').nullable();                      // Ex: "Ajuste de dose de losartana para 100mg"

    // Observações livres da equipe sobre o atendimento
    table.text('observacoes').nullable();

    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('atendimentos');
};
