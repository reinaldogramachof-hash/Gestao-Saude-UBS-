/**
 * SEED 004 - Unidades Externas
 * -----------------------------------------------------------------------------
 * Cria credenciais de demonstracao para o Portal de Unidades Externas. A senha
 * padrao e apenas para a banca/demo e deve ser trocada em ambiente real.
 */
const bcrypt = require('bcrypt');

exports.seed = async function seed(knex) {
  const senha_hash = await bcrypt.hash('externa123', 12);

  const unidades = [
    {
      nome: 'AME SJC',
      tipo: 'AME',
      email: 'ame@sjc.sp.gov.br',
      senha_hash,
      ativo: true,
    },
    {
      nome: 'CAPS Centro',
      tipo: 'CAPS',
      email: 'caps@sjc.sp.gov.br',
      senha_hash,
      ativo: true,
    },
    {
      nome: 'Centro de Especialidades SJC',
      tipo: 'CENTRO_ESPECIALIDADES',
      email: 'especialidades@sjc.sp.gov.br',
      senha_hash,
      ativo: true,
    },
    {
      nome: 'Hospital Municipal Dr. Anisio Teixeira',
      tipo: 'HOSPITAL',
      email: 'hospital@sjc.sp.gov.br',
      senha_hash,
      ativo: true,
    },
  ];

  await knex('unidades_externas')
    .insert(unidades)
    .onConflict('email')
    .merge({
      nome: knex.raw('excluded.nome'),
      tipo: knex.raw('excluded.tipo'),
      senha_hash: knex.raw('excluded.senha_hash'),
      ativo: true,
    });
};
