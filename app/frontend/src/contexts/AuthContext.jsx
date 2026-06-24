/**
 * CONTEXTO DE AUTENTICAÇÃO (AuthContext.jsx)
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Compartilha os dados de sessão do usuário logado por toda a aplicação.
 *         O Context API do React funciona como uma "variável global" que qualquer
 *         componente pode ler sem precisar receber por props.
 *
 * O QUE GUARDA:
 *   - user: objeto com { id, nome, tipo, ubs_id, perfil } extraído do JWT
 *   - token: string JWT armazenada também no localStorage (persiste o refresh)
 *   - isAuthenticated: true se há token válido na sessão
 *   - loading: true enquanto a sessão está sendo restaurada do localStorage
 *
 * COMO USAR em qualquer componente:
 *   import { useAuth } from '../../hooks/useAuth';
 *   const { user, login, logout, isAuthenticated } = useAuth();
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { TOKEN_KEYS, USER_KEYS, getTokenKey, getUserKey } from '../services/api';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  // Estado do usuário logado (null = não logado)
  const [user,    setUser]    = useState(null);
  // Token JWT em memória (também salvo no localStorage para sobreviver ao F5)
  const [token,   setToken]   = useState(null);
  // true durante a leitura inicial do localStorage (evita redirect prematuro)
  const [loading, setLoading] = useState(true);

  // ─── Restaura a sessão ao recarregar a página ─────────────────────────────
  // Roda uma vez na montagem do componente. Lê o token salvo no localStorage
  // e restaura o usuário sem precisar fazer login novamente.
  useEffect(() => {
    const legacyToken = localStorage.getItem('@UBS_Token');
    const legacyUser = localStorage.getItem('@UBS_User');
    const tokenKey = getTokenKey();
    const userKey = getUserKey();

    // Fallback/Migração legada
    if (legacyToken && legacyUser) {
      localStorage.setItem(tokenKey, legacyToken);
      localStorage.setItem(userKey, legacyUser);
      localStorage.removeItem('@UBS_Token');
      localStorage.removeItem('@UBS_User');
    }

    const tokenSalvo   = localStorage.getItem(tokenKey);
    const usuarioSalvo = localStorage.getItem(userKey);

    if (tokenSalvo && usuarioSalvo) {
      try {
        setToken(tokenSalvo);
        setUser(JSON.parse(usuarioSalvo));
      } catch {
        // Se o JSON do usuário estiver corrompido, limpa tudo
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userKey);
      }
    }

    setLoading(false); // Conclui a verificação inicial — libera as rotas para renderizar
  }, []);

  // ─── Salva a sessão após o login ─────────────────────────────────────────
  // Chamado pelas páginas de Login após receberem o token da API.
  // userData: o objeto retornado pela API { id, nome, tipo, ubs_id, ... }
  // tokenRecebido: a string JWT
  const login = (userData, tokenRecebido) => {
    // Remove o token do objeto do usuário antes de salvar (evita duplicação no localStorage)
    const { token: _ignorado, ...dadosUsuario } = userData;
    setUser(dadosUsuario);
    setToken(tokenRecebido);
    // Usa o tipo retornado pela API para salvar a sessao no portal correto.
    // No login gestor, por exemplo, a URL ainda e /login-gestor; depender so
    // do pathname pode gravar o token na chave errada e derrubar o dashboard.
    const tokenKey = TOKEN_KEYS[dadosUsuario.tipo] || getTokenKey();
    const userKey = USER_KEYS[dadosUsuario.tipo] || getUserKey();
    localStorage.setItem(tokenKey, tokenRecebido);
    localStorage.setItem(userKey, JSON.stringify(dadosUsuario));

    // Ativa push notifications automaticamente para pacientes após login
    if (dadosUsuario.tipo === 'paciente') {
      // setTimeout garante que o token já esteja no localStorage antes da chamada à API
      setTimeout(registrarPush, 500);
    }
  };

  // ─── Push Notifications: registra o service worker após login do paciente ───
  // Chamado automaticamente quando um paciente autentica com sucesso.
  // Fluxo: registra SW → pede permissão → obtém subscription → envia ao backend.
  const registrarPush = async () => {
    // Verifica se o browser suporta service workers e push notifications
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      // Registra o service worker (arquivo público em /sw.js)
      const registro = await navigator.serviceWorker.register('/sw.js');

      // Solicita permissão ao usuário para enviar notificações
      const permissao = await Notification.requestPermission();
      if (permissao !== 'granted') return; // Usuário recusou — não prossegue

      // Obtém a chave pública VAPID do backend para criar a subscription
      const { data } = await api.get('/paciente/vapid-public-key');

      // Converte a chave VAPID de base64 para Uint8Array (formato exigido pelo browser)
      const chavePublica = urlBase64ToUint8Array(data.publicKey);

      // Inscreve o dispositivo no serviço de push do navegador
      const subscription = await registro.pushManager.subscribe({
        userVisibleOnly:      true, // Obrigatório: toda notificação deve ser visível ao usuário
        applicationServerKey: chavePublica,
      });

      // Envia a subscription ao backend para ser salva no banco
      await api.post('/paciente/push-subscribe', subscription.toJSON());
    } catch (err) {
      // Falha silenciosa: push é feature extra, não deve impedir o uso do app
      console.warn('[Push] Não foi possível ativar notificações:', err.message);
    }
  };

  // Converte string base64 para Uint8Array — formato exigido pela Web Push API
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw     = window.atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

  // ─── Limpa a sessão ao fazer logout ──────────────────────────────────────
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(getTokenKey());
    localStorage.removeItem(getUserKey());
  };

  // isAuthenticated: verdadeiro se existe um usuário e um token na sessão
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading, registrarPush }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook de atalho ──────────────────────────────────────────────────────────
// Permite usar: import { useAuth } from '../contexts/AuthContext'
// OU via:       import { useAuth } from '../hooks/useAuth'
export const useAuth = () => useContext(AuthContext);
