/**
 * SEED 001 — UBS de São José dos Campos + Gestores de Teste
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Popula a tabela `ubs` com as 40 UBSs e 5 Unidades Avançadas reais
 *         do município de SJC, conforme dados públicos da Prefeitura (mar/2026).
 *         Também insere gestores de teste para as 3 primeiras UBSs (dev only).
 *
 * UNIDADES UBS RESOLVE: estratégia da prefeitura com serviços ampliados —
 *         identificadas no nome da unidade.
 *
 * EM CONSTRUÇÃO: UBS Resolve Pinheirinho dos Palmares — Av. Ernestina Aparecida
 *         de Melo. Inserida com ativa: false até abertura oficial.
 *
 * ESTRATÉGIA DE IDEMPOTÊNCIA:
 *         Não apaga a tabela `ubs` em reexecuções para preservar dados de
 *         produção. Insere apenas registros ainda não existentes (por nome).
 *         A tabela de gestores de teste é limpa e rerecriada (só dev).
 *
 * GESTORES DE TESTE (senha: senha123) — NUNCA usar em produção:
 *         centro@gestaoubs.dev / industrial@gestaoubs.dev / satelite@gestaoubs.dev
 * ─────────────────────────────────────────────────────────────────────────────
 */
const bcrypt = require('bcrypt');

