import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * COMPONENTE: ExternaLayout
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Layout principal para os usuários de Unidades Externas (AME, CAPS, etc).
 *         Possui um cabeçalho fixo simplificado com logo, identificação da
 *         unidade e botão de logout. Sem sidebar.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function ExternaLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login-externa');
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col">
      {/* Cabeçalho Fixo - Altura 56px */}
      <header className="h-[56px] bg-primary text-white fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* O logo original tem texto preto, não é ideal para fundo primary (geralmente azul/verde escuro). 
                Mas como solicitado, usaremos o logo padrão ou apenas o texto.
                Vou colocar um ícone representativo e o texto UBS+ */}
            <span className="material-symbols-outlined text-white text-2xl">local_hospital</span>
            <span className="font-extrabold text-lg tracking-tight">UBS+</span>
          </div>
          <div className="w-px h-6 bg-white/30 hidden sm:block"></div>
          {/* Mostra a unidade do usuário, fallback para 'Unidade Externa' */}
          <span className="text-sm font-medium opacity-90 hidden sm:block">
            {user?.unidade || 'Unidade Externa'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium opacity-90 sm:hidden">
            {user?.unidade || 'Unidade'}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-bold text-white/90 hover:text-white hover:bg-white/10 px-2 py-1.5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Central - Espaço para compensar o header fixo (pt-[56px]) */}
      <main className="flex-1 pt-[56px]">
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
