/**
 * COMPONENTE: SideNavGestor.jsx
 * -----------------------------------------------------------------------------
 * FUNÇÃO: Sidebar em seções do portal gestor, com drawer completo no mobile e
 *         modo icon-only retraível no desktop.
 *
 * COMPORTAMENTO:
 *   - Mobile: mantém largura w-72, textos, botão fechar e navegação por drawer.
 *   - Desktop expandido: exibe rótulos, nomes, perfil e ações completas.
 *   - Desktop retraído: exibe apenas ícones centralizados com title nativo.
 *   - Administração: visível somente para usuários com perfil admin.
 *
 * PROPS:
 *   - onFechar: fecha o drawer após uma navegação no mobile.
 *   - retraida: preferência persistida que controla apenas o desktop.
 *   - onToggle: alterna a largura desktop entre w-72 e w-16.
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const PERFIL_BADGE = {
  recepcionista: 'bg-blue-100 text-blue-700',
  gestor: 'bg-emerald-100 text-emerald-700',
  admin: 'bg-violet-100 text-violet-700',
};

const PERFIL_LABEL = {
  recepcionista: 'Recepcionista',
  gestor: 'Gestor',
  admin: 'Administrador',
};

export default function SideNavGestor({ onFechar, retraida, onToggle }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { podeInstalar, instalar, jaInstalado } = usePWAInstall();

  // O destaque usa o trecho exclusivo de cada rota para acompanhar a navegação.
  const isActive = (path) =>
    pathname.includes(path)
      ? 'bg-primary/10 text-primary'
      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface';

  // Fecha apenas o drawer mobile. No desktop, o callback não altera a retração.
  const handleNavegar = () => {
    if (onFechar) onFechar();
  };

  const handleSair = () => {
    logout();
    navigate('/login-gestor');
  };

  // As iniciais usam no máximo os dois primeiros nomes e toleram sessão sem nome.
  const iniciais = (user?.nome || 'Usuário')
    .split(' ')
    .filter(Boolean)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className={`w-72 ${retraida ? 'lg:w-16' : 'lg:w-72'} bg-surface-container-lowest border-r border-surface-variant flex flex-col h-full overflow-hidden transition-all duration-300`}>
      {/* Cabeçalho mantém a versão completa no mobile mesmo com preferência retraída. */}
      <header className={`relative p-6 ${retraida ? 'lg:p-3 lg:justify-center' : ''} border-b border-surface-variant flex items-center justify-between min-h-[88px] lg:min-h-[72px]`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
            <span className="material-symbols-outlined text-on-primary text-xl">health_and_safety</span>
          </div>
          <div className={retraida ? 'lg:hidden' : ''}>
            <h1 className="text-base font-bold text-on-background leading-tight">Gestão Saúde</h1>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">UBS+</p>
          </div>
        </div>

        <button
          onClick={onFechar}
          aria-label="Fechar menu"
          className="lg:hidden w-8 h-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Toggle fica ancorado no canto inferior direito e não aparece no mobile. */}
        <button
          type="button"
          onClick={onToggle}
          title={retraida ? 'Expandir menu' : 'Retrair menu'}
          aria-label={retraida ? 'Expandir menu lateral' : 'Retrair menu lateral'}
          className="hidden lg:flex absolute -bottom-3 right-2 z-10 w-7 h-7 rounded-lg bg-surface-container-high items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-base">
            {retraida ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </header>

      {/* A área central rola sem deslocar o perfil e as ações do rodapé. */}
      <nav className="p-3 pt-4 flex-1 overflow-y-auto overflow-x-hidden">
        <NavItem
          to="/gestor/dashboard"
          icon="dashboard"
          label="Painel Principal"
          retraida={retraida}
          activeClass={isActive('dashboard')}
          onClick={handleNavegar}
        />

        <SectionLabel label="ATENDIMENTO" retraida={retraida} />
        <NavItem
          to="/gestor/pacientes"
          icon="people"
          label="Pacientes"
          retraida={retraida}
          activeClass={isActive('pacientes')}
          onClick={handleNavegar}
        />
        <NavItem
          to="/gestor/agendamentos"
          icon="calendar_month"
          label="Agendamentos"
          retraida={retraida}
          activeClass={isActive('agendamentos')}
          onClick={handleNavegar}
        />

        <SectionLabel label="FARMÁCIA" retraida={retraida} />
        <NavItem
          to="/gestor/medicamentos"
          icon="medication"
          label="Medicamentos"
          retraida={retraida}
          activeClass={isActive('medicamentos')}
          onClick={handleNavegar}
        />

        <SectionLabel label="COMUNICAÇÃO" retraida={retraida} />
        <NavItem
          to="/gestor/comunicados"
          icon="campaign"
          label="Comunicados"
          retraida={retraida}
          activeClass={isActive('comunicados')}
          onClick={handleNavegar}
        />

        {user?.perfil === 'admin' && (
          <>
            <SectionLabel label="ADMINISTRAÇÃO" retraida={retraida} />
            <NavItem
              to="/gestor/usuarios"
              icon="manage_accounts"
              label="Usuários"
              retraida={retraida}
              activeClass={isActive('usuarios')}
              onClick={handleNavegar}
            />
            {/* Relatórios é informativo: não possui Link, href ou ação de clique. */}
            <button
              type="button"
              disabled
              title="Relatórios"
              className={`w-full flex items-center gap-3 px-4 py-3 ${retraida ? 'lg:px-0 lg:justify-center' : ''} rounded-xl font-semibold text-sm text-on-surface-variant opacity-40 cursor-not-allowed`}
            >
              <span className="material-symbols-outlined text-xl flex-shrink-0">bar_chart_4_bars</span>
              <span className={retraida ? 'lg:hidden' : ''}>Relatórios</span>
              <span className={`${retraida ? 'lg:hidden' : ''} ml-auto text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold`}>
                Em breve
              </span>
            </button>
          </>
        )}
      </nav>

      {/* Identificação contextual permanece visível, mas compacta no desktop retraído. */}
      <div className={`mx-3 mb-2 p-3 ${retraida ? 'lg:mx-2 lg:p-2 lg:justify-center' : ''} rounded-xl bg-surface-container-low flex items-center gap-3`}>
        <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-extrabold flex items-center justify-center flex-shrink-0 text-sm">
          {iniciais}
        </div>
        <div className={`min-w-0 flex-1 ${retraida ? 'lg:hidden' : ''}`}>
          <p className="text-sm font-bold text-on-background truncate">{user?.nome || 'Usuário'}</p>
          <span className={`inline-flex mt-1 text-[9px] px-2 py-0.5 rounded-full font-bold ${PERFIL_BADGE[user?.perfil] || 'bg-gray-100 text-gray-600'}`}>
            {PERFIL_LABEL[user?.perfil] || user?.perfil || 'Equipe'}
          </span>
        </div>
      </div>

      <footer className="p-3 border-t border-surface-variant space-y-1">
        {podeInstalar && !jaInstalado && (
          <button
            onClick={instalar}
            title="Instalar aplicativo"
            className={`w-full flex items-center gap-3 px-4 py-2.5 ${retraida ? 'lg:px-0 lg:justify-center' : ''} rounded-xl text-sm font-medium text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-all`}
          >
            <span className="material-symbols-outlined text-xl flex-shrink-0">download</span>
            <span className={retraida ? 'lg:hidden' : ''}>Instalar aplicativo</span>
          </button>
        )}

        <button
          onClick={handleSair}
          title="Sair do Sistema"
          className={`w-full flex items-center gap-3 px-4 py-3 ${retraida ? 'lg:px-0 lg:justify-center' : ''} rounded-xl font-semibold text-sm text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-all`}
        >
          <span className="material-symbols-outlined text-xl flex-shrink-0">logout</span>
          <span className={retraida ? 'lg:hidden' : ''}>Sair do Sistema</span>
        </button>
      </footer>
    </aside>
  );
}

// Rótulo troca por separador apenas no desktop retraído; no mobile permanece legível.
function SectionLabel({ label, retraida }) {
  return (
    <>
      <p className={`px-4 pt-4 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant/50 select-none ${retraida ? 'lg:hidden' : ''}`}>
        {label}
      </p>
      <hr className={`${retraida ? 'hidden lg:block' : 'hidden'} mx-2 mt-3 mb-1 border-surface-variant`} />
    </>
  );
}

// Item reutilizável garante o mesmo tooltip, alinhamento e resposta mobile.
function NavItem({ to, icon, label, retraida, activeClass, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      title={label}
      className={`w-full flex items-center gap-3 px-4 py-3 ${retraida ? 'lg:px-0 lg:justify-center' : ''} rounded-xl font-semibold transition-all text-sm ${activeClass}`}
    >
      <span className="material-symbols-outlined text-xl flex-shrink-0">{icon}</span>
      <span className={retraida ? 'lg:hidden' : ''}>{label}</span>
    </Link>
  );
}
