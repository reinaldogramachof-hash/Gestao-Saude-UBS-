/**
 * TESTES DE CONTRATO: TASK 4.10 - Consentimento LGPD no Portal do Paciente
 * -----------------------------------------------------------------------------
 * Estes testes verificam a estrutura mínima do fluxo LGPD sem depender de banco
 * remoto. Eles protegem migration, backend, modal do frontend e o bloqueio da
 * navegação até que o consentimento seja aceito e persistido.
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

test('1. migration 030 adiciona colunas de aceite LGPD em pacientes', async () => {
  const source = await readOptional('app/backend/src/db/migrations/030_lgpd_consentimento.js');

  assert.match(source, /hasColumn\(['"]pacientes['"],\s*['"]lgpd_aceite_em['"]\)/);
  assert.match(source, /hasColumn\(['"]pacientes['"],\s*['"]lgpd_versao['"]\)/);
  assert.match(source, /table\.timestamp\(['"]lgpd_aceite_em['"]\)/);
  assert.match(source, /table\.string\(['"]lgpd_versao['"],\s*10\)/);
});

test('2. backend centraliza a versão atual da política em util próprio', async () => {
  const source = await readOptional('app/backend/src/utils/lgpd.js');

  assert.match(source, /const VERSAO_ATUAL = ['"]1\.0['"]/);
  assert.match(source, /module\.exports = \{ VERSAO_ATUAL \}/);
  assert.match(source, /LGPD: Controle de versão do termo de consentimento/);
});

test('3. login do paciente retorna lgpd_pendente com base em aceite e versão', async () => {
  const source = await read('app/backend/src/routes/auth.js');
  const route = source.match(/router\.post\('\/login-paciente'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(source, /require\(['"]\.\.\/utils\/lgpd['"]\)/);
  assert.match(route, /lgpd_aceite_em/);
  assert.match(route, /lgpd_versao/);
  assert.match(route, /lgpd_pendente/);
  assert.match(route, /VERSAO_ATUAL/);
});

test('4. rota do paciente registra aceite LGPD autenticado com auditoria', async () => {
  const source = await read('app/backend/src/routes/paciente.js');
  const route = source.match(/router\.post\('\/lgpd\/aceite'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(source, /require\(['"]\.\.\/utils\/lgpd['"]\)/);
  assert.match(route, /lgpd_aceite_em/);
  assert.match(route, /lgpd_versao/);
  assert.match(route, /VERSAO_ATUAL/);
  assert.match(route, /LGPD_ACEITE/);
  assert.match(route, /aceito:\s*true/);
});

test('5. modal LGPD bloqueante existe e chama a API de aceite', async () => {
  const source = await readOptional('app/frontend/src/components/paciente/LgpdModal.jsx');

  assert.match(source, /COMPONENTE:\s*LgpdModal/);
  assert.match(source, /Termo de Uso e Privacidade/);
  assert.match(source, /Li e concordo com os termos de uso e política de privacidade/);
  assert.match(source, /Ler política completa/);
  assert.match(source, /\/privacidade/);
  assert.match(source, /api\.post\(['"]\/paciente\/lgpd\/aceite['"]\)/);
  assert.match(source, /onAceite/);
  assert.match(source, /disabled=\{[^}]*checkboxMarcado|disabled=\{[^}]*aceiteMarcado/);
});

test('6. login do paciente abre o modal antes do dashboard quando lgpd_pendente for true', async () => {
  const source = await read('app/frontend/src/pages/paciente/LoginPaciente.jsx');

  assert.match(source, /lgpd_pendente/);
  assert.match(source, /LgpdModal/);
  assert.match(source, /navigate\('\/paciente\/dashboard'\)/);
  assert.match(source, /if\s*\(res\.data\.lgpd_pendente\)/);
});

test('7. sessao do paciente pode ser atualizada após o aceite e a navegação protegida respeita LGPD pendente', async () => {
  const auth = await read('app/frontend/src/contexts/AuthContext.jsx');
  const app = await read('app/frontend/src/App.jsx');

  assert.match(auth, /updateUser|atualizarUsuario|atualizarSessao/);
  assert.match(auth, /localStorage\.setItem\(userKey,\s*JSON\.stringify/);
  assert.match(app, /lgpd_pendente/);
  assert.match(app, /Navigate to="\/login-paciente"|Navigate to="\/paciente\/dashboard"/);
});
