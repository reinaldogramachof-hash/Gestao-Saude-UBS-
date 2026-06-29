/**
 * CONTEXTO DE AUTENTICACAO (AuthContext.jsx)
 * -----------------------------------------------------------------------------
 * FUNCAO: Compartilha os dados de sessao do usuario logado por toda a
 *         aplicacao. Tambem oferece updateUser para sincronizar alteracoes de
 *         sessao sem exigir novo login.
 * -----------------------------------------------------------------------------
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { TOKEN_KEYS, USER_KEYS, getTokenKey, getUserKey } from '../services/api';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaura a sessao do portal atual a partir do localStorage.
  useEffect(() => {
    const legacyToken = localStorage.getItem('@UBS_Token');
    const legacyUser = localStorage.getItem('@UBS_User');
    const tokenKey = getTokenKey();
    const userKey = getUserKey();

    if (legacyToken && legacyUser) {
      localStorage.setItem(tokenKey, legacyToken);
      localStorage.setItem(userKey, legacyUser);
      localStorage.removeItem('@UBS_Token');
      localStorage.removeItem('@UBS_User');
    }

    const tokenSalvo = localStorage.getItem(tokenKey);
    const usuarioSalvo = localStorage.getItem(userKey);

    if (tokenSalvo && usuarioSalvo) {
      try {
        setToken(tokenSalvo);
        setUser(JSON.parse(usuarioSalvo));
      } catch {
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userKey);
      }
    }

    setLoading(false);
  }, []);

  // Salva a sessao apos o login e separa corretamente as chaves por portal.
  const login = (userData, tokenRecebido) => {
    const { token: _ignorado, ...dadosUsuario } = userData;
    setUser(dadosUsuario);
    setToken(tokenRecebido);

    const tokenKey = TOKEN_KEYS[dadosUsuario.tipo] || getTokenKey();
    const userKey = USER_KEYS[dadosUsuario.tipo] || getUserKey();
    localStorage.setItem(tokenKey, tokenRecebido);
    localStorage.setItem(userKey, JSON.stringify(dadosUsuario));

    if (dadosUsuario.tipo === 'paciente') {
      setTimeout(registrarPush, 500);
    }
  };

  // Atualiza a sessao sem exigir novo login, como no aceite LGPD.
  const updateUser = (novosDados) => {
    setUser((usuarioAtual) => {
      if (!usuarioAtual) return usuarioAtual;

      const usuarioAtualizado = {
        ...usuarioAtual,
        ...novosDados,
      };

      const userKey = USER_KEYS[usuarioAtualizado.tipo] || getUserKey();
      localStorage.setItem(userKey, JSON.stringify(usuarioAtualizado));
      return usuarioAtualizado;
    });
  };

  // Registra push notification apos login do paciente.
  const registrarPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registro = await navigator.serviceWorker.register('/sw.js');
      const permissao = await Notification.requestPermission();
      if (permissao !== 'granted') return;

      const { data } = await api.get('/paciente/vapid-public-key');
      const chavePublica = urlBase64ToUint8Array(data.publicKey);

      const subscription = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: chavePublica,
      });

      await api.post('/paciente/push-subscribe', subscription.toJSON());
    } catch (err) {
      console.warn('[Push] Nao foi possivel ativar notificacoes:', err.message);
    }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
  }

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(getTokenKey());
    localStorage.removeItem(getUserKey());
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ user, token, login, updateUser, logout, isAuthenticated, loading, registrarPush }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
