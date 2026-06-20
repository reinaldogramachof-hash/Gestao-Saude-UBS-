/**
 * TESTES DE CONTRATO: Hardening Completo de Seguranca
 * ---------------------------------------------------------------------------
 * Estes testes verificam os contratos estruturais das tres camadas de
 * seguranca: perimetro, autorizacao/RLS e auditoria/minimizacao de dados.
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
  return read(`app/backend/src/db/migrations/${match}`);
}

test('servidor aplica hardening de perimetro HTTP', async () => {
  const server = await read('app/backend/server.js');

  assert.match(server, /const helmet\s*=\s*require\(['"]helmet['"]\)/);
  assert.match(server, /const rateLimit\s*=\s*require\(['"]express-rate-limit['"]\)/);
  assert.match(server, /app\.use\(helmet\(/);
  assert.match(server, /express\.json\(\{\s*limit:\s*['"]100kb['"]/);
  assert.match(server, /apiRateLimiter/);
  assert.doesNotMatch(server, /\^https:\\\/\\\/\.\*\\\.vercel\\\.app\$/);
});

test('middlewares reutilizaveis de autorizacao validacao e auditoria existem', async () => {
  const authz = await read('app/backend/src/middleware/authorization.js');
  const validate = await read('app/backend/src/middleware/validateBody.js');
  const audit = await read('app/backend/src/middleware/auditLog.js');

  assert.match(authz, /requireTipo/);
  assert.match(authz, /requirePerfil/);
  assert.match(validate, /schema\.validate/);
  assert.match(validate, /abortEarly:\s*false/);
  assert.match(audit, /registrarAuditoria/);
});

test('autenticacao usa token_version e registra auditoria de login', async () => {
  const auth = await read('app/backend/src/routes/auth.js');
  const middleware = await read('app/backend/src/middleware/auth.js');

  assert.match(auth, /registrarAuditoria/);
  assert.match(auth, /token_version:\s*gestor\.token_version/);
  assert.match(auth, /token_version:\s*paciente\.token_version/);
  assert.match(auth, /login_gestor_sucesso/);
  assert.match(auth, /login_paciente_falha/);
  assert.match(middleware, /token_version/);
  assert.match(middleware, /sessao_expirada/);
});

test('migration cria auditoria token_version soft delete e RLS', async () => {
  const migration = await readMigrationMatching('security_hardening');

  assert.match(migration, /security_audit_logs/);
  assert.match(migration, /token_version/);
  assert.match(migration, /excluido_em/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  for (const table of [
    'pacientes',
    'solicitacoes',
    'historico_status',
    'medicamentos',
    'comunicados',
    'agendamentos_gestao',
    'encaminhamentos',
    'notificacoes_vigilancia',
    'usuarios_gestores',
    'comunicados_leitura',
    'push_subscriptions',
  ]) {
    assert.match(migration, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`));
  }
});

test('rotas sensiveis do gestor registram auditoria e minimizam retorno', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');

  for (const action of [
    'paciente_visualizar_matriz',
    'paciente_ativar',
    'paciente_rejeitar',
    'solicitacao_status_atualizar',
    'solicitacao_escalar',
    'solicitacao_resultado_atualizar',
    'atendimento_criar',
    'atendimento_atualizar',
    'atendimento_excluir',
    'comunicado_individual_criar',
    'encaminhamento_criar',
    'encaminhamento_status_atualizar',
    'vigilancia_criar',
    'vigilancia_status_atualizar',
  ]) {
    assert.match(gestor, new RegExp(action));
  }

  assert.doesNotMatch(gestor, /select\('pacientes\.\*'/);
  assert.doesNotMatch(gestor, /returning\('\*'\)/);
});

test('rotas legadas inativas nao expõem CPF e exigem admin', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const servicoSocial = gestor.match(/router\.get\('\/servico-social'[\s\S]*?\n\}\);/)?.[0] || '';
  const transporte = gestor.match(/router\.get\('\/transporte'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(servicoSocial, /requirePerfil\(\['admin'\]\)/);
  assert.match(transporte, /requirePerfil\(\['admin'\]\)/);
  assert.doesNotMatch(servicoSocial, /pacientes\.cpf/);
});

test('atendimentos usam soft delete e listagens ignoram excluidos', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');

  assert.match(gestor, /excluido_em:\s*knex\.fn\.now\(\)/);
  assert.match(gestor, /motivo_exclusao/);
  assert.match(gestor, /whereNull\('atendimentos\.excluido_em'\)/);
  assert.doesNotMatch(gestor, /knex\('atendimentos'\)\.where\(\{ id: req\.params\.id \}\)\.delete\(\)/);
});

test('rotas operacionais locais validam UBS do recurso e paciente', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');

  assert.match(gestor, /validarPacienteDaUbs/);
  assert.match(gestor, /comunicado_individual_criar/);
  assert.match(gestor, /encaminhamento_criar/);
  assert.match(gestor, /vigilancia_criar/);
  assert.match(gestor, /encaminhamentos'\)[\s\S]*where\(\{ id: req\.params\.id, ubs_id: req\.user\.ubs_id \}/);
});
