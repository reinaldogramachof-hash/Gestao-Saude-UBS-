/**
 * TESTES DE CONTRATO: Portal externo frontend x backend
 * ---------------------------------------------------------------------------
 * Garante que o frontend use exatamente as rotas e payloads expostos pelas
 * rotas Express do portal de unidades externas.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('frontend externo usa endpoints reais receber, agendar e concluir', async () => {
  const source = await read('app/frontend/src/pages/externa/EncaminhamentosExterna.jsx');

  assert.doesNotMatch(source, /\/status/);
  assert.match(source, /executarAcao\(id,\s*['"]receber['"]\)/);
  assert.match(source, /executarAcao\(enc\.id,\s*['"]agendar['"]/);
  assert.match(source, /executarAcao\(encRetorno\.id,\s*['"]concluir['"]/);
  assert.match(source, /api\.put\(`\/externa\/encaminhamento\/\$\{id\}\/\$\{acao\}`,\s*payload\)/);
});

test('frontend externo envia payloads Joi do backend para agendar e concluir', async () => {
  const source = await read('app/frontend/src/pages/externa/EncaminhamentosExterna.jsx');

  assert.match(source, /data_procedimento_unidade:\s*dataAgendamento/);
  assert.doesNotMatch(source, /data_agendamento/);
  assert.match(source, /feedback_conduta:\s*retornoForm\.conduta/);
  assert.doesNotMatch(source, /^\s*conduta:\s*retornoForm\.conduta/m);
});

test('frontend externo trata CONFIRMADO_PACIENTE como pronto para retorno', async () => {
  const source = await read('app/frontend/src/pages/externa/EncaminhamentosExterna.jsx');

  assert.match(source, /CONFIRMADO_PACIENTE:\s*['"]Paciente confirmado['"]/);
  assert.match(source, /enc\.status === ['"]CONFIRMADO_PACIENTE['"]/);
  assert.match(source, /\[['"]AGENDADO['"],\s*['"]CONFIRMADO_PACIENTE['"]\]\.includes\(enc\.status\)/);
});

test('dashboard externo calcula concluidosHoje pelo feedback_data_retorno retornado pelo backend', async () => {
  const source = await read('app/frontend/src/pages/externa/DashboardExterna.jsx');

  assert.match(source, /const hojeISO = new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/);
  assert.match(source, /e\.status === ['"]RETORNO_UBS['"][\s\S]*e\.feedback_data_retorno\?\.slice\(0,\s*10\) === hojeISO/);
});
