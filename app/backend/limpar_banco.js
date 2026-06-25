// limpar_banco.js — Limpeza de dados de desenvolvimento
// Mantém apenas o cadastro de paciente do desenvolvedor "Reinaldo Gramacho"
// Executa: node limpar_banco.js (a partir de app/backend)

require('dotenv').config();
const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function limpar() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  LIMPEZA DO BANCO DE DADOS — Gestão Saúde UBS+');
  console.log('═══════════════════════════════════════════════════\n');
  
  // 1. Localiza o paciente Reinaldo Gramacho (case-insensitive)
  const reinaldo = await knex('pacientes')
    .whereRaw("LOWER(nome) LIKE LOWER('%Reinaldo Gramacho%')")
    .first();
    
  if (!reinaldo) {
    console.error('❌ ERRO CRÍTICO: Paciente "Reinaldo Gramacho" não encontrado no banco de dados!');
    console.log('Certifique-se de que o cadastro dele existe antes de rodar o script.');
    await knex.destroy();
    return;
  }
  
  console.log(`👤 Paciente principal encontrado: ${reinaldo.nome} (ID: ${reinaldo.id}, CRA: ${reinaldo.cra})`);
  console.log('Removendo os demais cadastros simulados de forma segura...\n');
  
  // 2. Busca solicitações de outros pacientes para limpar dependências em cascata
  const solicitacoesNaoReinaldo = await knex('solicitacoes')
    .whereNot('paciente_id', reinaldo.id)
    .select('id');
  const idsSolNaoReinaldo = solicitacoesNaoReinaldo.map(s => s.id);
  
  if (idsSolNaoReinaldo.length > 0) {
    // Limpa histórico de status dessas solicitações
    const delHist = await knex('historico_status').whereIn('solicitacao_id', idsSolNaoReinaldo).del();
    console.log(`  ✓ Deletados ${delHist} registros de histórico de status.`);
    
    // Limpa encaminhamentos externos dessas solicitações
    const delEnc = await knex('encaminhamentos').whereIn('solicitacao_id', idsSolNaoReinaldo).del();
    console.log(`  ✓ Deletados ${delEnc} registros de encaminhamentos externos.`);
  }
  
  // 3. Limpa encaminhamentos restantes por paciente_id
  const delEncRest = await knex('encaminhamentos').whereNot('paciente_id', reinaldo.id).del();
  if (delEncRest > 0) {
    console.log(`  ✓ Deletados ${delEncRest} registros adicionais de encaminhamentos.`);
  }

  // 4. Limpa as solicitações
  const delSol = await knex('solicitacoes').whereNot('paciente_id', reinaldo.id).del();
  console.log(`  ✓ Deletados ${delSol} registros de solicitações.`);
  
  // 5. Limpa atendimentos de outros pacientes
  const delAtend = await knex('atendimentos').whereNot('paciente_id', reinaldo.id).del();
  console.log(`  ✓ Deletados ${delAtend} registros de atendimentos clínicos.`);
  
  // 6. Limpa notificações de vigilância de outros pacientes
  const delVig = await knex('notificacoes_vigilancia').whereNot('paciente_id', reinaldo.id).del();
  console.log(`  ✓ Deletados ${delVig} registros de vigilância em saúde.`);
  
  // 7. Limpa tabelas adicionais e opcionais que podem referenciar o paciente
  const tabelasOpcionais = [
    { nome: 'push_subscriptions', col: 'usuario_id', cond: { tipo_usuario: 'paciente' }, label: 'inscrições de push' },
    { nome: 'agendamentos_gestao', col: 'paciente_id', label: 'agendamentos com a gestão' },
    { nome: 'slots_agenda', col: 'paciente_id', label: 'slots de agenda reservados' },
    { nome: 'agendamentos', col: 'paciente_id', label: 'agendamentos de consultas' },
    { nome: 'comunicados', col: 'paciente_id', label: 'comunicados individuais' },
  ];
  
  for (const tab of tabelasOpcionais) {
    try {
      const query = knex(tab.nome).whereNot(tab.col, reinaldo.id);
      if (tab.cond) {
        query.andWhere(tab.cond);
      }
      const delRows = await query.del();
      if (delRows > 0) {
        console.log(`  ✓ Deletados ${delRows} registros de ${tab.label}.`);
      }
    } catch (e) {
      // Ignora silenciosamente se a tabela ou coluna não existir no esquema
    }
  }
  
  // 8. Remove os demais pacientes
  const delPac = await knex('pacientes').whereNot('id', reinaldo.id).del();
  console.log(`  ✓ Deletados ${delPac} cadastros de pacientes adicionais.`);
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Limpeza de banco de dados concluída.');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Contagem geral final
  const [{ count: totalPac }] = await knex('pacientes').count('* as count');
  console.log(`📊 Total no banco de dados agora: ${totalPac} paciente(s).\n`);
  
  await knex.destroy();
}

limpar().catch(async (e) => {
  console.error('\n❌ ERRO NA EXECUÇÃO DO SCRIPT:', e.message);
  await knex.destroy();
  process.exit(1);
});
