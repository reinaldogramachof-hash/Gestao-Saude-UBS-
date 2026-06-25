/**
 * TESTES DE CONTRATO: Módulo de Relatórios (RF-G09)
 * ---------------------------------------------------------------------------
 * Valida a fiação backend e frontend para o Relatório Simples de Atividade.
 * Protege o isolamento multi-tenant por UBS, autenticação e contratos visuais.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('backend gestor expõe rota de relatórios protegida e filtrada por ubs_id', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const route = gestor.match(/router\.get\('\/relatorios'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(gestor, /router\.get\('\/relatorios'/);
  assert.match(route, /const ubsId = req\.user\.ubs_id/);
  assert.match(route, /where\(\{\s*ubs_id:\s*ubsId\s*\}\)/);
  assert.match(route, /where\('solicitacoes\.ubs_id',\s*ubsId\)/);
  assert.match(route, /whereNotIn\(['"]status['"],\s*\['concluido',\s*'cancelado'\]\)/);
  assert.match(route, /relatorio_atividade_gerado/);
});

test('relatório de urgências ociosas no backend faz join seguro e oculta CPF', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const route = gestor.match(/router\.get\('\/relatorios'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(route, /join\(['"]pacientes['"],\s*['"]solicitacoes\.paciente_id['"],\s*['"]pacientes\.id['"]\)/);
  assert.match(route, /where\('solicitacoes\.prioridade',\s*['"]urgente['"]\)/);
  assert.match(route, /pacientes\.nome as paciente_nome/);
  assert.match(route, /pacientes\.cra as paciente_cra/);
  assert.doesNotMatch(route, /pacientes\.cpf|['"]cpf['"]/);
});

test('frontend App.jsx registra rota e importação de RelatoriosGestor', async () => {
  const app = await read('app/frontend/src/App.jsx');

  assert.match(app, /import RelatoriosGestor from ['"]\.\/pages\/gestor\/RelatoriosGestor['"]/);
  assert.match(app, /path=['"]\/gestor\/relatorios['"]/);
  assert.match(app, /<ProtectedRoute tipo="gestor"><RelatoriosGestor \/><\/ProtectedRoute>/);
});

test('SideNavGestor ativa permissões de relatórios e exibe item no menu', async () => {
  const sideNav = await read('app/frontend/src/components/gestor/SideNavGestor.jsx');

  assert.match(sideNav, /relatorios:\s*\[['"]gestor['"],\s*['"]admin['"]\]/);
  assert.match(sideNav, /pode\(['"]relatorios['"]\)/);
  assert.match(sideNav, /to=['"]\/gestor\/relatorios['"]/);
  assert.match(sideNav, /icon=['"]bar_chart_4_bars['"]/);
  assert.match(sideNav, /label=['"]Relatórios['"]/);
  assert.doesNotMatch(sideNav, /Relatórios.*Em breve/);
});

test('página RelatoriosGestor renderiza cards HSL, donut chart e tabela ociosa', async () => {
  const relatoriosPage = await read('app/frontend/src/pages/gestor/RelatoriosGestor.jsx');

  assert.match(relatoriosPage, /api\.get\(['"]\/gestor\/relatorios['"]\)/);
  assert.match(relatoriosPage, /const totalGrafico = dados\?\.distribuicao_status\?\.reduce/);
  assert.match(relatoriosPage, /dados\?\.urgencias_ociosas/);
  assert.match(relatoriosPage, /dados\?\.urgentes_paradas/);
  assert.match(relatoriosPage, /const totalSolicitacoesAtivas = dados\?\.total_abertas \?\? totalGrafico/);
  assert.match(relatoriosPage, /<svg viewBox="0 0 100 100"/);
  assert.match(relatoriosPage, /strokeDasharray=\{seg\.strokeDasharray\}/);
  assert.match(relatoriosPage, /calcularDiasInativos/);
  assert.match(relatoriosPage, /sol\.paciente_cra/);
  assert.match(relatoriosPage, /sol\.descricao_paciente \|\| sol\.descricao/);
  assert.match(relatoriosPage, /\/gestor\/paciente\/\$\{sol\.paciente_id\}/);
});
