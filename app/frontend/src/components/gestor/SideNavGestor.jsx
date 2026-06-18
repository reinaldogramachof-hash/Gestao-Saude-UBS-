import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import api from '../../services/api';

const PERFIL_BADGE = {
  recepcionista: 'bg-blue-100 text-blue-700',
  gestor:        'bg-emerald-100 text-emerald-700',
  admin:         'bg-violet-100 text-violet-700',
  medico:        'bg-cyan-100 text-cyan-700',
};

const PERFIL_LABEL = {
  recepcionista: 'Recepcionista',
  gestor:        'Gestor',
  admin:         'Administrador',
  medico:        'Médico',
};

// Mapa de controle de acesso por perfil.
// Cada chave representa a "seção" de rota. O valor é o array de perfis
// que têm permissão de ver o item no menu.
const PERFIS_ACESSO = {
  dashboard:         ['recepcionista', 'gestor', 'admin', 'medico'],
  pacientes:         ['recepcionista', 'gestor', 'admin'],
  medico:            ['admin', 'medico'],
  agendamentos:      ['recepcionista', 'gestor', 'admin'],
  regulacao:         ['gestor', 'admin'],
  transporte:        ['gestor', 'admin'],
  'servico-social':  ['gestor', 'admin'],
  vigilancia:        ['gestor', 'admin'],
  medicamentos:      ['recepcionista', 'gestor', 'admin'],
  comunicados:       ['recepcionista', 'gestor', 'admin'],
};

