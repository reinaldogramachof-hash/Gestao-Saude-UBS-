/**
 * TESTES DE CONTRATO: TASK_30 - UX do Portal do Paciente
 * ---------------------------------------------------------------------------
 * Protege os ajustes visuais de alta e media prioridade sem depender de browser.
 * Os testes leem os componentes React e garantem que os blocos combinados pelo
 * Arquiteto permanecam presentes no codigo.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('dashboard exibe card hero do proximo agendamento e mantém grid com agenda generica', async () => {
  const source = await read('app/frontend/src/pages/paciente/DashboardPaciente.jsx');

  assert.match(source, /Card Hero: Proximo Agendamento/);
  assert.match(source, /proximoAgendamento && \(/);
  assert.match(source, /Pr.xima consulta/);
  assert.match(source, /formatarProximoAg\(proximoAgendamento\.data_hora\)/);
  assert.match(source, /titulo="Agendamentos"/);
  assert.match(source, /valor=\{"Ver agenda"\}/);
  assert.doesNotMatch(source, /titulo="Pr.ximo Agendamento"/);
});

test('dashboard adiciona barra resumo e reduz espaçamentos principais', async () => {
  const source = await read('app/frontend/src/pages/paciente/DashboardPaciente.jsx');

  assert.match(source, /const solicitacoesAtivas = sols\.filter/);
  assert.match(source, /Barra resumo rapido/);
  assert.match(source, /solicitacoesAtivas\.length/);
  assert.match(source, /unreadComunicados > 0/);
  assert.match(source, /pendenciasConfirmacao\.length > 0/);
  assert.match(source, /pt-3 pb-5/);
  assert.match(source, /mt-1 md:pb-12 relative z-20 space-y-3/);
  assert.match(source, /p-3 rounded-2xl/);
  assert.match(source, /rounded-xl px-3 py-2/);
});

test('solicitacoes define FLUXO fora do componente e renderiza mini-stepper', async () => {
  const source = await read('app/frontend/src/pages/paciente/SolicitacoesPaciente.jsx');

  assert.match(source, /const FLUXO = \[/);
  for (const status of ['em_analise', 'aguardando_regulacao', 'autorizado', 'data_marcada', 'concluido']) {
    assert.match(source, new RegExp(`'${status}'`));
  }
  assert.match(source, /Mini-stepper de progresso da solicitacao/);
  assert.match(source, /FLUXO\.indexOf\(sol\.status\)/);
  assert.match(source, /if \(sol\.status === 'cancelado'\) return null/);
  assert.match(source, /FLUXO\.map\(\(etapa, i\) =>/);
});

test('medicamentos exibe dosagem, atualização e previsão quando indisponível', async () => {
  const source = await read('app/frontend/src/pages/paciente/Medicamentos.jsx');

  assert.match(source, /m\.dosagem/);
  assert.match(source, /Atualizado em \{formatarData\(m\.atualizado_em\)\}/);
  assert.match(source, /m\.previsao_disponibilidade/);
  assert.match(source, /Previs.o de chegada:/);
  assert.match(source, /Procure a equipe da UBS/);
  assert.match(source, /m\.disponivel \? 'Dispon.vel' : 'Indispon.vel'/);
});
