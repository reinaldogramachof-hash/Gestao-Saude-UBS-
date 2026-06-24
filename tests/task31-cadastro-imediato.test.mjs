/**
 * TESTES DE CONTRATO: TASK_31 - cadastro com acesso imediato
 * ---------------------------------------------------------------------------
 * Garante que o auto-cadastro deixe de ser uma fila de aprovacao remota e passe
 * a criar acesso imediato, comunicacao de boas-vindas e visibilidade ao gestor.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('cadastro publico cria paciente ativo, comunicado individual e push para gestores', async () => {
  const auth = await read('app/backend/src/routes/auth.js');

  assert.match(auth, /for\s*\(\s*let tentativa = 0;\s*tentativa < 5;\s*tentativa\+\+\s*\)/);
  assert.match(auth, /let cra,\s*craUnico = false/);
  assert.match(auth, /ativo:\s*true/);
  assert.doesNotMatch(auth, /cadastro-paciente[\s\S]*ativo:\s*false/);
  assert.match(auth, /knex\('comunicados'\)\.insert\(\{[\s\S]*titulo:\s*'Bem-vindo ao Gest[aã]o Sa[uú]de UBS\+!'/);
  assert.match(auth, /tipo:\s*'individual'/);
  assert.match(auth, /paciente_id:\s*paciente\.id/);
  assert.match(auth, /usuarios_gestores[\s\S]*where\(\{\s*ubs_id:\s*Number\(ubs_id\),\s*ativo:\s*true\s*\}\)/);
  assert.match(auth, /pushService\.enviar\(\s*gestor\.id,\s*'gestor',\s*\{/);
  assert.match(auth, /Novo paciente cadastrado/);
  assert.match(auth, /Acesse Pacientes para visualizar/);
});

test('gestor ve novos pacientes dos ultimos sete dias em vez de fila inativa', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const frontend = await read('app/frontend/src/pages/gestor/GestorPacientes.jsx');
  const dashboard = await read('app/frontend/src/pages/gestor/DashboardGestor.jsx');

  assert.match(gestor, /where\('pacientes\.ativo',\s*true\)/);
  assert.match(gestor, /where\('pacientes\.criado_em',\s*'>=',\s*knex\.raw\("NOW\(\) - INTERVAL '7 days'"\)\)/);
  assert.doesNotMatch(gestor, /pacientes\/pendentes[\s\S]{0,500}where\(\{\s*'pacientes\.ativo':\s*false\s*\}\)/);
  assert.match(frontend, /Novos Pacientes/);
  assert.doesNotMatch(frontend, /Aguardando Aprova[cç][aã]o/);
  assert.match(dashboard, /novo\{pendentes > 1 \? 's' : ''\} paciente/);
});

test('confirmacao do cadastro orienta acesso imediato e validacao presencial', async () => {
  const cadastro = await read('app/frontend/src/pages/paciente/CadastroPaciente.jsx');

  assert.match(cadastro, /Cadastro realizado com sucesso!/);
  assert.match(cadastro, /Voc[eê] j[aá] pode acessar o sistema com seu CRA e data de nascimento/);
  assert.match(cadastro, /Para validar seus documentos, agende uma visita/);
  assert.match(cadastro, /Acessar agora/);
  assert.doesNotMatch(cadastro, /Aguarde a aprova[cç][aã]o|aguard[eé] aprova[cç][aã]o|ser[aá] analisada/);
});

test('seed da banca cria pacientes ativos, solicitacoes variadas e dados de UBS Vila Maria', async () => {
  const seed = await read('app/backend/src/db/seeds/007_demo_banca_task31.js');

  for (const cra of ['2606260001', '2606260002', '2606260003', '2606260004', '2606260005']) {
    assert.match(seed, new RegExp(cra));
  }

  assert.match(seed, /UBS Vila Maria/);
  assert.match(seed, /ativo:\s*true/);
  assert.match(seed, /onConflict\('cra'\)\.merge\(\)/);
  assert.match(seed, /data_marcada/);
  assert.match(seed, /aguardando_regulacao/);
  assert.match(seed, /autorizado/);
  assert.match(seed, /concluido/);
  assert.match(seed, /Metformina 850mg/);
  assert.match(seed, /Losartana 50mg/);
  assert.match(seed, /Atorvastatina 20mg/);
  assert.match(seed, /Previsao de chegada: 30\/06\/2026/);
  assert.match(seed, /Omeprazol 20mg/);
  assert.match(seed, /2026-06-26T14:00:00/);
});
