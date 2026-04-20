/**
 * CONTEXTO DE AUTENTICAÇÃO (AuthContext.jsx)
 * ---------------------------------------------------------
 * O Context API (createContext) é uma forma de compartilhar
 * variáveis globalmente por toda a aplicação React sem precisar
 * passar "props" de pai para filho manualmente.
 * 
 * Aqui guardamos dados como: o "token" JWT do usuário, 
 * seu perfil (gestor ou paciente) e funções vitais 
 * como realizar o login e logout.
 */
import React, { createContext, useState } from 'react';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('@UBS_Token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('@UBS_Token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};