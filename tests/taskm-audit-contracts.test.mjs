/**
 * TESTES DE CONTRATO: Modulo Master de Logs (Auditoria Central)
 * ---------------------------------------------------------------------------
 * Estes testes validam a arquitetura minima da auditoria central sem depender
 * de banco remoto. Eles garantem que a expansao do schema, o servico central,
 * o middleware automatico e a rota administrativa existam e permaneçam ligados.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

async function readMigrationMatching(fragment) {
  const dir = new URL('../app/backend/src/db/migrations/', import.meta.url);
  const files = await readdir(dir);
  const match = files.find((file) => file.includes(fragment));
  assert.ok(match, `Migration containing "${fragment}" was not found`);
  return {
    file: match,
    content: await read(`app/backend/src/db/migrations/${match}`),
  };
}

test('migration expande security_audit_logs sem recriar a tabela', async () => {
  const { file, content } = await readMigrationMatching('expand_security_audit_logs');

  assert.match(file, /expand_security_audit_logs/i);
  assert.match(content, /hasTable\('security_audit_logs'\)/);
  assert.match(content, /alterTable\('security_audit_logs'/);
  assert.match(content, /usuario_id/);
  assert.match(content, /usuario_tipo/);
  assert.match(content, /ubs_id/);
  assert.match(content, /resultado/);
  assert.match(content, /detalhe/);
  assert.match(content, /ip_origem/);
  assert.match(content, /http_status/);
  assert.doesNotMatch(content, /createTable\('security_audit_logs'/);
});

test('audit service expõe registrar moderno e compatibilidade com registrarAuditoria', async () => {
  const service = await read('app/backend/src/services/auditService.js');

  assert.match(service, /function sanitizar/i);
  assert.match(service, /function registrar\(/);
  assert.match(service, /function registrarAuditoria\(/);
  assert.match(service, /NODE_ENV === 'development'/);
  assert.match(service, /\[AUDIT\]/);
  assert.match(service, /security_audit_logs/);
  assert.match(service, /module\.exports\s*=\s*\{\s*registrar,\s*registrarAuditoria\s*\}/);
});

test('middleware automático intercepta res.json e usa status real da resposta', async () => {
  const middleware = await read('app/backend/src/middleware/auditMiddleware.js');

  assert.match(middleware, /const jsonOriginal = res\.json\.bind\(res\)/);
  assert.match(middleware, /res\.json = function auditJsonInterceptor/);
  assert.match(middleware, /res\.statusCode/);
  assert.match(middleware, /req\.user/);
  assert.match(middleware, /x-forwarded-for/);
  assert.match(middleware, /registrar\(/);
});

test('server monta rota protegida de auditoria administrativa', async () => {
  const server = await read('app/backend/server.js');

  assert.match(server, /const auditRouter\s*=\s*require\('\.\/src\/routes\/audit'\)/);
  assert.match(server, /app\.use\('\/api\/audit',\s*authMiddleware,\s*auditRouter\)/);
});

test('rotas críticas usam o middleware automático por grupo', async () => {
  const auth = await read('app/backend/src/routes/auth.js');
  const gestor = await read('app/backend/src/routes/gestor.js');
  const paciente = await read('app/backend/src/routes/paciente.js');
  const externa = await read('app/backend/src/routes/externa.js');
  const admin = await read('app/backend/src/routes/admin.js');

  for (const file of [auth, gestor, paciente, externa, admin]) {
    assert.match(file, /auditMiddleware/);
    assert.match(file, /router\.use\(/);
  }
});

test('rota de consulta de auditoria filtra logs e restringe por perfil', async () => {
  const route = await read('app/backend/src/routes/audit.js');

  assert.match(route, /router\.get\('\/logs'/);
  assert.match(route, /router\.get\('\/logs\/paciente\/:pacienteId'/);
  assert.match(route, /limit\s*=\s*50/);
  assert.match(route, /offset/);
  assert.match(route, /orderBy\(['"]created_at['"],\s*['"]desc['"]\)/i);
  assert.match(route, /requirePerfil\(\['admin'\]\)/);
  assert.match(route, /requirePerfil\(\['admin',\s*'gestor'\]\)|requerPerfilAdminOuGestor/);
});
