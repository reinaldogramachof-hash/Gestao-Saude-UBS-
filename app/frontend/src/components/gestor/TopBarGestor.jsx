/**
 * COMPONENTE: TopBarGestor.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Barra superior do portal do gestor.
 *         No mobile: exibe botão hamburger para abrir o sidebar drawer.
 *         No desktop: oculta o hamburger (sidebar está sempre visível).
 *
 * PROPS:
 *   - onAbrirSidebar: função chamada ao clicar no botão hamburger (mobile)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function TopBarGestor({ onAbrirSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSair = () => {
    logout();
    navigate('/login-gestor');
  };

  return (
    <header className="h-16 md:h-20 bg-surface-container-lowest border-b border-surface-variant flex items-center justify-between px-4 md:px-8 lg:px-10 sticky top-0 z-30">

      {/* ── Lado esquerdo: hamburger (mobile) + saudação ── */}
      <div className="flex items-center gap-3">
        {/* Botão hamburger — visível apenas no mobile (lg:hidden) */}
        <button
          onClick={onAbrirSidebar}
          className="lg:hidden w-10 h-10 rounded-xl hover:bg-surface-container-high flex items-center justify-center text-on-surface"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div>
          <h2 className="text-base md:text-xl font-bold text-on-background leading-tight">
            Olá, {user?.nome?.split(' ')[0] || 'Gestor'}
          </h2>
          <p className="text-xs md:text-sm font-medium text-on-surface-variant hidden sm:block">
            Portal do Gestor — UBS+
          </p>
        </div>
      </div>

      {/* ── Lado direito: botão sair ── */}
      <button
        onClick={handleSair}
        className="h-9 md:h-10 px-3 md:px-5 rounded-full border border-outline text-on-surface font-semibold hover:bg-surface-variant transition-colors flex items-center gap-2 text-sm"
      >
        <span className="material-symbols-outlined text-lg">logout</span>
        {/* Texto oculto em telas muito pequenas para manter botão compacto */}
        <span className="hidden sm:inline">Sair do Sistema</span>
      </button>
    </header>
  );
}