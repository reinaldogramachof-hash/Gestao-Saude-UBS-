// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: DrawerPaciente
// FUNÇÃO: Menu lateral deslizante (hamburger drawer) do portal do paciente.
//         Desliza da esquerda para a direita quando aberto.
//         Exibe o nome do paciente, sua UBS de referência, os links de navegação,
//         botão de instalação PWA e botão de logout.
// PROPS:
//   - aberto: boolean — controla a visibilidade/transição do drawer
//   - onClose: function — callback para fechar o drawer
//   - unreadCount: number — quantidade de avisos não lidos para o badge
//   - pacienteNome: string — nome do paciente logado
//   - ubsNome: string — nome da UBS de referência do paciente
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAuth } from '../../contexts/AuthContext';

export default function DrawerPaciente({ aberto, onClose, unreadCount = 0, pacienteNome = 'Paciente', ubsNome = '—' }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { podeInstalar, instalar, jaInstalado } = usePWAInstall();

  // Trata logout fechando o drawer e encerrando a sessão
  const handleLogout = () => {
    onClose();
    logout();
    navigate('/');
  };

  // Helper para pintar de verde o menu ativo
  const isActive = (path) =>
    pathname.includes(path) ? 'text-primary bg-primary/10 font-bold' : 'text-on-surface-variant hover:bg-surface-container-low';

  return (
    <>
      {/* ── Overlay Escuro (Fundo semitransparente) ── */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ease-in-out ${
          aberto ? 'opacity-100 pointer-events-auto backdrop-blur-[2px]' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* ── Painel do Drawer Lateral ── */}
      <aside
        className={`fixed left-0 top-0 bottom-0 h-full w-64 bg-surface-container-lowest z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
          aberto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabeçalho: Dados do Usuário */}
        <header className="p-6 bg-primary text-on-primary flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl select-none">account_circle</span>
            <div className="overflow-hidden">
              <p className="font-extrabold text-sm truncate leading-tight" title={pacienteNome}>{pacienteNome}</p>
              <p className="text-white/70 text-[11px] font-semibold mt-0.5 flex items-center gap-0.5 truncate" title={ubsNome}>
                <span className="material-symbols-outlined text-xs">local_hospital</span>
                {ubsNome}
              </p>
            </div>
          </div>
        </header>

        {/* Links de Navegação */}
        <nav className="flex-1 py-4 overflow-y-auto px-3 space-y-1">
          <Link
            to="/paciente/dashboard"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 h-12 rounded-xl transition-colors text-sm ${isActive('dashboard')}`}
          >
            <span className="material-symbols-outlined text-xl">home</span>
            <span>Início</span>
          </Link>

          <Link
            to="/paciente/medicamentos"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 h-12 rounded-xl transition-colors text-sm ${isActive('medicamentos')}`}
          >
            <span className="material-symbols-outlined text-xl">medication</span>
            <span>Medicamentos</span>
          </Link>

          <Link
            to="/paciente/comunicados"
            onClick={onClose}
            className={`flex items-center justify-between px-4 h-12 rounded-xl transition-colors text-sm ${isActive('comunicados')}`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span>Avisos</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </Link>

          <Link
            to="/paciente/agendamentos"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 h-12 rounded-xl transition-colors text-sm ${isActive('agendamentos')}`}
          >
            <span className="material-symbols-outlined text-xl">calendar_month</span>
            <span>Agenda</span>
          </Link>

          <Link
            to="/paciente/perfil"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 h-12 rounded-xl transition-colors text-sm ${isActive('perfil')}`}
          >
            <span className="material-symbols-outlined text-xl">person</span>
            <span>Perfil</span>
          </Link>
        </nav>

        {/* Rodapé: Botões de Instalação PWA e Logout */}
        <footer className="p-4 border-t border-surface-variant space-y-2">
          {podeInstalar && !jaInstalado && (
            <button
              onClick={() => {
                onClose();
                instalar();
              }}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold h-11 rounded-xl shadow-md transition-colors"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span>INSTALAR APLICATIVO</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 h-11 text-on-surface-variant hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10 rounded-xl transition-all text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span>Sair</span>
          </button>
        </footer>
      </aside>
    </>
  );
}
