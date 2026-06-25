// ─────────────────────────────────────────────────────────────────────────────
// SEED: 008_slots_banca.js
// FUNÇÃO: Popula a tabela `agendamentos_gestao` com slots de agendamento de
//         validação cadastral disponíveis e futuros para as 5 principais UBSs:
//         UBS Centro, UBS Vila Maria, UBS Vila Industrial, UBS Jardim Satélite e UBS Interlagos.
//         Isso garante que qualquer novo paciente auto-cadastrado localmente
//         em qualquer uma dessas UBSs encontre slots de agendamento disponíveis
//         para testar/apresentar o fluxo de auto-ativação na banca.
//
// DESIGN INTENT (DINÂMICO E IDEMPOTENTE):
//   1. Horários no Futuro: Gera horários calculados dinamicamente baseados no
//      momento de execução (offsets de 1h a 48h a partir de agora). Dessa forma,
//      sempre haverá slots válidos e futuros, independentemente de quando
//      o seed for executado (hoje no teste ou amanhã na banca).
//   2. Preservação de Agendamentos: Utiliza faixas de IDs fixas para cada UBS.
//      Antes de atualizar, consulta quais slots já foram reservados por pacientes
//      e preserva-os intactos, evitando sobrescrever dados de teste do usuário.
// ─────────────────────────────────────────────────────────────────────────────

exports.seed = async function seed(knex) {
  // Configurações das 5 principais UBSs de teste e suas faixas de IDs de demonstração
  const ubsConfig = [
    { nome: 'UBS Centro',            inicioId: 32000 },
    { nome: 'UBS Vila Maria',         inicioId: 32100 },
    { nome: 'UBS Vila Industrial',    inicioId: 32200 },
    { nome: 'UBS Jardim Satélite',    inicioId: 32300 },
    { nome: 'UBS Interlagos',         inicioId: 32400 },
  ];

  console.log('\n🌱 Gerando slots de agendamento dinâmicos e futuros para a banca...');

  for (const conf of ubsConfig) {
    // 1. Busca a UBS pelo nome cadastrado
    const ubs = await knex('ubs').where({ nome: conf.nome }).first();
    if (!ubs) {
      console.log(`  ⚠️ UBS "${conf.nome}" não encontrada no banco. Rode o seed de UBS antes.`);
      continue;
    }

    // 2. Busca o primeiro gestor ativo desta UBS para ser o responsável do slot
    let gestor = await knex('usuarios_gestores')
      .where({ ubs_id: ubs.id, ativo: true })
      .first();

    // Caso não exista gestor específico ativo na UBS de teste, busca qualquer gestor ativo no sistema
    if (!gestor) {
      gestor = await knex('usuarios_gestores').where({ ativo: true }).first();
    }

    // 3. Define 15 offsets em horas a partir de 'agora' para criar slots futuros distribuídos
    //    Cobre o dia de hoje (próximas horas) e os próximos dois dias
    const offsetsHoras = [
      1, 2, 3, 4, 5,       // Hoje (próximas 5 horas)
      18, 19, 20, 21, 22,  // Amanhã (dia da banca - faixa matutina/vespertina)
      24, 25, 26, 42, 43,  // Amanhã à noite e depois de amanhã
    ];

    // Mapeia os IDs fixos que serão usados para esta UBS
    const idsEsperados = offsetsHoras.map((_, idx) => conf.inicioId + idx);

    // 4. Consulta quais desses IDs já existem no banco e estão com status = 'reservado'
    //    Isso é crítico para não sobrescrever agendamentos reais já feitos em testes locais
    const existentesReservados = await knex('agendamentos_gestao')
      .whereIn('id', idsEsperados)
      .andWhere({ status: 'reservado' })
      .select('id');

    const reservadosSet = new Set(existentesReservados.map(r => r.id));

    // 5. Prepara os novos slots que estão disponíveis para serem inseridos/mesclados
    const slotsParaInserir = [];
    const agora = new Date();

    offsetsHoras.forEach((offset, idx) => {
      const idSlot = conf.inicioId + idx;

      // Se o slot já está reservado por um paciente, ignoramos para preservar a reserva
      if (reservadosSet.has(idSlot)) {
        console.log(`  - Slot ID ${idSlot} (${conf.nome}) já está reservado por um paciente. Preservando.`);
        return;
      }

      // Calcula a data e hora futura com base no offset
      const dataHoraFutura = new Date(agora.getTime() + offset * 60 * 60 * 1000);

      slotsParaInserir.push({
        id: idSlot,
        ubs_id: ubs.id,
        paciente_id: null,
        gestor_responsavel_id: gestor?.id || null,
        data_hora: dataHoraFutura.toISOString(),
        duracao_minutos: 15,
        status: 'disponivel',
        motivo: `Slot de validação cadastral para ${conf.nome}.`,
        criado_em: agora.toISOString(),
      });
    });

    // 6. Insere ou atualiza os slots disponíveis usando mesclagem no conflito de ID
    if (slotsParaInserir.length > 0) {
      await knex('agendamentos_gestao')
        .insert(slotsParaInserir)
        .onConflict('id')
        .merge();
      console.log(`  ✓ Gerados/Atualizados ${slotsParaInserir.length} slots disponíveis para "${conf.nome}".`);
    }
  }

  console.log('✅ Geração de slots concluída com sucesso!\n');
};
