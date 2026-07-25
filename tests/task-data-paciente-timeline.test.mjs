/**
 * TESTES DE CONTRATO: Datas da timeline do paciente
 * ---------------------------------------------------------------------------
 * Garante que eventos de agendamento exibam a data operacional do procedimento,
 * mantendo a data de movimentacao como trilha complementar de auditoria.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('detalhe da solicitacao usa data do procedimento nos eventos de data marcada', async () => {
  const source = await read('app/frontend/src/pages/paciente/DetalheSolicitacao.jsx');

  assert.match(source, /obterDataPrincipalHistorico/);
  assert.match(source, /historico\.status_novo === 'data_marcada'/);
  assert.match(source, /sol\.encaminhamento\?\.data_procedimento_unidade/);
  assert.match(source, /formatarDataBR\(obterDataPrincipalHistorico\(h\)\)/);
  assert.match(source, /Movimento registrado em/);
});
