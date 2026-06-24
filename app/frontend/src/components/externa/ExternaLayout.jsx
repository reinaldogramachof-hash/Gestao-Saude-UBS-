import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * COMPONENTE: ExternaLayout
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Layout principal para os usuários de Unidades Externas (AME, CAPS, etc).
 *         Possui um cabeçalho superior fixo com logo e botão de logout,
 *         e um sub-cabeçalho de abas fixo que permite navegar entre as telas
 *         de forma fluida e responsiva, garantindo excelente usabilidade.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function ExternaLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login-externa');
  };

  const isDashboard = location.pathname === '/externa/dashboard';
  const isEncaminhamentos = location.pathname === '/externa/encaminhamentos';

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col">
      {/* Cabeçalho Superior Fixo - Altura 56px */}
      <header className="h-[56px] bg-primary text-white fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 shadow-md">
        <Link to="/externa/dashboard" className="flex items-center gap-3 hover:opacity-90 active:scale-[0.99] transition-all">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-white text-2xl">local_hospital</span>
            <span className="font-extrabold text-lg tracking-tight">UBS+</span>
          </div>
          <div className="w-px h-6 bg-white/30 hidden sm:block"></div>
          {/* Mostra a unidade do usuário, fallback para 'Unidade Externa' */}
          <span className="text-sm font-medium opacity-90 hidden sm:block">
            {user?.unidade || 'Unidade Externa'}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium opacity-90 sm:hidden">
            {user?.unidade || 'Unidade'}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-bold text-white/90 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all active:scale-[0.97]"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Sub-header de Navegação Fixo - Altura 48px - top-[56px] */}
      <div className="h-[48px] bg-surface-container-lowest border-b border-surface-variant fixed top-[56px] left-0 right-0 z-40 shadow-sm flex items-center justify-center">
        <div className="max-w-4xl w-full h-full px-4 flex items-center gap-2">
          <Link
            to="/externa/dashboard"
            className={`h-full px-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 relative active:scale-[0.98] ${
              isDashboard
                ? 'text-primary border-primary'
                : 'text-on-surface-variant border-transparent hover:text-on-background'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Dashboard</span>
            {isDashboard && (
              <span className="absolute bottom-[-2px] left-0 right-0 h-[2.5px] bg-primary rounded-t-full"></span>
            )}
          </Link>
          <Link
            to="/externa/encaminhamentos"
            className={`h-full px-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 relative active:scale-[0.98] ${
              isEncaminhamentos
                ? 'text-primary border-primary'
                : 'text-on-surface-variant border-transparent hover:text-on-background'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
            <span>Fila de Atendimento</span>
            {isEncaminhamentos && (
              <span className="absolute bottom-[-2px] left-0 right-0 h-[2.5px] bg-primary rounded-t-full"></span>
            )}
          </Link>
        </div>
      </div>

      {/* Conteúdo Central - Espaço para compensar o header de 56px + sub-header de 48px = pt-[104px] */}
      <main className="flex-1 pt-[104px]">
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
