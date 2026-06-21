/**
 * TESTES DE CONTRATO: Expansao do Painel Gestor
 * ---------------------------------------------------------------------------
 * Verifica os contratos estruturais solicitados sem depender de banco remoto
 * ou de credenciais. As expressoes protegem rotas, campos e fluxos essenciais.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('lista de pacientes agrega solicitacoes ativas e urgentes sem CPF', async () => {
  const source = await read('app/backend/src/routes/gestor.js');
  const route = source.match(/router\.get\('\/pacientes'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(route, /leftJoin\(['"]solicitacoes as s['"]/);
  assert.match(route, /COUNT\(CASE WHEN s\.status NOT IN/);
  assert.match(route, /BOOL_OR\(s\.prioridade =/);
  assert.match(route, /\.groupBy\(/);
  assert.doesNotMatch(route, /['"]cpf['"]/);
});

test('historico valida UBS e retorna gestor em ordem cronologica', async () => {
  const source = await read('app/backend/src/routes/gestor.js');

  assert.match(source, /router\.get\('\/solicitacao\/:id\/historico'/);
  assert.match(source, /join\(['"]pacientes['"]/);
  assert.match(source, /req\.user\.ubs_id/);
  assert.match(source, /leftJoin\(['"]usuarios_gestores['"]/);
  assert.match(source, /usuarios_gestores\.nome as gestor_nome/);
  assert.match(source, /orderBy\(['"]historico_status\.alterado_em['"],\s*['"]asc['"]\)/);
});

test('cadastro e edicao de paciente usam retorno explicito sem CPF', async () => {
  const source = await read('app/backend/src/routes/gestor.js');
  const cadastro = source.match(/router\.post\('\/paciente'[\s\S]*?\n\}\);/)?.[0] || '';
  const edicao = source.match(/router\.put\('\/paciente\/:id'[\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(source, /const CAMPOS_PACIENTE_RETORNO = \[/);
  assert.match(cadastro, /\.returning\(CAMPOS_PACIENTE_RETORNO\)/);
  assert.match(edicao, /\.returning\(CAMPOS_PACIENTE_RETORNO\)/);
  assert.doesNotMatch(cadastro, /\.returning\(['"]\*['"]\)/);
  assert.doesNotMatch(edicao, /\.returning\(['"]\*['"]\)/);
});

test('medicamentos oferece cadastro edicao filtros contadores e retry', async () => {
  const source = await read('app/frontend/src/pages/gestor/MedicamentosGestor.jsx');

  assert.match(source, /Novo Medicamento/);
  assert.match(source, /api\.post\(['"]\/gestor\/medicamento['"]/);
  assert.match(source, /Todos/);
  assert.match(source, /Disponíveis/);
  assert.match(source, /Em falta/);
  assert.match(source, /Tentar novamente/);
  assert.match(source, /Atualizado em/);
});

test('perfil permite editar dados e consultar historico expansivel', async () => {
  const source = await read('app/frontend/src/pages/gestor/PerfilPaciente.jsx');

  assert.match(source, /Editar Dados/);
  assert.match(source, /api\.put\(`\/gestor\/paciente\/\$\{id\}`/);
  assert.match(source, /Ver histórico/);
  assert.match(source, /\/historico`/);
  assert.match(source, /status_anterior/);
  assert.match(source, /gestor_nome/);
});

test('lista de pacientes exibe badges e paginacao de vinte itens', async () => {
  const source = await read('app/frontend/src/pages/gestor/GestorPacientes.jsx');

  assert.match(source, /paginaAtual/);
  assert.match(source, /limite:\s*['"]20['"]/);
  assert.match(source, /solicitacoes_ativas/);
  assert.match(source, /tem_urgente/);
  assert.match(source, /Anterior/);
  assert.match(source, /Próxima/);
});

test('agendamentos oferece resumo vinculo de paciente e repeticao sequencial', async () => {
  const source = await read('app/frontend/src/pages/gestor/AgendamentosGestor.jsx');

  assert.match(source, /useNavigate/);
  assert.match(source, /Ver paciente/);
  assert.match(source, /Repetir por/);
  assert.match(source, /api\.post\(['"]\/gestor\/agendamentos\/lote['"]/);
  assert.match(source, /intervalo_minutos/);
  assert.match(source, /pular_fins_de_semana/);
  assert.match(source, /Concluídos hoje/);
});