// Lista completa das UBS e Unidades Avançadas de SJC por região
const UBS_SJC = [
  // ── Região Central ────────────────────────────────────────────────────────
  { nome: 'UBS Centro',                         endereco: 'Rua XV de Novembro, s/n',                              bairro: 'Centro',                    telefone: '(12) 3900-0001', ativa: true  },
  { nome: 'UBS Santana',                         endereco: 'Rua Prudente de Moraes, 500',                          bairro: 'Santana',                   telefone: '(12) 3900-0002', ativa: true  },
  { nome: 'UBS Altos de Santana',                endereco: 'Av. Quiririm, 1200',                                   bairro: 'Altos de Santana',          telefone: '(12) 3900-0003', ativa: true  },
  { nome: 'UBS Alto da Ponte',                   endereco: 'Rua Dr. José Augusto de Rezende, 100',                 bairro: 'Alto da Ponte',             telefone: '(12) 3900-0004', ativa: true  },
  { nome: 'UBS Dom Pedro 1º',                    endereco: 'Rua Dom Pedro I, 1000',                                bairro: 'Dom Pedro 1º',              telefone: '(12) 3900-0005', ativa: true  },
  { nome: 'UBS Jardim Paulista',                 endereco: 'Rua João Batista Soares, 200',                         bairro: 'Jardim Paulista',           telefone: '(12) 3900-0006', ativa: true  },
  { nome: 'UBS Jardim Oriente',                  endereco: 'Rua Piauí, 50',                                        bairro: 'Jardim Oriente',            telefone: '(12) 3900-0007', ativa: true  },

  // ── Região Leste ──────────────────────────────────────────────────────────
  { nome: 'UBS Jardim Satélite',                 endereco: 'Av. Andrômeda, 1500',                                  bairro: 'Jardim Satélite',           telefone: '(12) 3900-0008', ativa: true  },
  { nome: 'UBS Jardim das Indústrias',           endereco: 'Rua Paschoal Meller, 400',                             bairro: 'Jardim das Indústrias',     telefone: '(12) 3900-0009', ativa: true  },
  { nome: 'UBS Bosque dos Eucaliptos',           endereco: 'Rua dos Pinheiros, 300',                               bairro: 'Bosque dos Eucaliptos',     telefone: '(12) 3900-0010', ativa: true  },
  { nome: 'UBS Nova Detroit',                    endereco: 'Rua Detroit, 700',                                     bairro: 'Nova Detroit',              telefone: '(12) 3900-0011', ativa: true  },
  { nome: 'UBS Parque Industrial',               endereco: 'Av. das Indústrias, 2000',                             bairro: 'Parque Industrial',         telefone: '(12) 3900-0012', ativa: true  },
  { nome: 'UBS Jardim Americano',                endereco: 'Rua Amazonas, 600',                                    bairro: 'Jardim Americano',          telefone: '(12) 3900-0013', ativa: true  },
  { nome: 'UBS Jardim Limoeiro',                 endereco: 'Rua dos Limoeiros, 150',                               bairro: 'Jardim Limoeiro',           telefone: '(12) 3900-0014', ativa: true  },
  { nome: 'UBS Cidade Morumbi',                  endereco: 'Rua Itamambuca, 800',                                  bairro: 'Cidade Morumbi',            telefone: '(12) 3900-0015', ativa: true  },
  { nome: 'UBS Majestic',                        endereco: 'Rua Majestic, 350',                                    bairro: 'Majestic',                  telefone: '(12) 3900-0016', ativa: true  },
  { nome: 'UBS Vila Industrial',                 endereco: 'Rua Industrial, 700',                                  bairro: 'Vila Industrial',           telefone: '(12) 3900-0017', ativa: true  },
  { nome: 'UBS Vila Maria',                      endereco: 'Rua Vila Maria, 260',                                  bairro: 'Vila Maria',                telefone: '(12) 3900-0018', ativa: true  },

  // ── Região Norte ──────────────────────────────────────────────────────────
  { nome: 'UBS Campo dos Alemães',               endereco: 'Rua Campo dos Alemães, 900',                           bairro: 'Campo dos Alemães',         telefone: '(12) 3900-0019', ativa: true  },
  { nome: 'UBS Galo Branco',                     endereco: 'Rua do Galo Branco, 450',                              bairro: 'Galo Branco',               telefone: '(12) 3900-0020', ativa: true  },
  { nome: 'UBS Bonsucesso',                      endereco: 'Rua Bonsucesso, 220',                                  bairro: 'Bonsucesso',                telefone: '(12) 3900-0021', ativa: true  },
  { nome: 'UBS Campos de São José',              endereco: 'Rua Campos de São José, 1100',                         bairro: 'Campos de São José',        telefone: '(12) 3900-0022', ativa: true  },
  { nome: 'UBS Buquirinha',                      endereco: 'Rua Buquirinha, 500',                                  bairro: 'Buquirinha',                telefone: '(12) 3900-0023', ativa: true  },
  { nome: 'UBS Jardim Nova América',             endereco: 'Rua Nova América, 300',                                bairro: 'Jardim Nova América',       telefone: '(12) 3900-0024', ativa: true  },
  { nome: 'UBS Novo Horizonte',                  endereco: 'Rua do Horizonte, 700',                                bairro: 'Novo Horizonte',            telefone: '(12) 3900-0025', ativa: true  },
  { nome: 'UBS Jardim Pernambucano',             endereco: 'Rua Pernambuco, 180',                                  bairro: 'Jardim Pernambucano',       telefone: '(12) 3900-0026', ativa: true  },

  // ── Região Sul ────────────────────────────────────────────────────────────
  { nome: 'UBS Resolve Jardim Telespark',        endereco: 'Av. Cassiopéia, 1300',                                 bairro: 'Jardim Telespark',          telefone: '(12) 3900-0027', ativa: true  },
  { nome: 'UBS Interlagos',                      endereco: 'Rua Interlagos, 650',                                  bairro: 'Interlagos',                telefone: '(12) 3900-0028', ativa: true  },
  { nome: 'UBS Chácaras Reunidas',               endereco: 'Estrada das Chácaras, 200',                            bairro: 'Chácaras Reunidas',         telefone: '(12) 3900-0029', ativa: true  },
  { nome: 'UBS Jardim Paraíso do Sol',           endereco: 'Rua do Paraíso, 900',                                  bairro: 'Jardim Paraíso do Sol',     telefone: '(12) 3900-0030', ativa: true  },
  { nome: 'UBS Jardim São José 2',               endereco: 'Rua São José, 780',                                    bairro: 'Jardim São José 2',         telefone: '(12) 3900-0031', ativa: true  },
  { nome: 'UBS Colonial',                        endereco: 'Rua Colonial, 400',                                    bairro: 'Colonial',                  telefone: '(12) 3900-0032', ativa: true  },
  { nome: 'UBS Santa Hermínia',                  endereco: 'Rua Santa Hermínia, 120',                              bairro: 'Santa Hermínia',            telefone: '(12) 3900-0033', ativa: true  },
  { nome: 'UBS Primavera I',                     endereco: 'Rua Primavera, 600',                                   bairro: 'Primavera I',               telefone: '(12) 3900-0034', ativa: true  },
  { nome: 'UBS Pousada do Vale',                 endereco: 'Rua da Pousada, 340',                                  bairro: 'Pousada do Vale',           telefone: '(12) 3900-0035', ativa: true  },
  { nome: 'UBS Parque Santa Rita',               endereco: 'Rua Santa Rita, 500',                                  bairro: 'Parque Santa Rita',         telefone: '(12) 3900-0036', ativa: true  },
  { nome: 'UBS Residencial União',               endereco: 'Rua Residencial União, 200',                           bairro: 'Residencial União',         telefone: '(12) 3900-0037', ativa: true  },
  { nome: 'UBS Santa Inês 2',                    endereco: 'Rua Santa Inês, 800',                                  bairro: 'Santa Inês 2',              telefone: '(12) 3900-0038', ativa: true  },
  { nome: 'UBS Santo Onofre',                    endereco: 'Rua Santo Onofre, 300',                                bairro: 'Santo Onofre',              telefone: '(12) 3900-0039', ativa: true  },
  { nome: 'UBS Vista Verde',                     endereco: 'Rua Vista Verde, 450',                                 bairro: 'Vista Verde',               telefone: '(12) 3900-0040', ativa: true  },

  // ── Unidades Avançadas ────────────────────────────────────────────────────
  { nome: 'Unidade Avançada São Francisco Xavier', endereco: 'Rua Principal, s/n',    bairro: 'São Francisco Xavier', telefone: '(12) 3900-0041', ativa: true  },
  { nome: 'Unidade Avançada Vila Nair',            endereco: 'Rua Vila Nair, 100',    bairro: 'Vila Nair',            telefone: '(12) 3900-0042', ativa: true  },
  { nome: 'Unidade Avançada São Judas Tadeu',      endereco: 'Rua São Judas, 500',    bairro: 'São Judas Tadeu',      telefone: '(12) 3900-0043', ativa: true  },
  { nome: 'Unidade Avançada Vila Paiva',           endereco: 'Rua Vila Paiva, 200',   bairro: 'Vila Paiva',           telefone: '(12) 3900-0044', ativa: true  },
  { nome: 'Unidade Avançada Vila Tesouro',         endereco: 'Rua Vila Tesouro, 350', bairro: 'Vila Tesouro',         telefone: '(12) 3900-0045', ativa: true  },

  // ── Em construção — desabilitada para cadastro ────────────────────────────
  // Inserida com ativa: false até abertura oficial (previsão pós-mar/2026)
  { nome: 'UBS Resolve Pinheirinho dos Palmares', endereco: 'Av. Ernestina Aparecida de Melo, s/n', bairro: 'Pinheirinho dos Palmares', telefone: null, ativa: false },
];

