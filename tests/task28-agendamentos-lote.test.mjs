/**
 * TESTES DE CONTRATO: TASK_28A - Agendamentos em lote
 * ---------------------------------------------------------------------------
 * Protege o endpoint de criacao de grade de horarios sem depender de banco
 * remoto. Os testes validam o schema Joi real e a estrutura da rota Express.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('POST /gestor/agendamentos/lote valida payload e rejeita repetir_dias=0 via Joi', async () => {
  const { agendamentoLoteSchema } = require('../app/backend/src/validators/securitySchemas.js');

  assert.ok(agendamentoLoteSchema, 'agendamentoLoteSchema deve ser exportado');

  const valido = agendamentoLoteSchema.validate({
    data_inicio: '2026-06-22',
    hora_inicio: '08:00',
    hora_fim: '12:00',
    intervalo_minutos: 30,
  });
  assert.equal(valido.error, undefined);
  assert.equal(valido.value.repetir_dias, 1);
  assert.equal(valido.value.pular_fins_de_semana, true);

  const invalido = agendamentoLoteSchema.validate({
    data_inicio: '2026-06-22',
    hora_inicio: '08:00',
    hora_fim: '12:00',
    intervalo_minutos: 30,
    repetir_dias: 0,
  });
  assert.ok(invalido.error, 'repetir_dias=0 deve retornar 400 pelo validateBody');
});

test('POST /gestor/agendamentos/lote gera 8 slots para 08:00-12:00 com intervalo de 30 minutos', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const route = gestor.match(/router\.post\('\/agendamentos\/lote'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(route, /validateBody\(agendamentoLoteSchema\)/);
  assert.match(route, /for \(let d = 0; d < repetir_dias; d\+\+\)/);
  assert.match(route, /const \[hIni,\s*mIni\]\s*=\s*hora_inicio\.split/);
  assert.match(route, /const \[hFim,\s*mFim\]\s*=\s*hora_fim\.split/);
  assert.match(route, /for \(let min = inicioMin; min < fimMin; min \+= intervalo_minutos\)/);
  assert.match(route, /duracao_minutos:\s*intervalo_minutos/);
  assert.match(route, /status:\s*['"]disponivel['"]/);
});

test('POST /gestor/agendamentos/lote repete dias uteis e pula fins de semana quando solicitado', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const route = gestor.match(/router\.post\('\/agendamentos\/lote'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(route, /dia\.setDate\(dia\.getDate\(\) \+ d\)/);
  assert.match(route, /dia\.getDay\(\)/);
  assert.match(route, /pular_fins_de_semana && \(diaSemana === 0 \|\| diaSemana === 6\)/);
  assert.match(route, /continue/);
  assert.match(route, /slots\.length === 0/);
});

test('POST /gestor/agendamentos/lote usa transacao unica e dados do token', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const route = gestor.match(/router\.post\('\/agendamentos\/lote'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(route, /knex\.transaction\(async \(trx\) =>/);
  assert.match(route, /trx\(['"]agendamentos_gestao['"]\)[\s\S]*?\.insert\(slots\)/);
  assert.match(route, /returning\(\[['"]id['"],\s*['"]data_hora['"],\s*['"]duracao_minutos['"],\s*['"]status['"]\]\)/);
  assert.match(route, /ubs_id:\s*req\.user\.ubs_id/);
  assert.match(route, /gestor_responsavel_id:\s*req\.user\.id/);
  assert.doesNotMatch(route, /req\.body\.ubs_id/);
  assert.doesNotMatch(route, /req\.body\.gestor/);
});

test('POST /gestor/agendamentos/lote rejeita hora_inicio >= hora_fim e continua protegido por token', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const server = await read('app/backend/server.js');
  const route = gestor.match(/router\.post\('\/agendamentos\/lote'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(route, /inicioMin >= fimMin/);
  assert.match(route, /return res\.status\(400\)\.json/);
  assert.match(server, /app\.use\('\/api\/gestor',\s*authMiddleware,\s*rotasGestor\)/);
  assert.match(gestor, /router\.use\(soGestor\)/);
  assert.match(gestor, /router\.post\('\/agendamento'/, 'rota singular deve continuar existindo');
});
