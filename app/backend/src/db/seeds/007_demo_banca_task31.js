/**
 * SEED 007 - Demo da Banca TASK_31
 * -----------------------------------------------------------------------------
 * Prepara pacientes ativos da UBS Vila Maria para demonstrar o novo fluxo de
 * cadastro com acesso imediato. A seed e idempotente: pacientes usam CRA como
 * chave natural e os demais registros usam IDs altos reservados para demo.
 */
exports.seed = async function seed(knex) {
  const ubs = await knex('ubs').where({ nome: 'UBS Vila Maria' }).first();
  if (!ubs) {
    throw new Error('UBS Vila Maria nao encontrada. Rode as seeds de UBS antes da demo TASK_31.');
  }

  const gestor = await knex('usuarios_gestores')
    .where({ ubs_id: ubs.id, ativo: true })
    .first();

  const [ame, caps] = await Promise.all([
    knex('unidades_externas').where({ tipo: 'AME' }).first(),
    knex('unidades_externas').where({ tipo: 'CAPS' }).first(),
  ]);

  const pacientes = [
    { cra: '2606260001', nome: 'Ana Paula Santos', data_nascimento: '1985-03-15' },
    { cra: '2606260002', nome: 'Carlos Eduardo Lima', data_nascimento: '1990-07-22' },
    { cra: '2606260003', nome: 'Mariana Costa Silva', data_nascimento: '1978-11-08' },
    { cra: '2606260004', nome: 'Roberto Alves Souza', data_nascimento: '1965-05-30' },
    { cra: '2606260005', nome: 'Fernanda Oliveira', data_nascimento: '1995-09-12' },
  ];

  await knex('pacientes')
    .insert(pacientes.map((paciente) => ({
      ...paciente,
      ubs_id: ubs.id,
      ativo: true,
      criado_em: knex.fn.now(),
      atualizado_em: knex.fn.now(),
    })))
    .onConflict('cra').merge();

  const pacientesDb = await knex('pacientes')
    .whereIn('cra', pacientes.map((paciente) => paciente.cra))
    .select('id', 'cra');
  const porCra = new Map(pacientesDb.map((paciente) => [paciente.cra, paciente.id]));

  const solicitacoes = [
    {
      id: 31001,
      paciente_id: porCra.get('2606260001'),
      ubs_id: ubs.id,
      tipo: 'exame',
      descricao: 'Ecocardiograma',
      descricao_paciente: 'Exame do coracao',
      status: 'data_marcada',
      prioridade: 'prioritario',
      data_solicitacao: '2026-06-20',
      data_prevista: '2026-06-30',
      observacao_paciente: 'Seu exame esta agendado no AME Norte.',
      unidade_externa_id: ame?.id || null,
    },
    {
      id: 31002,
      paciente_id: porCra.get('2606260002'),
      ubs_id: ubs.id,
      tipo: 'exame',
      descricao: 'Hemograma Completo',
      descricao_paciente: 'Exame de sangue',
      status: 'aguardando_regulacao',
      prioridade: 'rotina',
      data_solicitacao: '2026-06-21',
      observacao_paciente: 'Pedido recebido pela UBS e aguardando organizacao da fila.',
    },
    {
      id: 31003,
      paciente_id: porCra.get('2606260003'),
      ubs_id: ubs.id,
      tipo: 'consulta',
      descricao: 'Consulta Psiquiatrica',
      descricao_paciente: 'Consulta de saude mental',
      status: 'autorizado',
      prioridade: 'prioritario',
      data_solicitacao: '2026-06-18',
      data_prevista: '2026-07-04',
      observacao_paciente: 'Consulta autorizada no CAPS Centro.',
      unidade_externa_id: caps?.id || null,
    },
    {
      id: 31004,
      paciente_id: porCra.get('2606260004'),
      ubs_id: ubs.id,
      tipo: 'exame',
      descricao: 'Raio-X',
      descricao_paciente: 'Exame de imagem',
      status: 'concluido',
      prioridade: 'rotina',
      data_solicitacao: '2026-06-10',
      data_prevista: '2026-06-15',
      data_conclusao: '2026-06-22',
      observacao_paciente: 'Resultado devolvido para a UBS.',
    },
  ];

  await knex('solicitacoes')
    .insert(solicitacoes)
    .onConflict('id').merge();

  const encaminhamentos = [
    {
      id: 31001,
      paciente_id: porCra.get('2606260001'),
      solicitacao_id: 31001,
      ubs_id: ubs.id,
      gestor_id: gestor?.id || null,
      unidade_externa_id: ame?.id || null,
      destino: 'AME Norte',
      especialidade: 'Cardiologia',
      prioridade: 'AMARELO',
      status: 'AGENDADO',
      data_solicitacao: '2026-06-20T09:00:00',
      data_agendamento: '2026-06-30T08:30:00',
      data_procedimento_unidade: '2026-06-30',
      observacoes: 'Demo banca TASK_31 - ecocardiograma agendado.',
      atualizado_em: knex.fn.now(),
    },
    {
      id: 31002,
      paciente_id: porCra.get('2606260004'),
      solicitacao_id: 31004,
      ubs_id: ubs.id,
      gestor_id: gestor?.id || null,
      destino: 'Centro de Especialidades',
      especialidade: 'Radiologia',
      prioridade: 'VERDE',
      status: 'RETORNO_UBS',
      data_solicitacao: '2026-06-10T10:00:00',
      data_agendamento: '2026-06-15T13:00:00',
      data_procedimento_unidade: '2026-06-15',
      feedback_tipo: 'resultado_entregue',
      feedback_conduta: 'Resultado encaminhado para avaliacao da equipe da UBS.',
      feedback_data_retorno: '2026-06-22T09:00:00',
      observacoes: 'Demo banca TASK_31 - retorno concluido.',
      atualizado_em: knex.fn.now(),
    },
  ];

  await knex('encaminhamentos')
    .insert(encaminhamentos)
    .onConflict('id').merge();

  const medicamentos = [
    { id: 31001, nome: 'Metformina 850mg', principio_ativo: 'Metformina', disponivel: true, observacao: 'Disponivel para retirada com receita vigente.' },
    { id: 31002, nome: 'Losartana 50mg', principio_ativo: 'Losartana', disponivel: true, observacao: 'Disponivel para retirada com receita vigente.' },
    { id: 31003, nome: 'Atorvastatina 20mg', principio_ativo: 'Atorvastatina', disponivel: false, observacao: 'Previsao de chegada: 30/06/2026.' },
    { id: 31004, nome: 'Omeprazol 20mg', principio_ativo: 'Omeprazol', disponivel: true, observacao: 'Disponivel para retirada com receita vigente.' },
  ];

  await knex('medicamentos')
    .insert(medicamentos.map((medicamento) => ({
      ...medicamento,
      ubs_id: ubs.id,
      atualizado_por: gestor?.id || null,
      atualizado_em: knex.fn.now(),
    })))
    .onConflict('id').merge();

  await knex('agendamentos_gestao')
    .insert({
      id: 31001,
      ubs_id: ubs.id,
      paciente_id: null,
      gestor_responsavel_id: gestor?.id || null,
      data_hora: '2026-06-26T14:00:00',
      duracao_minutos: 30,
      status: 'disponivel',
      motivo: 'Slot demo banca TASK_31 para validacao de documentos.',
      criado_em: knex.fn.now(),
    })
    .onConflict('id').merge();
};
