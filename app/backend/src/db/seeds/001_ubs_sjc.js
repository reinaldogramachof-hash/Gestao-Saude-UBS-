/**
 * SEED 001 — Dados Iniciais de Desenvolvimento
 * Finalidade: Popula o banco com 3 UBSs fictícias de SJC e um gestor admin por UBS.
 * ATENÇÃO: Este arquivo é APENAS para ambiente de desenvolvimento e testes.
 * Nunca rodar em produção com dados reais de pacientes.
 * Senha de todos os gestores de teste: senha123
 */
const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Apaga dados na ordem inversa das dependências para não violar chaves estrangeiras
  await knex('historico_status').del();
  await knex('solicitacoes').del();
  await knex('agendamentos_gestao').del();
  await knex('comunicados').del();
  await knex('medicamentos').del();
  await knex('pacientes').del();
  await knex('usuarios_gestores').del();
  await knex('ubs').del();

  // Insere as 3 UBSs e captura os IDs gerados pelo banco
  const ubsInseridas = await knex('ubs').insert([
    { nome: 'UBS Centro SJC',      endereco: 'Rua do Centro, 123',   bairro: 'Centro',           telefone: '12 3900-0001' },
    { nome: 'UBS Vila Industrial', endereco: 'Rua da Vila, 456',     bairro: 'Vila Industrial',  telefone: '12 3900-0002' },
    { nome: 'UBS Jardim Satélite', endereco: 'Av. Andrômeda, 789',   bairro: 'Jardim Satélite',  telefone: '12 3900-0003' },
  ]).returning('id');

  // Extrai apenas os IDs (o .returning() pode retornar objetos ou números dependendo da versão do Knex)
  const ubsIds = ubsInseridas.map(u => (typeof u === 'object' ? u.id : u));

  // Gera o hash da senha "senha123" para uso nos gestores de teste
  const senhaHash = await bcrypt.hash('senha123', 10);

  // Insere um gestor admin para cada UBS
  await knex('usuarios_gestores').insert([
    { ubs_id: ubsIds[0], nome: 'Gestor Centro',      email: 'centro@gestaoubs.dev',      senha_hash: senhaHash, perfil: 'admin' },
    { ubs_id: ubsIds[1], nome: 'Gestor Industrial',  email: 'industrial@gestaoubs.dev',  senha_hash: senhaHash, perfil: 'admin' },
    { ubs_id: ubsIds[2], nome: 'Gestor Satélite',    email: 'satelite@gestaoubs.dev',    senha_hash: senhaHash, perfil: 'admin' },
  ]);
};
