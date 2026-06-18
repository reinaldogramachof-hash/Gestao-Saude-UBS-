/**
 * COMPONENTE: BottomNavPaciente.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Barra de navegação inferior do portal do paciente.
 *         Agora usa position: absolute (ao invés de fixed) para se ancorar
 *         ao container pai do PacienteLayout (que tem position: relative).
 *         Isso garante que o nav fique na base do card no desktop sem cobrir
 *         outros elementos da tela.
 *
 * BOTÃO PWA:
 *   Quando o browser libera o prompt de instalação (beforeinstallprompt),
 *   aparece um botão "Instalar" em destaque verde no centro do nav.
 *   Suporta Android e iOS (via instruções manuais quando não há prompt nativo).
 *
 * ROTAS:
 *   - Início       → /paciente/dashboard
 *   - Medicamentos → /paciente/medicamentos
 *   - Avisos       → /paciente/comunicados
 *   - Agenda       → /paciente/agendamentos
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useAuth } from '../../contexts/AuthContext';

export default function BottomNavPaciente() {
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Encerra a sessão do paciente e redireciona para a tela inicial
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Hook que detecta se o app pode ser instalado como PWA
  const { podeInstalar, instalar, jaInstalado } = usePWAInstall();

  useEffect(() => {
    // Busca comunicados toda vez que a rota muda para manter o badge atualizado
    api.get('/paciente/comunicados')
      .then(r => {
        const unread = r.data.filter(c => !c.lido).length;
        setUnreadCount(unread);
      })
      .catch(() => {});
  }, [pathname]);

  // Aplica cor primária ao link da rota ativa
  const isActive = (path) =>
    pathname.includes(path) ? 'text-primary' : 'text-on-surface-variant';

  return (
    /*
      absolute ao invés de fixed: ancora à base do container do PacienteLayout.
      No mobile (tela cheia): comportamento idêntico ao fixed.
      No desktop (card centralizado): nav fica na base do card, não da tela inteira.
    */
    <nav className="flex-shrink-0 bg-surface-container-lowest border-t border-surface-variant px-4 py-2 flex justify-between items-center z-20 md:order-first md:border-t-0 md:border-b md:px-8 md:py-3 md:justify-start md:gap-8">
      
      {/* Logo no Desktop (Opcional, melhora o visual de Top Bar) */}
      <div className="hidden md:flex items-center gap-2 mr-4 text-primary">
         <span className="material-symbols-outlined text-3xl">health_and_safety</span>
         <span className="font-extrabold text-lg tracking-tight">UBS+</span>
      </div>

      <Link to="/paciente/dashboard" className={`flex flex-col items-center gap-1 ${isActive('dashboard')} md:flex-row md:gap-2`}>
        <span className="material-symbols-outlined text-2xl md:text-[20px]">home</span>
        <span className="text-[10px] font-semibold md:text-[14px]">Início</span>
      </Link>

      <Link to="/paciente/medicamentos" className={`flex flex-col items-center gap-1 ${isActive('medicamentos')} md:flex-row md:gap-2`}>
        <span className="material-symbols-outlined text-2xl md:text-[20px]">medication</span>
        <span className="text-[10px] font-semibold md:text-[14px]">Medicamentos</span>
      </Link>

      {podeInstalar && !jaInstalado && (
        <button
          onClick={instalar}
          className="flex flex-col items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-2xl shadow-lg shadow-primary/30 -mt-4 md:mt-0 md:flex-row md:gap-2 md:rounded-full md:px-4 md:shadow-none"
          title="Adicionar UBS+ à tela inicial"
        >
          <span className="material-symbols-outlined text-xl md:text-[20px]">download</span>
          <span className="text-[9px] font-bold tracking-wide md:text-[14px]">INSTALAR</span>
        </button>
      )}

      <Link to="/paciente/comunicados" className={`flex flex-col items-center gap-1 ${isActive('comunicados')} md:flex-row md:gap-2`}>
        <div className="relative">
          <span className="material-symbols-outlined text-2xl md:text-[20px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full md:w-5 md:h-5 md:-top-2 md:-right-3 md:text-xs">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold md:text-[14px]">Avisos</span>
      </Link>

      <Link to="/paciente/agendamentos" className={`flex flex-col items-center gap-1 ${isActive('agendamentos')} md:flex-row md:gap-2`}>
        <span className="material-symbols-outlined text-2xl md:text-[20px]">calendar_month</span>
        <span className="text-[10px] font-semibold md:text-[14px]">Agenda</span>
      </Link>

      {/* Botão de logout empurrado para a direita no desktop */}
      <button
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-red-500 transition-colors md:ml-auto md:flex-row md:gap-2"
        aria-label="Sair da conta"
      >
        <span className="material-symbols-outlined text-2xl md:text-[20px]">logout</span>
        <span className="text-[10px] font-semibold md:text-[14px]">Sair</span>
      </button>
    </nav>
  );
}
