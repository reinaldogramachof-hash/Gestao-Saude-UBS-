/**
 * CONFIGURAÇÃO DO AXIOS (services/api.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Cria uma instância pré-configurada do Axios (biblioteca HTTP).
 *         Todos os componentes devem importar este 'api' para fazer requisições
 *         ao backend — nunca usar fetch puro ou criar instâncias avulsas.
 *
 * O QUE ELE FAZ AUTOMATICAMENTE:
 *   1. Define a URL base do backend (lida do .env como VITE_API_URL)
 *   2. Interceptor de REQUEST: adiciona o token JWT em cada requisição
 *      (o backend exige "Authorization: Bearer <token>" nas rotas protegidas)
 *   3. Interceptor de RESPONSE: se o backend retornar 401 (token expirado),
 *      limpa o localStorage e redireciona para o login
 *
 * COMO USAR em qualquer componente:
 *   import api from '../../services/api';
 *   const resposta = await api.get('/paciente/meus-dados');
 *   const resposta = await api.post('/auth/login-gestor', { email, senha });
 * ─────────────────────────────────────────────────────────────────────────────
 */
import axios from 'axios';

// Chaves por portal — evita conflito quando o mesmo browser usa dois portais
export const TOKEN_KEYS = {
  gestor:   '@UBS_Token_Gestor',
  paciente: '@UBS_Token_Paciente',
  externa:  '@UBS_Token_Externa',
};
export const USER_KEYS = {
  gestor:   '@UBS_User_Gestor',
  paciente: '@UBS_User_Paciente',
  externa:  '@UBS_User_Externa',
};

// Identifica o portal pela rota atual. As telas de login precisam entrar na
// mesma regra do portal protegido, porque o AuthContext salva a sessao ainda
// antes do navigate para /gestor/* ou /externa/*.
function getPortalFromPath(path) {
  if (path.startsWith('/gestor') || path === '/login-gestor') return 'gestor';
  if (path.startsWith('/externa') || path === '/login-externa') return 'externa';
  return 'paciente';
}

export function getTokenKey() {
  const portal = getPortalFromPath(window.location.pathname);
  return TOKEN_KEYS[portal];
}

export function getUserKey() {
  const portal = getPortalFromPath(window.location.pathname);
  return USER_KEYS[portal];
}

const api = axios.create({
  // VITE_API_URL vem do arquivo app/frontend/.env
  // Em desenvolvimento: http://localhost:3001
  // Em produção: URL do Railway
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// ─── Interceptor de REQUEST ────────────────────────────────────────────────
// Antes de cada requisição, lê o token do localStorage e o adiciona ao header.
// Isso evita ter que passar o token manualmente em cada chamada da API.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(getTokenKey());
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Interceptor de RESPONSE ───────────────────────────────────────────────
// 401 = token inválido/expirado → limpa sessão e redireciona para login.
// 503 = serviço indisponível (cold start do serverless / DB timeout) →
//       NÃO limpa o token, apenas rejeita a promise. O componente pode
//       mostrar "Tente novamente" sem derrubar a sessão do usuário.
api.interceptors.response.use(
  (response) => response, // Resposta OK: passa direto
  (error) => {
    // 503 do backend = erro de infraestrutura, não de autenticação.
    // Não fazer logout — o token ainda é válido.
    if (error.response?.status === 503) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // O portal precisa ser identificado antes da limpeza. Depois que o
      // storage é apagado, não seria mais possível distinguir gestor e paciente.
      const userKey = getUserKey();
      const tokenKey = getTokenKey();

      let usuario = {};
      try {
        usuario = JSON.parse(localStorage.getItem(userKey) || '{}');
      } catch {
        // JSON corrompido é tratado como sessão de paciente por segurança.
        usuario = {};
      }

      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);

      // Redireciona para o login sem usar react-router (evita dependência circular)
      if (usuario.tipo === 'gestor') {
        window.location.href = '/login-gestor';
      } else if (usuario.tipo === 'externa') {
        window.location.href = '/login-externa';
      } else {
        window.location.href = '/login-paciente';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
