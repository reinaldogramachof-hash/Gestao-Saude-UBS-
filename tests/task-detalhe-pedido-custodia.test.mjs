// ─────────────────────────────────────────────────────────────────────────────
// TESTES DE CONTRATO — DETALHES DO PEDIDO, CUSTÓDIA E TIMELINE DECRESCENTE
// FUNÇÃO: Valida os contratos das alterações de backend (paciente.js) e
//         frontend (DetalheSolicitacao.jsx) para exibição de custódia e timeline.
// ─────────────────────────────────────────────────────────────────────────────
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('1. paciente.js ordena historico_status por alterado_em desc e inclui custodia_atual', async () => {
  const source = await read('app/backend/src/routes/paciente.js');

  const routeMatch = source.match(/router\.get\('\/solicitacao\/:id'[\s\S]*?\n\}\);/)?.[0] || '';

  // Ordenação decrescente do histórico (mais recente no topo)
  assert.match(routeMatch, /orderBy\(['"]alterado_em['"],\s*['"]desc['"]\)/);

  // Inclusão de custodia_atual com os tipos UBS, UNIDADE_EXTERNA e CONCLUIDO
  assert.match(routeMatch, /custodia_atual/);
  assert.match(routeMatch, /tipo:\s*['"]CONCLUIDO['"]/);
  assert.match(routeMatch, /tipo:\s*['"]UNIDADE_EXTERNA['"]/);
  assert.match(routeMatch, /tipo:\s*['"]UBS['"]/);

  // Minimização de campos internos mantida
  assert.match(routeMatch, /select\(CAMPOS_SOLICITACAO_PACIENTE\)/);

  // Enriquecimento de origem_evento em cada item do histórico
  assert.match(routeMatch, /origem_evento/);
});

test('2. DetalheSolicitacao.jsx renderiza Card de Custódia Atual e Timeline Decrescente com destaque Atual', async () => {
  const source = await read('app/frontend/src/pages/paciente/DetalheSolicitacao.jsx');

  // Card de Custódia Atual
  assert.match(source, /custodia_atual/);
  assert.match(source, /sol\.custodia_atual\.titulo/);
  assert.match(source, /sol\.custodia_atual\.descricao/);

  // Destaque de item 'Atual' na timeline
  assert.match(source, /isAtual\s*=\s*idx\s*===\s*0/);
  assert.match(source, />\s*Atual\s*</);

  // Badges de origem (UBS vs Unidade Externa)
  assert.match(source, /origemLabel/);
  assert.match(source, /Unidade externa/);
  assert.match(source, /UBS de referência/);

  // Preservação do texto de trilha e data do procedimento
  assert.match(source, /Movimento registrado em \{formatarDataBR\(h\.alterado_em\)\}/);
  assert.match(source, /formatarDataBR\(obterDataPrincipalHistorico\(h\)\)/);
});