export default function SideNavGestor({ onFechar, retraida, onToggle }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { podeInstalar, instalar, jaInstalado } = usePWAInstall();

  // Estado para contagem de cadastros pendentes
  const [pendentes, setPendentes] = useState(0);

  // Polling global para cadastros pendentes na Sidebar
  useEffect(() => {
    let montado = true;
    const fetchPendentes = async () => {
      try {
        const res = await api.get('/gestor/dashboard/pendentes');
        if (montado) setPendentes(res.data.pendentes_aprovacao);
      } catch (err) {
        // Ignora erros silenciosamente para não poluir console
      }
    };

    fetchPendentes();
    const intervalo = setInterval(fetchPendentes, 60000); // Consulta a cada 1 min
    return () => {
      montado = false;
      clearInterval(intervalo);
    };
  }, []);

  const isActive = (path) =>
    pathname.includes(path)
      ? 'bg-primary/10 text-primary'
      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface';

  const handleNavegar = () => {
    if (onFechar) onFechar();
  };

  const handleSair = () => {
    logout();
    navigate('/login-gestor');
  };

  const iniciais = (user?.nome || 'Usuário')
    .split(' ')
    .filter(Boolean)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Helper: retorna true se o perfil do usuário logado tem acesso à seção.
  // Fallback para false se o perfil não estiver mapeado (seguro por padrão).
  const pode = (secao) =>
    PERFIS_ACESSO[secao]?.includes(user?.perfil) ?? false;

  return (
    <aside className={`w-72 ${retraida ? 'lg:w-16' : 'lg:w-72'} bg-surface-container-lowest border-r border-surface-variant flex flex-col h-full transition-all duration-300 relative z-20`}>
      {/* Cabeçalho */}
      <header className={`p-6 ${retraida ? 'lg:p-3 lg:justify-center' : ''} border-b border-surface-variant flex items-center justify-between min-h-[88px] lg:min-h-[72px] shrink-0`}>
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
      </header>

      {/* Navegação */}
      {/* Removemos overflow-hidden no aside e mantemos overflow-y-auto no nav. 
          O tooltip pode gerar um pequeno scroll horizontal no nav, mas a estética premium compensa. */}
      <nav className="p-3 pt-4 flex-1 overflow-y-auto overflow-x-visible no-scrollbar">
        {/* Item sempre visível para todos os perfis */}
        <NavItem
          to="/gestor/dashboard"
          icon="dashboard"
          label="Painel Principal"
          retraida={retraida}
          activeClass={isActive('dashboard')}
          onClick={handleNavegar}
        />

        {/* ───────────────────────────────────────────────────────────────────
            SEÇÃO: ATENDIMENTO
            Visível se o perfil tiver acesso a Pacientes, Painel Médico ou Agendamentos
            ─────────────────────────────────────────────────────────────────── */}
        {(pode('pacientes') || pode('medico') || pode('agendamentos')) && (
          <SectionLabel label="ATENDIMENTO" retraida={retraida} />
        )}
        
        {/* Pacientes: apenas para recepcionista, gestor e admin */}
        {pode('pacientes') && (
          <NavItem
            to="/gestor/pacientes"
            icon="people"
            label="Pacientes"
            retraida={retraida}
            activeClass={isActive('pacientes')}
            onClick={handleNavegar}
            badgeCount={pendentes}
          />
        )}
        
        {/* Painel Médico: consulta clínica exclusiva para médicos e admin */}
        {pode('medico') && (
          <NavItem
            to="/gestor/medico"
            icon="stethoscope"
            label="Painel Médico"
            retraida={retraida}
            activeClass={isActive('medico')}
            onClick={handleNavegar}
          />
        )}
        
        {/* Agendamentos: apenas para recepcionista, gestor e admin */}
        {pode('agendamentos') && (
          <NavItem
            to="/gestor/agendamentos"
            icon="calendar_month"
            label="Agendamentos"
            retraida={retraida}
            activeClass={isActive('agendamentos')}
            onClick={handleNavegar}
          />
        )}

        {/* ───────────────────────────────────────────────────────────────────
            SEÇÃO: REDE EXTERNA E APOIO
            Visível se o perfil tiver acesso a Regulação, Transporte, Serviço Social ou Vigilância
            ─────────────────────────────────────────────────────────────────── */}
        {(pode('regulacao') || pode('transporte') || pode('servico-social') || pode('vigilancia')) && (
          <SectionLabel label="REDE EXTERNA E APOIO" retraida={retraida} />
        )}
        
        {/* Regulação: apenas para gestores e admins */}
        {pode('regulacao') && (
          <NavItem
            to="/gestor/regulacao"
            icon="account_tree"
            label="Regulação"
            retraida={retraida}
            activeClass={isActive('regulacao')}
            onClick={handleNavegar}
          />
        )}
        
        {/* Transporte Sanitário: apenas para gestores e admins */}
        {pode('transporte') && (
          <NavItem
            to="/gestor/transporte"
            icon="directions_bus"
            label="Transporte Sanitário"
            retraida={retraida}
            activeClass={isActive('transporte')}
            onClick={handleNavegar}
          />
        )}
        
        {/* Serviço Social: apenas para gestores e admins */}
        {pode('servico-social') && (
          <NavItem
            to="/gestor/servico-social"
            icon="diversity_1"
            label="Serviço Social"
            retraida={retraida}
            activeClass={isActive('servico-social')}
            onClick={handleNavegar}
          />
        )}
        
        {/* Vigilância e Surtos: apenas para gestores e admins */}
        {pode('vigilancia') && (
          <NavItem
            to="/gestor/vigilancia"
            icon="coronavirus"
            label="Vigilância e Surtos"
            retraida={retraida}
            activeClass={isActive('vigilancia')}
            onClick={handleNavegar}
          />
        )}

        {/* ───────────────────────────────────────────────────────────────────
            SEÇÃO: FARMÁCIA
            Visível se o perfil tiver acesso a Medicamentos
            ─────────────────────────────────────────────────────────────────── */}
        {pode('medicamentos') && (
          <>
            <SectionLabel label="FARMÁCIA" retraida={retraida} />
            <NavItem
              to="/gestor/medicamentos"
              icon="medication"
              label="Medicamentos"
              retraida={retraida}
              activeClass={isActive('medicamentos')}
              onClick={handleNavegar}
            />
          </>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            SEÇÃO: COMUNICAÇÃO
            Visível se o perfil tiver acesso a Comunicados
            ─────────────────────────────────────────────────────────────────── */}
        {pode('comunicados') && (
          <>
            <SectionLabel label="COMUNICAÇÃO" retraida={retraida} />
            <NavItem
              to="/gestor/comunicados"
              icon="campaign"
              label="Comunicados"
              retraida={retraida}
              activeClass={isActive('comunicados')}
              onClick={handleNavegar}
            />
          </>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            SEÇÃO: ADMINISTRAÇÃO
            Visível apenas para administradores do sistema.
            Mantém a lógica intacta com user?.perfil === 'admin' conforme exigido.
            ─────────────────────────────────────────────────────────────────── */}
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
            {/* Relatórios é informativo e visualmente distinto (inativo) */}
            <div className={`group relative w-full flex items-center gap-3 px-4 py-3 ${retraida ? 'lg:px-0 lg:justify-center opacity-50' : 'opacity-60'} rounded-xl font-semibold text-sm text-on-surface-variant cursor-not-allowed`}>
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">bar_chart_4_bars</span>
                {retraida && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-100 text-amber-700 rounded-full border-2 border-surface-container-lowest hidden lg:flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px]">lock</span>
                  </span>
                )}
              </div>
              <span className={`flex-1 flex items-center justify-between ${retraida ? 'lg:hidden' : ''}`}>
                <span>Relatórios</span>
                <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                  Em breve
                </span>
              </span>

              {/* Custom Tooltip para Relatórios */}
              {retraida && (
                <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg whitespace-nowrap z-[100] pointer-events-none shadow-xl items-center gap-2 border border-gray-700">
                  Relatórios
                  <span className="bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                    Em breve
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      {/* Identificação Contextual */}
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

      {/* Footer com Toggle integrado */}
      <footer className="p-3 border-t border-surface-variant space-y-1 relative">
        {podeInstalar && !jaInstalado && (
          <button
            onClick={instalar}
            className={`group relative w-full flex items-center gap-3 px-4 py-2.5 ${retraida ? 'lg:px-0 lg:justify-center' : ''} rounded-xl text-sm font-medium text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-all`}
          >
            <span className="material-symbols-outlined text-xl flex-shrink-0">download</span>
            <span className={retraida ? 'lg:hidden' : ''}>Instalar aplicativo</span>
            {retraida && (
              <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg whitespace-nowrap z-[100] pointer-events-none shadow-xl">
                Instalar aplicativo
              </div>
            )}
          </button>
        )}

        <button
          onClick={handleSair}
          className={`group relative w-full flex items-center gap-3 px-4 py-3 ${retraida ? 'lg:px-0 lg:justify-center' : ''} rounded-xl font-semibold text-sm text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-all`}
        >
          <span className="material-symbols-outlined text-xl flex-shrink-0">logout</span>
          <span className={retraida ? 'lg:hidden' : ''}>Sair do Sistema</span>
          {retraida && (
            <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-2 bg-gray-900 text-red-100 text-xs font-bold rounded-lg whitespace-nowrap z-[100] pointer-events-none shadow-xl">
              Sair do Sistema
            </div>
          )}
        </button>

        {/* Botão de Expandir/Retrair agora ancorado logicamente no footer */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={retraida ? 'Expandir menu lateral' : 'Retrair menu lateral'}
          className={`hidden lg:flex group relative mt-2 w-full items-center ${retraida ? 'justify-center' : 'justify-start px-4'} py-3 rounded-xl font-semibold text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors`}
        >
          <span className="material-symbols-outlined text-xl flex-shrink-0">
            {retraida ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
          </span>
          <span className={retraida ? 'hidden' : 'ml-3'}>Recolher menu</span>
          {retraida && (
            <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg whitespace-nowrap z-[100] pointer-events-none shadow-xl">
              Expandir menu
            </div>
          )}
        </button>
      </footer>
    </aside>
  );
}

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

function NavItem({ to, icon, label, retraida, activeClass, onClick, badgeCount }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group relative w-full flex items-center gap-3 px-4 py-3 ${retraida ? 'lg:px-0 lg:justify-center' : ''} rounded-xl font-semibold transition-all text-sm ${activeClass}`}
    >
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <span className="material-symbols-outlined text-xl">{icon}</span>
        {/* Bolinha de notificação sobre o ícone (quando retraído) */}
        {retraida && badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-surface-container-lowest hidden lg:block shadow-sm" />
        )}
      </div>

      <span className={`flex-1 flex items-center justify-between ${retraida ? 'lg:hidden' : ''}`}>
        <span>{label}</span>
        {/* Pílula com o número de pendências (quando expandido) */}
        {badgeCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </span>

      {/* Tooltip Customizado Flutuante (substitui o 'title' nativo) */}
      {retraida && (
        <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg whitespace-nowrap z-[100] pointer-events-none shadow-xl items-center gap-2 border border-gray-700">
          {label}
          {badgeCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
