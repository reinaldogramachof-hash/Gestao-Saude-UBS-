/**
 * TESTES DE CONTRATO: TASK 4.11 - Direito ao Esquecimento (LGPD Art. 18)
 * -----------------------------------------------------------------------------
 * Estes testes protegem a estrutura minima da exclusao LGPD sem depender de um
 * banco remoto. O foco e garantir rota admin transacional, anonimização dos
 * audit logs e confirmacao dupla no frontend.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('1. admin.js expõe rota LGPD de exclusão com transação, auditoria e anonimização', async () => {
  const source = await read('app/backend/src/routes/admin.js');
  const route = source.match(/router\.delete\('\/pacientes\/:id\/dados'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(route, /LGPD_EXCLUSAO_INICIADA/);
  assert.match(route, /LGPD_EXCLUSAO_CONCLUIDA/);
  assert.match(route, /LGPD_EXCLUSAO_FALHA/);
  assert.match(route, /knex\.transaction/);
  assert.match(source, /push_subscriptions/);
  assert.match(source, /agendamentos_gestao/);
  assert.match(source, /comunicados/);
  assert.match(source, /historico_status/);
  assert.match(source, /solicitacoes/);
  assert.match(source, /security_audit_logs/);
  assert.match(source, /\[DADOS REMOVIDOS - LGPD\]/);
  assert.match(route, /excluido:\s*true/);
});

test('2. admin.js exige paciente existente antes da exclusão e retorna 404 quando ausente', async () => {
  const source = await read('app/backend/src/routes/admin.js');
  const route = source.match(/router\.delete\('\/pacientes\/:id\/dados'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(route, /knex\('pacientes'\)/);
  assert.match(route, /status\(404\)/);
  assert.match(route, /NAO_ENCONTRADO|nao_encontrado|paciente_nao_encontrado/i);
});

test('3. frontend adiciona ação LGPD apenas para admin em GestorPacientes', async () => {
  const source = await read('app/frontend/src/pages/gestor/GestorPacientes.jsx');

  assert.match(source, /Excluir dados \(LGPD\)/);
  assert.match(source, /perfil\s*===\s*['"]admin['"]|user\?\.perfil\s*===\s*['"]admin['"]/);
  assert.match(source, /DELETE\s*\/admin\/pacientes\/:id\/dados|api\.delete\(`\/admin\/pacientes\/\$\{.*?\}\/dados`\)/);
});

test('4. confirmação dupla exige texto exato CONFIRMAR EXCLUSÃO antes do botão final', async () => {
  const source = await read('app/frontend/src/pages/gestor/GestorPacientes.jsx');

  assert.match(source, /CONFIRMAR EXCLUSÃO/);
  assert.match(source, /Excluir permanentemente/);
  assert.match(source, /disabled=\{[^}]*confirmacaoTexto|disabled=\{[^}]*textoConfirmacao|disabled=\{[^}]*confirmacaoCorreta/);
  assert.match(source, /Esta ação é irreversível e não pode ser desfeita\./);
  assert.match(source, /Os registros de auditoria serão anonimizados conforme exigência legal\./);
});
