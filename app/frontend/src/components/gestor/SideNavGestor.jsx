/**
 * COMPONENTE: SideNavGestor.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Sidebar de navegação do portal do gestor.
 *         No desktop: sempre visível como coluna lateral fixa.
 *         No mobile: funciona como drawer (controlado pelo GestorLayout).
 *
 * BOTÃO PWA:
 *   Exibido de forma discreta no rodapé da sidebar, abaixo do botão de sair.
 *   Aparece apenas quando o browser disponibiliza o prompt de instalação.
 *
 * PROPS:
 *   - onFechar: função chamada ao clicar em um link para fechar o drawer no mobile
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export default function SideNavGestor({ onFechar }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Hook de instalação PWA — discreto para gestores (usam principalmente desktop)
  const { podeInstalar, instalar, jaInstalado } = usePWAInstall();

  // Retorna as classes de destaque para o link da rota ativa
  const isActive = (p) =>
    pathname.includes(p)
      ? 'bg-primary/10 text-primary'
      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface';

  // Ao clicar num link: fecha o drawer no mobile (onFechar) e navega
  const handleNavegar = () => {
    if (onFechar) onFechar();
  };

  const handleSair = () => {
    logout();
    navigate('/login-gestor');
  };

  return (
    <aside className="w-72 bg-surface-container-lowest border-r border-surface-variant flex flex-col h-screen overflow-y-auto">

      {/* ── Logo e título do sistema ── */}
      <div className="p-6 border-b border-surface-variant flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
            <span className="material-symbols-outlined text-on-primary text-xl">health_and_safety</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-on-background leading-tight">Gestão Saúde</h1>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">UBS+</p>
          </div>
        </div>

        {/* Botão de fechar — visível apenas no mobile (lg:hidden) */}
        <button
          onClick={onFechar}
          className="lg:hidden w-8 h-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* ── Links de navegação ── */}
      {/* Cada link chama handleNavegar para fechar o drawer no mobile */}
      <nav className="p-3 space-y-1 flex-1">
        <Link
          to="/gestor/dashboard"
          onClick={handleNavegar}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm ${isActive('dashboard')}`}
        >
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <span>Painel Principal</span>
        </Link>

        <Link
          to="/gestor/pacientes"
          onClick={handleNavegar}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm ${isActive('pacientes')}`}
        >
          <span className="material-symbols-outlined text-xl">people</span>
          <span>Pacientes</span>
        </Link>

        <Link
          to="/gestor/comunicados"
          onClick={handleNavegar}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm ${isActive('comunicados')}`}
        >
          <span className="material-symbols-outlined text-xl">campaign</span>
          <span>Comunicados</span>
        </Link>

        <Link
          to="/gestor/agendamentos"
          onClick={handleNavegar}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm ${isActive('agendamentos')}`}
        >
          <span className="material-symbols-outlined text-xl">calendar_month</span>
          <span>Agendamentos</span>
        </Link>

        <Link
          to="/gestor/medicamentos"
          onClick={handleNavegar}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm ${isActive('medicamentos')}`}
        >
          <span className="material-symbols-outlined text-xl">medication</span>
          <span>Gestão de Medicamentos</span>
        </Link>
      </nav>

      {/* ── Rodapé: sair + instalação discreta do PWA ── */}
      <div className="p-3 border-t border-surface-variant space-y-1">

        {/* Botão discreto de instalação PWA — só aparece quando disponível e não instalado */}
        {podeInstalar && !jaInstalado && (
          <button
            onClick={instalar}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-all"
            title="Instalar UBS+ como aplicativo"
          >
            <span className="material-symbols-outlined text-xl">download</span>
            <span>Instalar aplicativo</span>
          </button>
        )}

        <button
          onClick={handleSair}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span>Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
}
