// ─────────────────────────────────────────────────────────────────────────────
// TESTES DE CONTRATO — AUDITORIA E ACK DE NOTIFICAÇÕES (12 MESES)
// FUNÇÃO: Valida a segurança, integridade de rotas, isolamento por UBS,
//         geração de ack_token (nonce de 64 caracteres) e envio do ACK sem JWT.
// ─────────────────────────────────────────────────────────────────────────────
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('1. Migration 032 e 033 criam a tabela notificacoes_paciente_log com ack_token opaco (nonce)', async () => {
  const source032 = await read('app/backend/src/db/migrations/032_create_notificacoes_paciente_log.js');
  const source033 = await read('app/backend/src/db/migrations/033_add_ack_token_to_notificacoes_paciente_log.js');

  assert.match(source032, /createTable\('notificacoes_paciente_log'/);
  assert.match(source032, /paciente_id/);
  assert.match(source032, /ubs_id/);
  assert.match(source032, /disparado_em/);
  assert.match(source032, /entregue_em/);
  assert.match(source032, /lido_em/);

  assert.match(source033, /ack_token/);
  assert.match(source033, /string\('ack_token',\s*64\)/);
});

test('2. pushService.js gera ack_token seguro, NÃO possui fallback inseguro ubsId || 1 e grava auditoria', async () => {
  const source = await read('app/backend/src/services/pushService.js');

  assert.match(source, /const crypto\s*=\s*require\('crypto'\);/);
  assert.match(source, /crypto\.randomBytes\(32\)\.toString\('hex'\)/);
  assert.match(source, /notificacoes_paciente_log/);
  assert.match(source, /ack_token:\s*ackToken/);
  assert.match(source, /api_base_url:\s*apiBaseUrl/);
  assert.match(source, /status_envio:\s*['"]DISPARADO['"]/);

  // Garante que não há atribuição arbitrária de UBS padrão (ubsId || 1 ou ubs_id || 1)
  assert.doesNotMatch(source, /ubsId\s*\|\|\s*1/);
  assert.doesNotMatch(source, /ubs_id\s*\|\|\s*1/);
  assert.doesNotMatch(source, /log_id:\s*logId/);
});

test('3. Rota pública /api/public/notificacoes/ack valida ack_token (64 chars) e não exige JWT', async () => {
  const serverSource = await read('app/backend/server.js');
  const publicoSource = await read('app/backend/src/routes/publico.js');
  const pacienteSource = await read('app/backend/src/routes/paciente.js');

  // Confirma que /api/public é montada SEM o authMiddleware
  assert.match(serverSource, /app\.use\(['"]\/api\/public['"],\s*rotasPublicas\);/);
  assert.doesNotMatch(serverSource, /app\.use\(['"]\/api\/public['"],\s*authMiddleware/);
  assert.doesNotMatch(pacienteSource, /router\.post\('\/notificacoes\/ack'/);
  assert.doesNotMatch(pacienteSource, /log_id/);

  // Confirma validação estrita do nonce de 64 caracteres
  assert.match(publicoSource, /router\.post\('\/notificacoes\/ack'/);
  assert.match(publicoSource, /ack_token/);
  assert.match(publicoSource, /ack_token\.trim\(\)\.length\s*!==\s*64/);
  assert.match(publicoSource, /status_envio:\s*['"]ENTREGUE['"]/);
});

test('4. gestor.js restringe a auditoria de notificações à UBS do gestor (req.user.ubs_id)', async () => {
  const source = await read('app/backend/src/routes/gestor.js');

  const gestorRoute = source.match(/router\.get\('\/pacientes\/:id\/notificacoes-log'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(gestorRoute, /gestorUbsId\s*=\s*req\.user\.ubs_id/);
  assert.match(gestorRoute, /ubs_id:\s*gestorUbsId/);
  assert.match(gestorRoute, /dataLimite\.setMonth\(dataLimite\.getMonth\(\)\s*-\s*12\)/);
});

test('5. Service Worker (sw.js) dispara ACK público enviando ack_token sem depender de JWT', async () => {
  const source = await read('app/frontend/public/sw.js');

  assert.match(source, /if\s*\(dados\.ack_token\)/);
  assert.match(source, /dados\.api_base_url/);
  assert.match(source, /\/api\/public\/notificacoes\/ack/);
  assert.match(source, /ack_token:\s*dados\.ack_token/);
});

test('6. Documentação e comentários refletem com clareza o filtro de retenção de 12 meses e timestamps ISO', async () => {
  const migrationSource = await read('app/backend/src/db/migrations/032_create_notificacoes_paciente_log.js');
  const pacienteRouteSource = await read('app/backend/src/routes/paciente.js');

  assert.match(migrationSource, /ISO 8601/);
  assert.match(migrationSource, /RETENÇÃO: Consultas padrão filtram a janela operacional dos últimos 12 meses/);
  assert.match(pacienteRouteSource, /dataLimite\.setMonth\(dataLimite\.getMonth\(\)\s*-\s*12\)/);
});
