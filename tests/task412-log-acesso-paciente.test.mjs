/**
 * TESTES DE CONTRATO: TASK 4.12 - Log de acesso por paciente
 * -----------------------------------------------------------------------------
 * Estes testes verificam a estrutura minima do log de leitura sem depender de
 * banco remoto. O foco e garantir log fire-and-forget no backend e painel
 * administrativo para consulta dos acessos por paciente.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('1. gestor.js registra VISUALIZACAO_PACIENTE sem bloquear a resposta do prontuario', async () => {
  const source = await read('app/backend/src/routes/gestor.js');
  const route = source.match(/router\.get\('\/paciente\/:id'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(source, /const \{ registrar,\s*registrarAuditoria \}/);
  assert.match(route, /VISUALIZACAO_PACIENTE/);
  assert.match(route, /usuarioTipo:\s*['"]gestor['"]/);
  assert.match(route, /entidade:\s*['"]paciente['"]/);
  assert.match(route, /resultado:\s*['"]sucesso['"]/);
  assert.match(route, /registrar\(\{[\s\S]*?\}\)\.catch\(\(\) => \{\}\)/);
  assert.match(route, /return res\.json\(\{ \.\.\.paciente, solicitacoes \}\)/);
});

test('2. audit.js expande a rota por paciente com joins e filtro focado em VISUALIZACAO_PACIENTE', async () => {
  const source = await read('app/backend/src/routes/audit.js');
  const route = source.match(/router\.get\('\/logs\/paciente\/:pacienteId'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(route, /security_audit_logs as logs/);
  assert.match(route, /usuarios_gestores as gestor/);
  assert.match(route, /ubs\.id', 'logs\.ubs_id|ubs', 'ubs\.id', 'logs\.ubs_id/);
  assert.match(route, /usuario_nome/);
  assert.match(route, /usuario_perfil/);
  assert.match(route, /ubs_nome/);
  assert.match(route, /VISUALIZACAO_PACIENTE/);
  assert.match(route, /data_inicio/);
  assert.match(route, /data_fim/);
});

test('3. App.jsx registra a rota protegida de acessos por paciente no superadmin', async () => {
  const source = await read('app/frontend/src/App.jsx');

  assert.match(source, /import AcessosPaciente from ['"].\/pages\/gestor\/admin\/AcessosPaciente['"]/);
  assert.match(source, /path="acessos"\s+element=\{<AcessosPaciente \/>}/);
  assert.match(source, /perfilPermitidos=\{\['admin'\]\}/);
});

test('4. SuperadminLayout inclui link para Acessos por Paciente', async () => {
  const source = await read('app/frontend/src/pages/gestor/admin/SuperadminLayout.jsx');

  assert.match(source, /gestores', label: 'Gestores'/);
  assert.match(source, /acessos', label: 'Acessos'/);
  assert.match(source, /icon: 'visibility'/);
});

test('5. pagina AcessosPaciente oferece busca, filtro de periodo e exportacao CSV', async () => {
  const source = await read('app/frontend/src/pages/gestor/admin/AcessosPaciente.jsx');

  assert.match(source, /PÁGINA:\s*AcessosPaciente|PÃ.GINA:\s*AcessosPaciente/);
  assert.match(source, /Buscar paciente por nome ou CRA/);
  assert.match(source, /api\.get\('\/gestor\/pacientes'/);
  assert.match(source, /api\.get\(`\/audit\/logs\/paciente\/\$\{paciente\.id\}`/);
  assert.match(source, /Data início|Data in.cio/);
  assert.match(source, /Data fim/);
  assert.match(source, /Exportar CSV/);
  assert.match(source, /window\.open\(url,\s*'_blank'/);
});
