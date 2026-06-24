/**
 * SEED 008 - Slots de agenda para banca
 * -----------------------------------------------------------------------------
 * Cria horarios noturnos excepcionais para a apresentacao da banca em
 * 26/06/2026. Estes horarios sao dados de demonstracao e nao alteram a regra
 * operacional da API, que segue validando criacao manual em 07h-18h.
 */
exports.seed = async function seed(knex) {
  const ubs = await knex('ubs').where({ nome: 'UBS Vila Maria' }).first();
  if (!ubs) {
    throw new Error('UBS Vila Maria nao encontrada. Rode as seeds de UBS antes da seed 008.');
  }

  const gestor = await knex('usuarios_gestores')
    .where({ ubs_id: ubs.id, ativo: true })
    .first();

  const horarios = [
    '2026-06-26T19:00:00',
    '2026-06-26T19:15:00',
    '2026-06-26T19:30:00',
    '2026-06-26T19:45:00',
    '2026-06-26T20:00:00',
    '2026-06-26T20:15:00',
    '2026-06-26T20:30:00',
    '2026-06-26T20:45:00',
    '2026-06-26T21:00:00',
    '2026-06-26T21:15:00',
  ];

  await knex('agendamentos_gestao')
    .insert(horarios.map((dataHora, index) => ({
      id: 32001 + index,
      ubs_id: ubs.id,
      paciente_id: null,
      gestor_responsavel_id: gestor?.id || null,
      data_hora: dataHora,
      duracao_minutos: 15,
      status: 'disponivel',
      motivo: 'Slot demo banca TASK_32.',
      criado_em: knex.fn.now(),
    })))
    .onConflict('id').merge();
};
