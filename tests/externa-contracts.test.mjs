/**
 * TESTES DE CONTRATO: Portal de Unidades Externas
 * ---------------------------------------------------------------------------
 * Estes contratos validam a camada backend da TASK_26 sem depender de banco
 * remoto. Eles protegem autenticação, escopo por unidade externa e LGPD.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('migration cria unidades externas e amplia encaminhamentos', async () => {
  const migration = await read('app/backend/src/db/migrations/021_create_unidades_externas.js');

  assert.match(migration, /createTable\('unidades_externas'/);
  assert.match(migration, /table\.string\('email',\s*150\)\.unique\(\)\.notNullable\(\)/);
  assert.match(migration, /token_version/);
  assert.match(migration, /hasColumn\('encaminhamentos',\s*coluna\)/);
  assert.match(migration, /'unidade_externa_id'/);
  assert.match(migration, /data_procedimento_unidade/);
  assert.match(migration, /confirmado_paciente/);
  assert.match(migration, /feedback_tipo/);
});

test('seed cadastra quatro unidades externas com bcrypt', async () => {
  const seed = await read('app/backend/src/db/seeds/004_unidades_externas.js');

  for (const email of [
    'ame@sjc.sp.gov.br',
    'caps@sjc.sp.gov.br',
    'especialidades@sjc.sp.gov.br',
    'hospital@sjc.sp.gov.br',
  ]) {
    assert.match(seed, new RegExp(email));
  }
  assert.match(seed, /bcrypt\.hash\('externa123'/);
  assert.match(seed, /\.onConflict\('email'\)[\s\S]*\.merge\(/);
});

test('auth aceita login de unidade externa e auditoria sucesso/falha', async () => {
  const auth = await read('app/backend/src/routes/auth.js');
  const middleware = await read('app/backend/src/middleware/auth.js');

  assert.match(auth, /router\.post\('\/login-externa'/);
  assert.match(auth, /loginRateLimiter/);
  assert.match(auth, /loginExternaSchema/);
  assert.match(auth, /unidades_externas/);
  assert.match(auth, /login_externa_falha/);
  assert.match(auth, /login_externa_sucesso/);
  assert.match(auth, /tipo:\s*'externa'/);
  assert.match(middleware, /unidades_externas/);
  assert.match(middleware, /const soExterna/);
  assert.match(middleware, /module\.exports\.soExterna/);
});

test('server registra rotas externas protegidas por JWT', async () => {
  const server = await read('app/backend/server.js');

  assert.match(server, /const rotasExterna\s*=\s*require\('\.\/src\/routes\/externa'\)/);
  assert.match(server, /app\.use\('\/api\/externa',\s*authMiddleware,\s*rotasExterna\)/);
});

test('rotas externas exigem ownership e registram auditoria', async () => {
  const externa = await read('app/backend/src/routes/externa.js');

  assert.match(externa, /router\.use\(soExterna\)/);
  assert.match(externa, /router\.get\('\/dashboard'/);
  assert.match(externa, /router\.get\('\/encaminhamentos'/);
  assert.match(externa, /unidade_externa_id:\s*req\.user\.id/);
  assert.match(externa, /encaminhamento_recebido/);
  assert.match(externa, /encaminhamento_agendado_unidade/);
  assert.match(externa, /encaminhamento_retorno_enviado/);
  assert.match(externa, /RETORNO_UBS/);
  assert.doesNotMatch(externa, /pacientes\.cpf|['"]cpf['"]/);
});

test('paciente confirma somente encaminhamento proprio', async () => {
  const paciente = await read('app/backend/src/routes/paciente.js');

  assert.match(paciente, /router\.put\('\/encaminhamento\/:id\/confirmar'/);
  assert.match(paciente, /paciente_id:\s*req\.user\.id/);
  assert.match(paciente, /AGUARDANDO_CONFIRMACAO/);
  assert.match(paciente, /CONFIRMADO_PACIENTE/);
  assert.match(paciente, /paciente_confirmou_presenca/);
});
