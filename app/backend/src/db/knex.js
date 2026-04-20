/**
 * CONEXÃO COM BANCO DE DADOS (knex.js)
 * ---------------------------------------------------------
 * O Knex é um "Query Builder" (Construtor de Consultas SQL) para JavaScript.
 * Ele permite que a gente se comunique com o banco de dados (no caso, PostgreSQL)
 * escrevendo JavaScript em vez de strings SQL puras, e ajuda muito nas "migrations"
 * (Scripts que criam e atualizam as tabelas).
 */
const knex = require('knex');
require('dotenv').config();

const connection = knex({
  client: 'pg', // Usamos o client 'pg' porque nosso banco é o PostgreSQL
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 }
});

module.exports = connection;