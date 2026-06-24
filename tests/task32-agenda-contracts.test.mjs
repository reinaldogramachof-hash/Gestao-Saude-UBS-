/**
 * TESTES DE CONTRATO: TASK_32 - Revisao do modulo de agenda
 * ---------------------------------------------------------------------------
 * Protege os bugs corrigidos na agenda sem depender de banco remoto: valida
 * janela 07h-18h, exclusao em massa, grade em lote, UI do gestor e seed demo.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('schema de agenda em lote aceita intervalo de 20 minutos e mantem defaults', () => {
  const { agendamentoLoteSchema } = require('../app/backend/src/validators/securitySchemas.js');

  const valido = agendamentoLoteSchema.validate({
    data_inicio: '2026-06-26',
    hora_inicio: '08:00',
    hora_fim: '10:00',
    intervalo_minutos: 20,
  });

  assert.equal(valido.error, undefined);
  assert.equal(valido.value.repetir_dias, 1);
  assert.equal(valido.value.pular_fins_de_semana, true);
});

test('backend rejeita slots fora do funcionamento 07h-18h em rotas singular e lote', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');

  assert.match(gestor, /const AGENDA_HORA_ABERTURA_MIN = 7 \* 60/);
  assert.match(gestor, /const AGENDA_HORA_FECHAMENTO_MIN = 18 \* 60/);
  assert.match(gestor, /function validarHorarioFuncionamento/);
  assert.match(gestor, /Hor[aá]rio fora do per[ií]odo de funcionamento \(07h/);

  const lote = gestor.match(/router\.post\('\/agendamentos\/lote'[\s\S]*?router\.post\('\/agendamento'/)?.[0] || '';
  assert.match(lote, /validarHorarioFuncionamento\(inicioMin\)/);
  assert.match(lote, /validarHorarioFuncionamento\(fimMin - 1\)/);

  const singular = gestor.match(/router\.post\('\/agendamento'[\s\S]*?router\.put\('\/agendamento\/:id'/)?.[0] || '';
  assert.match(singular, /minutosDoHorario\(dataHora/);
  assert.match(singular, /validarHorarioFuncionamento\(minutosSlot\)/);
});

test('backend expoe exclusao em massa apenas para slots disponiveis da UBS do gestor', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const rota = gestor.match(/router\.delete\('\/agendamentos\/em-massa'[\s\S]*?router\.delete\('\/agendamento\/:id'/)?.[0] || '';

  assert.match(rota, /router\.delete\('\/agendamentos\/em-massa'/);
  assert.match(rota, /Array\.isArray\(ids\)/);
  assert.match(rota, /whereIn\('id', idsUnicos\)/);
  assert.match(rota, /where\(\{ ubs_id: req\.user\.ubs_id \}\)/);
  assert.match(rota, /status === 'disponivel' && !slot\.paciente_id/);
  assert.match(rota, /whereIn\('id', excluiveis/);
  assert.match(rota, /ignorados/);
});

test('frontend gestor valida horario, mostra preview e permite selecao multipla', async () => {
  const source = await read('app/frontend/src/pages/gestor/AgendamentosGestor.jsx');

  assert.match(source, /HORARIO_MINIMO = '07:00'/);
  assert.match(source, /HORARIO_MAXIMO = '18:00'/);
  assert.match(source, /Hor[aá]rio fora do funcionamento da UBS \(07h/);
  assert.match(source, /min="07:00"/);
  assert.match(source, /max="18:00"/);
  assert.match(source, /<option value=\{20\}>20 minutos<\/option>/);
  assert.match(source, /Criar grade de hor[aá]rios/);
  assert.match(source, /horariosPreview/);
  assert.match(source, /Excluir selecionados/);
  assert.match(source, /selecionados/);
  assert.match(source, /\/gestor\/agendamentos\/em-massa/);
  assert.match(source, /type="checkbox"/);
});

test('paciente continua vendo apenas slots futuros da propria UBS', async () => {
  const paciente = await read('app/backend/src/routes/paciente.js');
  const rota = paciente.match(/router\.get\('\/agendamentos\/disponiveis'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(rota, /where\(\{ ubs_id: req\.user\.ubs_id, status: 'disponivel' \}\)/);
  assert.match(rota, /andWhere\('data_hora', '>', knex\.fn\.now\(\)\)/);
});

test('seed 008 cria slots da banca para UBS Vila Maria de forma idempotente', async () => {
  const seed = await read('app/backend/src/db/seeds/008_slots_banca.js');

  assert.match(seed, /UBS Vila Maria/);
  assert.match(seed, /2026-06-26T19:00:00/);
  assert.match(seed, /2026-06-26T21:15:00/);
  assert.match(seed, /paciente_id:\s*null/);
  assert.match(seed, /status:\s*'disponivel'/);
  assert.match(seed, /onConflict\('id'\)\.merge\(\)/);
});
