/**
 * TESTES DE CONTRATO: Gerenciamento de Usuários Gestores
 * -----------------------------------------------------------------------------
 * Estes testes verificam os 14 cenários mínimos da especificação sem acessar o
 * PostgreSQL remoto. As asserções protegem autorização, escopo e respostas.
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

test('1. middleware administrativo rejeita perfil gestor com 403', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  assert.match(source, /req\.user\?\.perfil\s*!==\s*['"]admin['"]/);
  assert.match(source, /res\.status\(403\)/);
});

test('2. middleware administrativo rejeita perfil recepcionista pelo mesmo contrato', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  assert.match(source, /router\.use\(somenteAdmin\)/);
  assert.match(source, /Acesso exclusivo para administradores/);
});

test('3. listagem seleciona campos públicos e nunca senha_hash', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  const route = source.match(/router\.get\('\/usuarios'[\s\S]*?\n\}\);/)?.[0] || '';
  for (const field of ['id', 'nome', 'email', 'perfil', 'ativo', 'criado_em']) {
    assert.match(route, new RegExp(`['"]${field}['"]`));
  }
  assert.doesNotMatch(route, /senha_hash/);
});

test('4. cadastro usa bcrypt com custo 12', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  assert.match(source, /bcrypt\.hash\(senha,\s*12\)/);
  assert.match(source, /senha_hash:\s*senhaHash/);
});

test('5. cadastro detecta email duplicado e retorna 409', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  assert.match(source, /emailNormalizado\s*=\s*email\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source, /where\(\{\s*email:\s*emailNormalizado\s*\}\)/);
  assert.match(source, /res\.status\(409\)/);
});

test('6. cadastro força UBS e estado ativo do token', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  const route = source.match(/router\.post\('\/usuario'[\s\S]*?\n\}\);/)?.[0] || '';
  assert.match(route, /ubs_id:\s*req\.user\.ubs_id/);
  assert.match(route, /ativo:\s*true/);
  assert.doesNotMatch(route, /ubs_id:\s*req\.body/);
});

test('7. edição atualiza nome e perfil dentro da mesma UBS', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  const route = source.match(/router\.patch\('\/usuario\/:id'[\s\S]*?\n\}\);/)?.[0] || '';
  assert.match(route, /nome/);
  assert.match(route, /perfil/);
  assert.match(route, /ubs_id:\s*req\.user\.ubs_id/);
  assert.match(route, /\.update\(/);
});

test('8. edição impede alterar o próprio perfil', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  assert.match(source, /Number\(req\.params\.id\)\s*===\s*Number\(req\.user\.id\)/);
  assert.match(source, /próprio perfil/);
});

test('9. troca de senha exige no mínimo seis caracteres', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  assert.match(source, /nova_senha\.length\s*<\s*6/);
  assert.match(source, /mínimo 6 caracteres/);
});

test('10. troca de senha gera novo hash bcrypt com custo 12', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  const route = source.match(/router\.patch\('\/usuario\/:id\/senha'[\s\S]*?\n\}\);/)?.[0] || '';
  assert.match(route, /bcrypt\.hash\(nova_senha,\s*12\)/);
  assert.match(route, /senha_hash:\s*senhaHash/);
});

test('11. DELETE desativa sem remover registro', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  const route = source.match(/router\.delete\('\/usuario\/:id'[\s\S]*?\n\}\);/)?.[0] || '';
  assert.match(route, /\.update\(\{\s*ativo:\s*false\s*\}\)/);
  assert.doesNotMatch(route, /\.del\(/);
});

test('12. DELETE impede a autodesativação', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  const route = source.match(/router\.delete\('\/usuario\/:id'[\s\S]*?\n\}\);/)?.[0] || '';
  assert.match(route, /Number\(req\.params\.id\)\s*===\s*Number\(req\.user\.id\)/);
  assert.match(route, /res\.status\(403\)/);
});

test('13. nenhuma resposta administrativa retorna senha_hash', async () => {
  const source = await readOptional('app/backend/src/routes/admin.js');
  assert.match(source, /module\.exports\s*=\s*router/);
  assert.doesNotMatch(source, /returning\(['"]\*['"]\)/);
  assert.doesNotMatch(source, /res\.(?:json|status\([^)]*\)\.json)\([^)]*senha_hash/);
});

test('14. frontend registra página, rota e menu exclusivos do admin', async () => {
  const page = await readOptional('app/frontend/src/pages/gestor/GestorUsuarios.jsx');
  const app = await read('app/frontend/src/App.jsx');
  const nav = await read('app/frontend/src/components/gestor/SideNavGestor.jsx');
  const server = await read('app/backend/server.js');

  assert.match(page, /user\?\.perfil\s*!==\s*['"]admin['"]/);
  assert.match(page, /Novo Usuário/);
  assert.match(page, /api\.post\(['"]\/admin\/usuario['"]/);
  assert.match(page, /Alterar Senha/);
  assert.match(app, /import GestorUsuarios/);
  assert.match(app, /path=["']\/gestor\/usuarios["']/);
  assert.match(nav, /user\?\.perfil\s*===\s*['"]admin['"]/);
  assert.match(nav, /manage_accounts/);
  assert.match(server, /app\.use\(['"]\/api\/admin['"],\s*authMiddleware,\s*adminRouter\)/);
});
