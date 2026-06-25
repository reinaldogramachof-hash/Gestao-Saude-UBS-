// limpar_solicitacoes_reinaldo.js — Limpeza de solicitações e prontuário do paciente principal
// Mantém apenas o cadastro básico e a assinatura de push do Reinaldo Gramacho
// Executa: node limpar_solicitacoes_reinaldo.js (a partir de app/backend)

require('dotenv').config();
const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function limpar() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  LIMPEZA DE SOLICITAÇÕES — Reinaldo Gramacho');
  console.log('═══════════════════════════════════════════════════\n');
  
  // 1. Localiza o paciente Reinaldo Gramacho
  const reinaldo = await knex('pacientes')
    .whereRaw("LOWER(nome) LIKE LOWER('%Reinaldo Gramacho%')")
    .first();
    
  if (!reinaldo) {
    console.error('❌ ERRO CRÍTICO: Paciente "Reinaldo Gramacho" não encontrado no banco!');
    await knex.destroy();
    return;
  }
  
  console.log(`👤 Paciente: ${reinaldo.nome} (ID: ${reinaldo.id})`);
  console.log('Limpando solicitações, encaminhamentos, atendimentos e histórico de testes...\n');
  
  // 2. Busca e coleta IDs de todas as solicitações dele
  const solicitacoes = await knex('solicitacoes')
    .where('paciente_id', reinaldo.id)
    .select('id');
  const idsSol = solicitacoes.map(s => s.id);
  
  if (idsSol.length > 0) {
    // Limpa histórico de status das solicitações dele
    const delHist = await knex('historico_status').whereIn('solicitacao_id', idsSol).del();
    console.log(`  ✓ Deletados ${delHist} registros de histórico de status.`);
    
    // Limpa encaminhamentos externos das solicitações dele
    const delEnc = await knex('encaminhamentos').whereIn('solicitacao_id', idsSol).del();
    console.log(`  ✓ Deletados ${delEnc} registros de encaminhamentos externos.`);
  }
  
  // 3. Limpa encaminhamentos adicionais remanescentes por paciente_id se houver
  const delEncRest = await knex('encaminhamentos').where('paciente_id', reinaldo.id).del();
  if (delEncRest > 0) {
    console.log(`  ✓ Deletados ${delEncRest} registros adicionais de encaminhamentos.`);
  }

  // 4. Limpa as solicitações dele
  const delSol = await knex('solicitacoes').where('paciente_id', reinaldo.id).del();
  console.log(`  ✓ Deletados ${delSol} registros de solicitações.`);
  
  // 5. Limpa atendimentos dele (prontuário clínico)
  const delAtend = await knex('atendimentos').where('paciente_id', reinaldo.id).del();
  console.log(`  ✓ Deletados ${delAtend} registros de atendimentos clínicos.`);
  
  // 6. Limpa notificações de vigilância dele
  const delVig = await knex('notificacoes_vigilancia').where('paciente_id', reinaldo.id).del();
  console.log(`  ✓ Deletados ${delVig} registros de vigilância em saúde.`);
  
  // OBSERVAÇÃO: Mantemos a tabela 'push_subscriptions' intacta para este usuário,
  // garantindo que ele não precise reautorizar as notificações em seu smartphone de testes.
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Limpeza de solicitações concluída.');
  console.log('═══════════════════════════════════════════════════\n');
  
  await knex.destroy();
}

limpar().catch(async (e) => {
  console.error('\n❌ ERRO NA EXECUÇÃO DO SCRIPT:', e.message);
  await knex.destroy();
  process.exit(1);
});
