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
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export default function BottomNavPaciente() {
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

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
    <nav className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-surface-variant px-4 py-2 flex justify-between items-center z-20">

      <Link to="/paciente/dashboard" className={`flex flex-col items-center gap-1 ${isActive('dashboard')}`}>
        <span className="material-symbols-outlined text-2xl">home</span>
        <span className="text-[10px] font-semibold">Início</span>
      </Link>

      <Link to="/paciente/medicamentos" className={`flex flex-col items-center gap-1 ${isActive('medicamentos')}`}>
        <span className="material-symbols-outlined text-2xl">medication</span>
        <span className="text-[10px] font-semibold">Medicamentos</span>
      </Link>

      {/* ── Botão de instalação PWA — centro do nav, destaque verde ── */}
      {/* Visível apenas quando o browser liberou o prompt e o app ainda não foi instalado */}
      {podeInstalar && !jaInstalado && (
        <button
          onClick={instalar}
          className="flex flex-col items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-2xl shadow-lg shadow-primary/30 -mt-4"
          title="Adicionar UBS+ à tela inicial"
        >
          <span className="material-symbols-outlined text-xl">download</span>
          <span className="text-[9px] font-bold tracking-wide">INSTALAR</span>
        </button>
      )}

      <Link to="/paciente/comunicados" className={`flex flex-col items-center gap-1 ${isActive('comunicados')}`}>
        <div className="relative">
          <span className="material-symbols-outlined text-2xl">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold">Avisos</span>
      </Link>

      <Link to="/paciente/agendamentos" className={`flex flex-col items-center gap-1 ${isActive('agendamentos')}`}>
        <span className="material-symbols-outlined text-2xl">calendar_month</span>
        <span className="text-[10px] font-semibold">Agenda</span>
      </Link>
    </nav>
  );
}