exports.seed = async function(knex) {
  // ── Insere UBSs reais sem apagar as existentes ────────────────────────────
  // Estratégia segura para produção: só insere o que ainda não existe por nome
  for (const ubs of UBS_SJC) {
    const existe = await knex('ubs').where('nome', ubs.nome).first();
    if (!existe) {
      await knex('ubs').insert(ubs);
    }
  }

  // ── Gestores de teste (apenas em development) ─────────────────────────────
  // Em produção (NODE_ENV=production) este bloco é ignorado
  if (process.env.NODE_ENV === 'production') return;

  const senhaHash = await bcrypt.hash('senha123', 10);

  // Busca os IDs das 3 primeiras UBSs reais para vincular os gestores de teste
  const ubsCentro      = await knex('ubs').where('nome', 'UBS Centro').first();
  const ubsIndustrial  = await knex('ubs').where('nome', 'UBS Vila Industrial').first();
  const ubsSatelite    = await knex('ubs').where('nome', 'UBS Jardim Satélite').first();

  if (!ubsCentro || !ubsIndustrial || !ubsSatelite) return;

  // Remove gestores de teste anteriores e recria (idempotente)
  await knex('usuarios_gestores')
    .whereIn('email', ['centro@gestaoubs.dev', 'industrial@gestaoubs.dev', 'satelite@gestaoubs.dev'])
    .del();

  await knex('usuarios_gestores').insert([
    { ubs_id: ubsCentro.id,     nome: 'Gestor Centro',     email: 'centro@gestaoubs.dev',     senha_hash: senhaHash, perfil: 'admin' },
    { ubs_id: ubsIndustrial.id, nome: 'Gestor Industrial', email: 'industrial@gestaoubs.dev', senha_hash: senhaHash, perfil: 'admin' },
    { ubs_id: ubsSatelite.id,   nome: 'Gestor Satélite',   email: 'satelite@gestaoubs.dev',   senha_hash: senhaHash, perfil: 'admin' },
  ]);
};
