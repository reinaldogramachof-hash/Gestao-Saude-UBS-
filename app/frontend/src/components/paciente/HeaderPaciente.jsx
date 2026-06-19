// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: HeaderPaciente
// FUNÇÃO: Header fixo no topo do portal do paciente.
//         Exibe o hamburger menu (☰) para abrir o DrawerPaciente, o logo da UBS+
//         e o sino de notificações.
//         O badge vermelho no sino mostra a contagem de comunicados não lidos.
// PROPS:
//   - onOpenDrawer: function — callback para abrir o DrawerPaciente
//   - unreadCount: number — quantidade de comunicados não lidos
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HeaderPaciente({ onOpenDrawer, unreadCount = 0 }) {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-surface-container-lowest border-b border-surface-variant flex items-center justify-between px-4 z-30 shadow-sm">
      
      {/* ── Botão Hamburger + Logo ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenDrawer}
          className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface"
          aria-label="Abrir menu de navegação"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        
        {/* Logo UBS+ em verde */}
        <div className="flex items-center gap-1.5 text-primary select-none">
          <span className="material-symbols-outlined text-2xl font-bold">health_and_safety</span>
          <span className="font-black text-base tracking-tight">UBS+</span>
        </div>
      </div>

      {/* ── Notificações (Sino com badge) ── */}
      <button
        onClick={() => navigate('/paciente/comunicados')}
        className="relative w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
        aria-label="Ver comunicados"
      >
        <span className="material-symbols-outlined text-2xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-surface-container-lowest animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </header>
  );
}
