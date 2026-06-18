/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('casos_sociais').del();
  await knex('transporte_sanitario').del();
  await knex('notificacoes_vigilancia').del();

  const pacientes = await knex('pacientes').select('id').limit(10);
  if (pacientes.length < 5) return;

  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);

  // 1. Serviço Social
  await knex('casos_sociais').insert([
    {
      paciente_id: pacientes[0].id,
      vulnerabilidade: 'FOME',
      status: 'EM_ACOMPANHAMENTO',
      assistente_responsavel: 'Maria Silva',
      relatorio_acoes: 'Paciente relata falta de mantimentos em casa. Solicitação de cesta básica no CRAS em andamento.'
    },
    {
      paciente_id: pacientes[1].id,
      vulnerabilidade: 'VIOLENCIA_DOMESTICA',
      status: 'ENCAMINHADO_CRAS',
      assistente_responsavel: 'João Souza',
      relatorio_acoes: 'Encaminhado para a rede de apoio à mulher. CREAS acionado.'
    },
    {
      paciente_id: pacientes[2].id,
      vulnerabilidade: 'ABANDONO_TRATAMENTO',
      status: 'EM_ACOMPANHAMENTO',
      assistente_responsavel: 'Maria Silva',
      relatorio_acoes: 'Paciente idoso não comparece para retirar medicamentos há 3 meses. Visita domiciliar agendada.'
    }
  ]);

  // 2. Transporte Sanitário
  await knex('transporte_sanitario').insert([
    {
      paciente_id: pacientes[3].id,
      destino: 'Hospital Regional do Vale do Paraíba',
      data_viagem: amanha.toISOString().split('T')[0],
      horario_saida: '06:00:00',
      veiculo: 'Van 01',
      status: 'AGENDADO',
      necessita_acompanhante: true,
      cadeirante: false
    },
    {
      paciente_id: pacientes[4].id,
      destino: 'AME São José dos Campos',
      data_viagem: amanha.toISOString().split('T')[0],
      horario_saida: '08:30:00',
      veiculo: 'Ambulância A',
      status: 'AGENDADO',
      necessita_acompanhante: true,
      cadeirante: true
    },
    {
      paciente_id: pacientes[0].id,
      destino: 'Hospital Francisca Júlia',
      data_viagem: hoje.toISOString().split('T')[0],
      horario_saida: '07:00:00',
      veiculo: 'Van 02',
      status: 'EM_TRANSITO',
      necessita_acompanhante: false,
      cadeirante: false
    }
  ]);

  // 3. Vigilância em Saúde (Mapa Epidemiológico)
  await knex('notificacoes_vigilancia').insert([
    {
      paciente_id: pacientes[1].id,
      agravo: 'Dengue',
      bairro: 'Jardim Satélite',
      cep: '12230-000',
      status_investigacao: 'CONFIRMADO',
      data_notificacao: new Date(hoje.setDate(hoje.getDate() - 5))
    },
    {
      paciente_id: pacientes[2].id,
      agravo: 'Dengue',
      bairro: 'Jardim Satélite', // Simular surto no mesmo bairro
      cep: '12230-010',
      status_investigacao: 'SUSPEITO',
      data_notificacao: new Date(hoje.setDate(hoje.getDate() - 2))
    },
    {
      paciente_id: pacientes[3].id,
      agravo: 'COVID-19',
      bairro: 'Bosque dos Eucaliptos',
      cep: '12233-000',
      status_investigacao: 'CONFIRMADO',
      data_notificacao: new Date(hoje.setDate(hoje.getDate() - 1))
    },
    {
      paciente_id: null,
      agravo: 'Sarampo',
      bairro: 'Centro',
      cep: '12210-000',
      status_investigacao: 'SUSPEITO',
      data_notificacao: new Date()
    }
  ]);
};
