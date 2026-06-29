/**
 * TESTES DE CONTRATO: TASK 4.8 - Painel Superadmin
 * -----------------------------------------------------------------------------
 * Estes testes protegem a especificacao do modulo de superadmin sem depender
 * de banco remoto. As assercoes validam contratos de rota, RBAC, auditoria,
 * onboarding de gestores e a integracao da nova secao no portal do gestor.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const readOptional = async (path) => {
  try {
    return await read(path);
  } catch {
    return '';
  }
};

test('1. backend expõe rotas globais de UBS e gestores protegidas por perfil admin', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');

  assert.match(source, /requirePerfil\(\[['"]admin['"]\]\)/);
  assert.match(source, /router\.get\(['"]\/ubs['"]/);
  assert.match(source, /router\.post\(['"]\/ubs['"]/);
  assert.match(source, /router\.patch\(['"]\/ubs\/:id\/ativar['"]/);
  assert.match(source, /router\.patch\(['"]\/ubs\/:id\/desativar['"]/);
  assert.match(source, /router\.get\(['"]\/gestores['"]/);
  assert.match(source, /router\.post\(['"]\/gestores['"]/);
  assert.match(source, /router\.patch\(['"]\/gestores\/:id\/ativar['"]/);
  assert.match(source, /router\.patch\(['"]\/gestores\/:id\/desativar['"]/);
  assert.match(source, /router\.post\(['"]\/gestores\/:id\/reset-senha['"]/);
});

test('2. backend gera senha aleatória, salva apenas hash bcrypt e nunca expõe senha_hash nas listagens', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  const postGestorRoute = source.match(/router\.post\(['"]\/gestores['"][\s\S]*?\n\}\);/)?.[0] || '';
  const listGestoresRoute = source.match(/router\.get\(['"]\/gestores['"][\s\S]*?\n\}\);/)?.[0] || '';
  const resetRoute = source.match(/router\.post\(['"]\/gestores\/:id\/reset-senha['"][\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(source, /randomUUID|crypto\.randomUUID/);
  assert.match(postGestorRoute, /bcrypt\.hash\(/);
  assert.match(postGestorRoute, /senha_inicial|senhaTemporaria|senha_temporaria/);
  assert.match(resetRoute, /bcrypt\.hash\(/);
  assert.match(resetRoute, /nova_senha|senhaTemporaria|senha_temporaria/);
  assert.doesNotMatch(listGestoresRoute, /senha_hash/);
});

test('3. backend registra auditoria em todas as ações administrativas e oferece proxy de logs', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');

  assert.match(source, /const\s*\{\s*registrar\s*\}\s*=\s*require\(['"]\.\.\/services\/auditService['"]\)/);
  assert.match(source, /await\s+registrar\(/);
  assert.match(source, /router\.get\(['"]\/audit\/logs['"]/);
  assert.match(source, /ubs_id/);
  assert.match(source, /resultado/);
  assert.match(source, /data_inicio/);
  assert.match(source, /data_fim/);
});

test('4. frontend registra rota protegida /gestor/admin/* e navegação exclusiva do admin', async () => {
  const app = await read('app/frontend/src/App.jsx');
  const nav = await read('app/frontend/src/components/gestor/SideNavGestor.jsx');

  assert.match(app, /path=["']\/gestor\/admin/);
  assert.match(app, /user\?\.perfil\s*!==\s*['"]admin['"]|perfilPermitido|perfilPermitidos/);
  assert.match(nav, /Administra[çc][ãa]o/);
  assert.match(nav, /\/gestor\/admin/);
});

test('5. frontend cria páginas dedicadas de superadmin para UBS, gestores e auditoria', async () => {
  const layout = await readOptional('app/frontend/src/pages/gestor/admin/SuperadminLayout.jsx');
  const ubsPage = await readOptional('app/frontend/src/pages/gestor/admin/UBSAdmin.jsx');
  const gestoresPage = await readOptional('app/frontend/src/pages/gestor/admin/GestoresAdmin.jsx');
  const auditPage = await readOptional('app/frontend/src/pages/gestor/admin/AuditAdmin.jsx');

  assert.match(layout, /COMPONENTE:\s*SuperadminLayout/);
  assert.match(layout, /UBSs/);
  assert.match(layout, /Gestores/);
  assert.match(layout, /Logs/);
  assert.match(ubsPage, /Nova UBS/);
  assert.match(ubsPage, /api\.(get|post|patch)\(['"]\/admin\/ubs/);
  assert.match(gestoresPage, /Novo Gestor/);
  assert.match(gestoresPage, /senha/i);
  assert.match(gestoresPage, /api\.(get|post)\(['"]\/admin\/gestores/);
  assert.match(auditPage, /api\.get\(['"]\/admin\/audit\/logs/);
  assert.match(auditPage, /resultado/i);
});
