/**
 * KNEXFILE.JS — Configuração do Banco de Dados
 * O Knex é um "query builder": ajuda a escrever SQL de forma mais segura e organizada.
 * Este arquivo define COMO o Knex se conecta ao PostgreSQL em cada ambiente.
 * A URL de conexão vem do arquivo .env (nunca escrever senha direto aqui).
 */
require('dotenv').config();

module.exports = {
  // Ambiente de desenvolvimento local
  development: {
    client: 'pg',                                              // Usar o driver do PostgreSQL
    connection: process.env.DATABASE_URL
      || 'postgres://postgres:postgres@localhost:5432/gestao_saude_ubs',
    pool: { min: 2, max: 10 },                                 // Pool de conexões simultâneas
    migrations: {
      directory: './src/db/migrations'                         // Onde estão os arquivos de migration
    },
    seeds: {
      directory: './src/db/seeds'                              // Onde estão os arquivos de seed (dados de teste)
    }
  },

  // Ambiente de produção (Railway ou similar)
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
    migrations: {
      directory: './src/db/migrations'
    }
  }
};
