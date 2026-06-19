// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: BottomNavSimples
// FUNÇÃO: Barra de navegação inferior fixa com 3 ações de acesso rápido.
//         Fica sempre visível no portal do paciente.
//         O botão central "+" é um FAB (Floating Action Button) estilizado
//         em verde, ligeiramente elevado acima da barra.
// PROPS:
//   - (sem props externas — usa useNavigate internamente)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIAS_FAB — opções de intake do paciente no action sheet do botão "+"
// Cada categoria sugere um motivo inicial que será pré-preenchido no modal
// de reserva de agendamento, ajudando o gestor a se preparar para o atendimento.
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIAS_FAB = [
  {
    id: 'consulta',
    titulo: 'Consulta médica',
    subtitulo: 'Preciso ver um médico',
    icone: 'medical_services',
    cor: 'text-primary',
    motivo: 'Gostaria de agendar uma consulta médica. ',
  },
  {
    id: 'exame',
    titulo: 'Exame ou resultado',
    subtitulo: 'Dúvida sobre exame',
    icone: 'biotech',
    cor: 'text-blue-500',
    motivo: 'Tenho uma dúvida sobre meu exame ou resultado. ',
  },
  {
    id: 'medicamento',
    titulo: 'Medicamento',
    subtitulo: 'Retirada ou dúvida',
    icone: 'medication',
    cor: 'text-emerald-600',
    motivo: 'Preciso de informações sobre retirada de medicamento. ',
  },
  {
    id: 'outro',
    titulo: 'Outro assunto',
    subtitulo: 'Outro motivo',
    icone: 'help_outline',
    cor: 'text-on-surface-variant',
    motivo: '',
  },
];

export default function BottomNavSimples() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Controla a visibilidade do action sheet do FAB
  const [fabAberto, setFabAberto] = useState(false);

  // Helpers para identificar rotas ativas
  const isInicioAtivo = pathname.includes('/paciente/dashboard');
  const isAgendaAtivo = pathname.includes('/paciente/agendamentos');

  // Ao selecionar uma categoria, fecha o sheet e navega para Agendamentos
  // passando o motivo sugerido como state do React Router.
  // A página de Agendamentos lê este state e abre o modal de reserva pré-preenchido.
  const handleCategoria = (cat) => {
    setFabAberto(false);
    navigate('/paciente/agendamentos', {
      state: { motivoSugerido: cat.motivo, abrirModal: true },
    });
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-surface-variant flex items-center justify-around z-30 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'var(--safe-bottom)', minHeight: 'var(--bottom-nav-h)' }}
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
            onClick={() => setFabAberto(prev => !prev)}
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

      {/* ── FAB Action Sheet ── */}
      {/* Overlay escuro semitransparente que fecha o sheet ao clicar fora */}
      {fabAberto && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setFabAberto(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-surface-container-lowest rounded-t-[2rem] shadow-2xl pb-safe">
            {/* Handle visual de arraste */}
            <div className="w-10 h-1 bg-surface-variant rounded-full mx-auto mt-3 mb-1" />

            {/* Título do sheet */}
            <div className="px-6 pt-3 pb-4">
              <h3 className="text-base font-extrabold text-on-background">O que você precisa?</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Escolha o assunto para agendar um atendimento</p>
            </div>

            {/* Grid de categorias */}
            <div className="px-4 pb-6 grid grid-cols-2 gap-3">
              {CATEGORIAS_FAB.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoria(cat)}
                  className="flex flex-col items-start gap-2 p-4 bg-surface-container rounded-2xl border border-surface-variant active:scale-[0.97] transition-transform text-left"
                >
                  <span className={`material-symbols-outlined text-2xl ${cat.cor}`}>{cat.icone}</span>
                  <div>
                    <p className="text-sm font-bold text-on-background leading-tight">{cat.titulo}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">{cat.subtitulo}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
