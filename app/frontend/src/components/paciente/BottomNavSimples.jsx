// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: BottomNavSimples
// FUNÇÃO: Barra de navegação inferior fixa com 3 ações de acesso rápido.
//         Fica sempre visível no portal do paciente.
//         O botão central "+" é um FAB (Floating Action Button) estilizado
//         em verde, ligeiramente elevado acima da barra.
// PROPS:
//   - (sem props externas — usa useNavigate internamente)
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNavSimples() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Helpers para identificar rotas ativas
  const isInicioAtivo = pathname.includes('/paciente/dashboard');
  const isAgendaAtivo = pathname.includes('/paciente/agendamentos');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-surface-variant flex items-center justify-around z-30 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', minHeight: '64px' }}
    >
      {/* ── Botão Lateral Esquerdo: Início ── */}
      <button
        onClick={() => navigate('/paciente/dashboard')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
          isInicioAtivo ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-2xl">home</span>
        <span className="text-[10px] font-medium">Início</span>
      </button>

      {/* ── Botão Central FAB: Agendar (+) ── */}
      <div className="flex-1 flex justify-center relative h-full">
        {/* Contorno circular decorativo que integra visualmente o FAB elevado à barra */}
        <div className="absolute -top-12 w-[4.5rem] h-[4.5rem] rounded-full bg-surface-container-lowest border-t border-surface-variant z-20 shadow-[0_-3px_6px_rgba(0,0,0,0.03)]" />
        
        {/* FAB real */}
        <button
          onClick={() => navigate('/paciente/agendamentos')}
          className="absolute -top-10 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/40 flex items-center justify-center active:scale-95 transition-transform select-none z-30"
          aria-label="Agendar atendimento"
        >
          <span className="material-symbols-outlined text-3xl font-bold">add</span>
        </button>
      </div>

      {/* ── Botão Lateral Direito: Agenda ── */}
      <button
        onClick={() => navigate('/paciente/agendamentos')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
          isAgendaAtivo ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-2xl">calendar_month</span>
        <span className="text-[10px] font-medium">Agenda</span>
      </button>
    </nav>
  );
}
