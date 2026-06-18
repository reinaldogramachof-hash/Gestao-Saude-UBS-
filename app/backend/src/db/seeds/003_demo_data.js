/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // FUNÇÃO: Seed de dados de demonstração para UBS Alto da Ponte (ubs_id: 4)
  const UBS_ID = 4;

  // 1. LIMPEZA (Idempotência)
  // Deletar pacientes de demo e tudo que depende em cascata (caso não haja cascade configurado, deletamos manualmente)
  console.log('🧹 Limpando dados de demo antigos...');
  
  // Buscar IDs dos pacientes de demo para excluir dados relacionados
  const pacientesDemo = await knex('pacientes').where('cra', 'like', 'DEMO-%').select('id');
  const pacienteIds = pacientesDemo.map(p => p.id);

  if (pacienteIds.length > 0) {
    await knex('solicitacoes').whereIn('paciente_id', pacienteIds).del();
    await knex('comunicados').whereIn('paciente_id', pacienteIds).del();
  }
  
  // Deletar comunicados gerais e medicamentos do UBS de demo.
  // A UBS_ID 4 é exclusivamente para testes — limpar tudo dela é seguro.
  // Comunicados individuais já são removidos em cascata com os pacientes DEMO.
  await knex('comunicados').where('ubs_id', UBS_ID).andWhere('tipo', 'geral').del();
  await knex('medicamentos').where('ubs_id', UBS_ID).del();
  await knex('pacientes').where('cra', 'like', 'DEMO-%').del();

  console.log('🌱 Inserindo novos dados de demo...');

  // 2. PACIENTES (25 registros)
  const nomes = [
    "Ana Clara Souza", "João Pedro Silva", "Maria Eduarda Oliveira", "Pedro Henrique Santos", "Luiza Costa",
    "Gabriel Martins", "Júlia Ferreira", "Matheus Rodrigues", "Beatriz Gomes", "Lucas Almeida",
    "Laura Ribeiro", "Rafael Carvalho", "Manuela Mendes", "Guilherme Castro", "Isabella Barbosa",
    "Thiago Rocha", "Camila Fernandes", "Bruno Araújo", "Letícia Cardoso", "Felipe Dias",
    "Giovanna Freitas", "Leonardo Vieira", "Amanda Cavalcanti", "Rodrigo Nogueira", "Mariana Pinto"
  ];

  const pacientesData = nomes.map((nome, index) => {
    const padIndex = String(index + 1).padStart(4, '0');
    return {
      ubs_id: UBS_ID,
      cra: `DEMO-${padIndex}`,
      nome: nome,
      cpf: `123.456.${String(index).padStart(3, '0')}-00`,
      data_nascimento: new Date(1950 + Math.floor(Math.random() * 50), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      telefone: `(12) 99${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
      email: `${nome.split(' ')[0].toLowerCase()}@email.com`,
      ativo: index < 20, // Primeiros 20 ativos, 5 inativos (aguardando aprovação)
      criado_em: new Date(Date.now() - Math.random() * 10000000000)
    };
  });

  const insertedPacientes = await knex('pacientes').insert(pacientesData).returning(['id', 'ativo']);

  // 3. SOLICITAÇÕES (~45 registros)
  const tipos = ['exame', 'consulta', 'procedimento', 'cirurgia'];
  const statusList = [
    'em_analise', 'aguardando_regulacao', 'autorizado', 'data_marcada',
    'aguardando_resultado', 'concluido', 'cancelado'
  ];
  const prioridades = ['urgente', 'prioritario', 'rotina'];
  const descricoes = [
    { tec: "Consulta Ortopedia", pac: "Retorno com especialista" },
    { tec: "Hemograma Completo", pac: "Exame de sangue de rotina" },
    { tec: "Radiografia de Tórax", pac: "Raio-X de tórax" },
    { tec: "Eletrocardiograma", pac: "Avaliação do coração" },
    { tec: "Curativo Grau II", pac: "Troca de curativo" },
    { tec: "Consulta Oftalmologia", pac: "Consulta oftalmologista" },
    { tec: "Ecocardiograma Transtorácico", pac: "Ecocardiograma" },
    { tec: "Sessão Fisioterapia Motora", pac: "Fisioterapia para o ombro" },
    { tec: "Facoemulsificação", pac: "Cirurgia de catarata" },
    { tec: "Renovação de Receituário", pac: "Pegar receita médica" }
  ];

  const solicitacoesData = [];
  insertedPacientes.filter(p => p.ativo).forEach((paciente) => {
    // Cada paciente ativo recebe de 1 a 3 solicitações
    const qtd = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < qtd; i++) {
      const status = statusList[Math.floor(Math.random() * statusList.length)];
      const isConcluido = status === 'concluido';
      const isMarcado = status === 'data_marcada' || isConcluido;
      const desc = descricoes[Math.floor(Math.random() * descricoes.length)];
      
      solicitacoesData.push({
        ubs_id: UBS_ID,
        paciente_id: paciente.id,
        tipo: tipos[Math.floor(Math.random() * tipos.length)],
        descricao: desc.tec,
        descricao_paciente: desc.pac,
        status: status,
        prioridade: prioridades[Math.floor(Math.random() * prioridades.length)],
        data_solicitacao: new Date(Date.now() - Math.random() * 5000000000).toISOString().split('T')[0],
        data_prevista: isMarcado ? new Date(Date.now() + (isConcluido ? -1 : 1) * Math.random() * 2000000000).toISOString().split('T')[0] : null,
        data_conclusao: isConcluido ? new Date(Date.now() - Math.random() * 1000000000).toISOString().split('T')[0] : null,
        observacao_gestor: Math.random() > 0.7 ? "Atenção especial ao paciente." : null,
        observacao_paciente: Math.random() > 0.8 ? "Por favor chegar 15 minutos mais cedo." : null
      });
    }
  });

  await knex('solicitacoes').insert(solicitacoesData);

  // 4. MEDICAMENTOS (15 registros)
  const medicamentosData = [
    "Losartana 50mg", "Metformina 850mg", "Dipirona 500mg", "Amoxicilina 500mg", "Ibuprofeno 400mg",
    "Omeprazol 20mg", "Enalapril 10mg", "Atenolol 50mg", "Hidroclorotiazida 25mg", "Sinvastatina 20mg",
    "Glibenclamida 5mg", "Paracetamol 500mg", "Azitromicina 500mg", "Cefalexina 500mg", "Loratadina 10mg"
  ].map((nome, index) => ({
    ubs_id: UBS_ID,
    nome: nome,
    principio_ativo: nome.split(' ')[0],
    disponivel: Math.random() > 0.2, // Alguns indisponíveis
    observacao: Math.random() > 0.8 ? "Estoque baixo." : null
  }));

  await knex('medicamentos').insert(medicamentosData);

  // 5. COMUNICADOS (3 gerais, 2 individuais)
  const comunicadosData = [
    {
      ubs_id: UBS_ID,
      titulo: "Campanha de Vacinação",
      mensagem: "A campanha de vacinação contra a gripe começará na próxima semana. Compareça à UBS com documento e carteirinha de vacinação.",
      tipo: "geral",
      paciente_id: null
    },
    {
      ubs_id: UBS_ID,
      titulo: "Horário de Funcionamento",
      mensagem: "Na próxima sexta-feira, a UBS funcionará até as 12h. Serviços de urgência continuarão normalmente.",
      tipo: "geral",
      paciente_id: null
    },
    {
      ubs_id: UBS_ID,
      titulo: "Novos Medicamentos Disponíveis",
      mensagem: "Chegou o lote de medicamentos de uso contínuo. Pacientes com receita vigente podem retirar na farmácia da UBS.",
      tipo: "geral",
      paciente_id: null
    },
    {
      ubs_id: UBS_ID,
      titulo: "Retorno Solicitado",
      mensagem: "Por favor, compareça à UBS para retirar seus exames. Apresente este aviso na recepção.",
      tipo: "individual",
      paciente_id: insertedPacientes[0].id
    },
    {
      ubs_id: UBS_ID,
      titulo: "Atualização Cadastral",
      mensagem: "Precisamos que você atualize seu comprovante de residência. Traga um documento recente ao próximo atendimento.",
      tipo: "individual",
      paciente_id: insertedPacientes[1].id
    }
  ];

  await knex('comunicados').insert(comunicadosData);

  console.log('✅ Dados de demo inseridos com sucesso!');
};
