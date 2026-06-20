/**
 * TESTES DE CONTRATO: Bloco 1 - Correcoes Criticas
 * ---------------------------------------------------------------------------
 * Estes testes leem os arquivos de producao e verificam os contratos de
 * seguranca e apresentacao exigidos pelo sprint. Eles nao acessam o banco
 * remoto, portanto podem ser executados localmente e no CI sem credenciais.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('autenticacao consulta somente contas ativas', async () => {
  const source = await read('app/backend/src/routes/auth.js');

  assert.match(source, /\.where\(\{\s*email,\s*ativo:\s*true\s*\}\)/);
  assert.match(source, /\.where\(\{\s*cra,\s*ativo:\s*true\s*\}\)/);
});

test('atualizacao de status segue modo matriz e registra auditoria', async () => {
  const source = await read('app/backend/src/routes/gestor.js');

  assert.match(source, /router\.put\('\/solicitacao\/:id\/status'/);
  assert.match(source, /acao:\s*'solicitacao_status_atualizar'/);
  assert.match(source, /metadata:\s*\{\s*status_novo/);
  assert.doesNotMatch(source, /router\.put\('\/solicitacao\/:id\/status'[\s\S]*solicitacoes\.ubs_id['"],\s*req\.user\.ubs_id/);
});

test('criacao de solicitacao grava o primeiro historico na mesma transacao', async () => {
  const source = await read('app/backend/src/routes/gestor.js');

  assert.match(source, /knex\.transaction\(async \(trx\) => \{[\s\S]*trx\('solicitacoes'\)[\s\S]*trx\('historico_status'\)\.insert/s);
  assert.match(source, /status_anterior:\s*null/);
  assert.match(source, /Solicita.*registrada no sistema/);
});

test('rotas do paciente selecionam somente campos publicos de solicitacao', async () => {
  const source = await read('app/backend/src/routes/paciente.js');
  const requiredFields = [
    'id',
    'tipo',
    'descricao_paciente',
    'status',
    'prioridade',
    'data_solicitacao',
    'data_prevista',
    'data_conclusao',
    'observacao_paciente',
    'criado_em',
    'atualizado_em',
  ];

  for (const field of requiredFields) {
    assert.match(source, new RegExp(`['"]${field}['"]`));
  }

  assert.doesNotMatch(source, /select\(\s*['"]\*['"]\s*\)/);
  assert.doesNotMatch(source, /\.select\([^)]*observacao_gestor/);
  assert.doesNotMatch(source, /\.select\([^)]*['"]descricao['"]/);
});

test('dashboard do paciente retorna somente status ativos por prioridade', async () => {
  const source = await read('app/backend/src/routes/paciente.js');

  assert.match(source, /\.whereNotIn\('status',\s*\['concluido',\s*'cancelado'\]\)/);
  assert.match(source, /CASE prioridade[\s\S]*WHEN 'urgente' THEN 1[\s\S]*WHEN 'prioritario' THEN 2[\s\S]*ELSE 3[\s\S]*END ASC/s);
  assert.match(source, /\.orderBy\('data_solicitacao',\s*'desc'\)/);
});

test('interceptor 401 preserva o portal correto antes de limpar a sessao', async () => {
  const source = await read('app/frontend/src/services/api.js');

  assert.match(source, /JSON\.parse\(localStorage\.getItem\('@UBS_User'\)\s*\|\|\s*'\{\}'\)/);
  assert.match(source, /usuario\.tipo\s*===\s*'gestor'/);
  assert.match(source, /window\.location\.href\s*=\s*['"]\/login-gestor['"]/);
  assert.match(source, /window\.location\.href\s*=\s*['"]\/login-paciente['"]/);
});

test('paginas do paciente usam helper compartilhado e nao exibem descricao tecnica', async () => {
  const helper = await read('app/frontend/src/utils/statusHelper.js');
  const dashboard = await read('app/frontend/src/pages/paciente/DashboardPaciente.jsx');
  const detalhe = await read('app/frontend/src/pages/paciente/DetalheSolicitacao.jsx');

  assert.match(helper, /export const STATUS_LABELS/);
  assert.match(helper, /export const STATUS_CORES/);
  assert.match(dashboard, /STATUS_LABELS\[sol\.status\]/);
  assert.match(dashboard, /STATUS_CORES\[sol\.status\]/);
  assert.match(detalhe, /STATUS_LABELS\[h\.status_novo\]/);
  assert.match(detalhe, /STATUS_CORES\[h\.status_novo\]/);
  assert.doesNotMatch(dashboard, /sol\.descricao(?!_paciente)/);
  assert.doesNotMatch(detalhe, /sol\.descricao(?!_paciente)/);
  assert.doesNotMatch(detalhe, /observacao_gestor/);
});
