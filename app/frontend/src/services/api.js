/**
 * CONFIGURAÇÃO DO AXIOS (api.js)
 * ---------------------------------------------------------
 * O Axios é uma biblioteca para fazer requisições HTTP (comunicação com o Backend).
 * Aqui nós criamos uma "instância" padrão, configurando a "baseURL" 
 * baseada no nosso arquivo .env, usando VITE_API_URL.
 * Sempre que você for chamar o backend, deverá importar este 'api'
 * ao invés de usar fetch puro.
 */
import axios from 'axios';

const api = axios.create({
  // Importa a variável VITE_API_URL do arquivo .env.
  // Em Vite, variáveis de ambiente públicas precisam começar com "VITE_"
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

// Exemplo de como usar em outros arquivos: 
// import api from './services/api';
// api.get('/pacientes');

export default api;