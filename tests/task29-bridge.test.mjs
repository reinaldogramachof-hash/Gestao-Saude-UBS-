/**
 * TESTES DE CONTRATO: TASK_29 - Bridge solicitacao -> encaminhamento
 * ---------------------------------------------------------------------------
 * Protege o bug estrutural em que solicitacoes com unidade_externa_id ficavam
 * invisiveis para o portal externo por nao criarem registro em encaminhamentos.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

function extractSolicitacaoRoute(source) {
  return source.match(/router\.post\('\/paciente\/:id\/solicitacao'[\s\S]*?\n\}\);/)?.[0] || '';
}

test('migration 025 adiciona campos externos em encaminhamentos com hasColumn antes do alterTable', async () => {
  const migration = await read('app/backend/src/db/migrations/025_add_unidade_externa_feedback_to_encaminhamentos.js');

  for (const coluna of [
    'unidade_externa_id',
    'data_procedimento_unidade',
    'confirmado_paciente',
    'feedback_tipo',
    'feedback_conduta',
    'feedback_data_retorno',
  ]) {
    assert.match(migration, new RegExp(`hasColumn\\('encaminhamentos',\\s*'${coluna}'\\)`));
  }

  assert.match(migration, /Promise\.all/);
  assert.match(migration, /alterTable\('encaminhamentos'/);
  assert.doesNotMatch(migration, /await knex\.schema\.hasColumn[\s\S]*alterTable\('encaminhamentos'/);
});

test('POST solicitacao com unidade_externa_id cria encaminhamento na mesma transacao', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const route = extractSolicitacaoRoute(gestor);

  assert.match(route, /knex\.transaction\(async \(trx\) =>/);
  assert.match(route, /if \(unidade_externa_id\)/);
  assert.match(route, /await trx\(['"]encaminhamentos['"]\)\.insert\(\{/);
  assert.match(route, /paciente_id:\s*paciente\.id/);
  assert.match(route, /ubs_id:\s*paciente\.ubs_id/);
  assert.match(route, /gestor_id:\s*req\.user\.id/);
  assert.match(route, /unidade_externa_id:\s*unidade_externa_id/);
  assert.match(route, /solicitacao_id:\s*novaSolicitacao\.id/);
  assert.match(route, /prioridadeEncaminhamento/);
  assert.match(route, /status:\s*['"]AGUARDANDO_VAGA['"]/);
});

test('POST solicitacao sem unidade_externa_id nao cria encaminhamento automatico', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const route = extractSolicitacaoRoute(gestor);

  assert.match(route, /if \(unidade_externa_id\) \{[\s\S]*trx\(['"]encaminhamentos['"]\)/);
  assert.doesNotMatch(route, /else\s*\{[\s\S]*trx\(['"]encaminhamentos['"]\)/);
});

test('POST solicitacao dispara push para paciente e para unidade externa fora da transacao', async () => {
  const gestor = await read('app/backend/src/routes/gestor.js');
  const route = extractSolicitacaoRoute(gestor);
  const afterTransaction = route.split('await registrarAuditoria')[0].split('const solicitacao = await knex.transaction').at(-1);

  assert.match(route, /pushService\.enviar\(\s*paciente\.id,\s*['"]paciente['"],\s*\{/);
  assert.match(route, /Nova solicitacao registrada/);
  assert.match(route, /pushService\.enviar\(\s*unidade_externa_id,\s*['"]externa['"],\s*\{/);
  assert.match(route, /Novo encaminhamento recebido/);
  assert.match(afterTransaction, /pushService\.enviar/);
});

test('portal externo lista catalogo_nome e solicitacao_id com ownership por unidade externa', async () => {
  const externa = await read('app/backend/src/routes/externa.js');
  const route = externa.match(/router\.get\('\/encaminhamentos'[\s\S]*?\n\}\);/)?.[0] || '';
  const campos = externa.match(/const CAMPOS_ENCAMINHAMENTO_EXTERNA = \[[\s\S]*?\];/)?.[0] || '';

  assert.match(campos, /catalogo_procedimentos\.nome as catalogo_nome/);
  assert.match(campos, /encaminhamentos\.solicitacao_id/);
  assert.match(route, /leftJoin\(['"]solicitacoes['"],\s*['"]encaminhamentos\.solicitacao_id['"],\s*['"]solicitacoes\.id['"]\)/);
  assert.match(route, /leftJoin\(['"]catalogo_procedimentos['"],\s*['"]solicitacoes\.catalogo_id['"],\s*['"]catalogo_procedimentos\.id['"]\)/);
  assert.match(route, /where\(['"]encaminhamentos\.unidade_externa_id['"],\s*req\.user\.id\)/);
});

test('pushService permite tipo externa via tipo_usuario sem enum restritivo', async () => {
  const push = await read('app/backend/src/services/pushService.js');
  const migration = await read('app/backend/src/db/migrations/010_create_push_subscriptions.js');

  assert.match(push, /where\(\{\s*usuario_id:\s*usuarioId,\s*tipo_usuario:\s*tipoUsuario\s*\}\)/);
  assert.match(migration, /table\.string\(['"]tipo_usuario['"],\s*10\)\.notNullable\(\)/);
  assert.doesNotMatch(push, /tipoUsuario\s*!==\s*['"]paciente['"]/);
});
