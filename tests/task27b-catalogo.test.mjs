/**
 * TESTES DE CONTRATO: TASK_27B - Catalogo de Procedimentos
 * ---------------------------------------------------------------------------
 * Valida o contrato backend do catalogo sem depender de banco remoto. Os testes
 * protegem migrations, seeds, rotas Express e schema Joi usados pelo frontend.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('migrations 023 e 024 criam catalogo e vinculam solicitacoes com guards', async () => {
  const migration023 = await read('app/backend/src/db/migrations/023_create_catalogo_procedimentos.js');
  const migration024 = await read('app/backend/src/db/migrations/024_add_catalogo_unidade_to_solicitacoes.js');

  assert.match(migration023, /createTable\(['"]catalogo_procedimentos['"]/);
  assert.match(migration023, /table\.string\(['"]nome['"],\s*200\)\.notNullable\(\)/);
  assert.match(migration023, /table\.string\(['"]especialidade['"],\s*100\)\.nullable\(\)/);
  assert.match(migration023, /table\.string\(['"]tipo_unidade['"],\s*50\)\.nullable\(\)/);
  assert.match(migration023, /idx_catalogo_nome_fts/);
  assert.match(migration023, /to_tsvector\('portuguese', nome\)/);

  assert.match(migration024, /hasColumn\(['"]solicitacoes['"],\s*['"]catalogo_id['"]\)/);
  assert.match(migration024, /hasColumn\(['"]solicitacoes['"],\s*['"]unidade_externa_id['"]\)/);
  assert.match(migration024, /references\(['"]id['"]\)\.inTable\(['"]catalogo_procedimentos['"]\)[\s\S]*?\.onDelete\(['"]SET NULL['"]\)/);
  assert.match(migration024, /references\(['"]id['"]\)\.inTable\(['"]unidades_externas['"]\)[\s\S]*?\.onDelete\(['"]SET NULL['"]\)/);
});

test('seed 005 cadastra ao menos 30 procedimentos cobrindo todos os tipos', async () => {
  const seed = await read('app/backend/src/db/seeds/005_catalogo_procedimentos.js');
  const nomes = [...seed.matchAll(/nome:\s*['"]/g)];

  assert.ok(nomes.length >= 30, `esperado ao menos 30 procedimentos, encontrou ${nomes.length}`);
  for (const tipo of ['UBS', 'AME', 'CAPS', 'HOSPITAL', 'UPA', 'CENTRO_ESPECIALIDADES']) {
    assert.match(seed, new RegExp(`tipo_unidade:\\s*['"]${tipo}['"]`));
  }
  assert.match(seed, /tipo_unidade:\s*null/);
  assert.match(seed, /onConflict\(['"]nome['"]\)/);
});

test('GET /catalogo-procedimentos retorna campos publicos, busca por q e filtra tipo com null', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const route = gestor.match(/router\.get\('\/catalogo-procedimentos'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(route, /knex\(['"]catalogo_procedimentos['"]\)[\s\S]*?\.where\(\{\s*ativo:\s*true\s*\}\)/);
  assert.match(route, /\.select\(['"]id['"],\s*['"]nome['"],\s*['"]especialidade['"],\s*['"]tipo_unidade['"]\)/);
  assert.match(route, /whereILike\(['"]nome['"],\s*`%\$\{q\.trim\(\)\}%`\)/);
  assert.match(route, /where\(['"]tipo_unidade['"],\s*tipo_unidade\)/);
  assert.match(route, /orWhereNull\(['"]tipo_unidade['"]\)/);
  assert.match(route, /orderBy\(['"]nome['"]\)/);
});

test('GET /unidades-externas retorna apenas unidades ativas com id nome tipo', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const route = gestor.match(/router\.get\('\/unidades-externas'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(route, /knex\(['"]unidades_externas['"]\)/);
  assert.match(route, /\.where\(\{\s*ativo:\s*true\s*\}\)/);
  assert.match(route, /\.select\(['"]id['"],\s*['"]nome['"],\s*['"]tipo['"]\)/);
  assert.match(route, /\.orderBy\(['"]nome['"]\)/);
});

test('POST /paciente/:id/solicitacao aceita catalogo_id e unidade_externa_id opcionais', async () => {
  const { solicitacaoSchema } = require('../app/backend/src/validators/securitySchemas.js');
  const gestor = await read('app/backend/src/routes/gestor.js');

  assert.ok(solicitacaoSchema, 'solicitacaoSchema deve ser exportado');
  const validacao = solicitacaoSchema.validate({
    tipo: 'exame',
    descricao_interna: 'Hemograma Completo',
    descricao_paciente: 'Exame de sangue',
    catalogo_id: 1,
    unidade_externa_id: 2,
  });
  assert.equal(validacao.error, undefined);

  const route = gestor.match(/router\.post\('\/paciente\/:id\/solicitacao'[\s\S]*?\n\}\);/)?.[0] || '';
  assert.match(route, /validateBody\(solicitacaoSchema\)/);
  assert.match(route, /catalogo_id/);
  assert.match(route, /unidade_externa_id/);
  assert.match(route, /knex\(['"]catalogo_procedimentos['"]\)/);
  assert.match(route, /knex\(['"]unidades_externas['"]\)/);
  assert.match(route, /catalogo_id:\s*catalogo_id \|\| null/);
  assert.match(route, /unidade_externa_id:\s*unidade_externa_id \|\| null/);
});

test('rotas do gestor continuam protegidas por token antes de catalogo e solicitacao', async () => {
  const server = await read('app/backend/server.js');
  const gestor = await read('app/backend/src/routes/gestor.js');

  assert.match(server, /app\.use\('\/api\/gestor',\s*authMiddleware,\s*rotasGestor\)/);
  assert.match(gestor, /router\.use\(soGestor\)/);
});
