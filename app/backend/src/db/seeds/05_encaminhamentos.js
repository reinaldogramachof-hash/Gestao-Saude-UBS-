/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('encaminhamentos').del();
  
  // Fetch some real patients from DB
  const pacientes = await knex('pacientes').select('id').limit(4);
  if (pacientes.length < 4) {
    console.warn('Need at least 4 patients to seed encaminhamentos.');
    return;
  }

  // Date helpers
  const now = new Date();
  const daysAgo = (days) => new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  const hoursAgo = (hours) => new Date(now.getTime() - (hours * 60 * 60 * 1000));
  
  await knex('encaminhamentos').insert([
    {
      paciente_id: pacientes[0].id,
      destino: 'HOSPITAL_MUNICIPAL',
      especialidade: 'Cirurgia Geral',
      prioridade: 'VERDE',
      status: 'AGUARDANDO_VAGA',
      data_solicitacao: daysAgo(45), // 45 days waiting
      observacoes: 'Paciente aguarda cirurgia de hérnia umbilical. Avaliação de risco cirúrgico anexada no prontuário físico.',
    },
    {
      paciente_id: pacientes[1].id,
      destino: 'AME',
      especialidade: 'Ortopedia',
      prioridade: 'AMARELO',
      status: 'AGUARDANDO_VAGA',
      data_solicitacao: daysAgo(12), // 12 days waiting
      observacoes: 'Dor crônica no joelho direito, suspeita de lesão meniscal. Paciente relata piora progressiva e dificuldade de locomoção.',
    },
    {
      paciente_id: pacientes[2].id,
      destino: 'CAPS',
      especialidade: 'Psiquiatria',
      prioridade: 'VERMELHO',
      status: 'AGUARDANDO_VAGA',
      data_solicitacao: hoursAgo(50), // 50 hours waiting (Over SLA of 48h for red)
      observacoes: 'Surto psicótico agudo com ideação suicida. Família não consegue conter o paciente em casa. Risco iminente.',
    },
    {
      paciente_id: pacientes[3].id,
      destino: 'HOSPITAL_MUNICIPAL',
      especialidade: 'Oncologia',
      prioridade: 'VERMELHO',
      status: 'AGENDADO',
      data_solicitacao: daysAgo(5),
      data_agendamento: new Date(),
      observacoes: 'Nódulo mamário suspeito (BI-RADS 5). Biópsia urgente.',
    },
    {
      paciente_id: pacientes[0].id,
      destino: 'AME',
      especialidade: 'Cardiologia',
      prioridade: 'VERDE',
      status: 'REALIZADO',
      data_solicitacao: daysAgo(180),
      data_agendamento: daysAgo(150),
      observacoes: 'Acompanhamento de hipertensão resistente.',
    }
  ]);
};
