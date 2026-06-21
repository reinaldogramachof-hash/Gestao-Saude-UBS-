/**
 * TESTES DE CONTRATO: TASK_27 Parte A - UPA
 * ---------------------------------------------------------------------------
 * Protege a inclusao do tipo UPA em unidades externas sem antecipar a Parte B
 * do catalogo de procedimentos. Os testes leem os arquivos de producao e
 * validam que migration, seed e UI reconhecem o novo tipo.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('migration 022 adiciona UPA ao check de unidades externas', async () => {
  const migration = await read('app/backend/src/db/migrations/022_add_upa_to_unidades_externas.js');

  assert.match(migration, /DROP CONSTRAINT IF EXISTS unidades_externas_tipo_check/);
  assert.match(migration, /'UPA'/);
  assert.match(migration, /exports\.down/);
  assert.match(migration, /'AME','CAPS','CENTRO_ESPECIALIDADES','HOSPITAL','OUTRO'/);
});

test('seed de unidades externas inclui UPAs Norte e Sul', async () => {
  const seed = await read('app/backend/src/db/seeds/004_unidades_externas.js');

  assert.match(seed, /UPA Norte SJC/);
  assert.match(seed, /upa\.norte@sjc\.sp\.gov\.br/);
  assert.match(seed, /UPA Sul SJC/);
  assert.match(seed, /upa\.sul@sjc\.sp\.gov\.br/);
  assert.match(seed, /tipo:\s*'UPA'/);
});

test('frontends com lista de tipos reconhecem UPA', async () => {
  const regulacao = await read('app/frontend/src/pages/gestor/RegulacaoGestor.jsx');
  const perfil = await read('app/frontend/src/pages/gestor/PerfilPaciente.jsx');
  const painel = await read('app/frontend/src/pages/gestor/PainelMedico.jsx');

  assert.match(regulacao, /value="UPA"/);
  assert.match(perfil, /upa:\s*'UPA'/);
  assert.match(perfil, /value="upa"/);
  assert.match(painel, /upa:\s*'UPA'/);
});
