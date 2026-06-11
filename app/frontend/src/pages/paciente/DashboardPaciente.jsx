/**
 * PÁGINA: DashboardPaciente.jsx + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Tela principal do portal do paciente. Exibe o nome, UBS de referência
 *         e as solicitações ativas do paciente logado.
 *         Usa PacienteLayout para centralizar o conteúdo no desktop.
 *
 * API: GET /api/paciente/meus-dados
 *      GET /api/paciente/minhas-solicitacoes
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PacienteLayout from '../../components/paciente/PacienteLayout';
import { STATUS_LABELS, STATUS_CORES } from '../../utils/statusHelper';

export default function DashboardPaciente() {
  const [sols, setSols] = useState([]);
  const [paciente, setPaciente] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/paciente/meus-dados').then(r => setPaciente(r.data));
    api.get('/paciente/minhas-solicitacoes').then(r => setSols(r.data));
  }, []);

  return (
    <PacienteLayout>
      {/* ── Cabeçalho verde com nome e UBS ── */}
      <header className="bg-primary pt-12 pb-24 px-6 rounded-b-[2.5rem] relative overflow-hidden flex justify-between items-start">
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-semibold tracking-wide uppercase mb-1">Bem-vindo(a)</p>
          <h1 className="text-on-primary text-3xl font-extrabold">{paciente.nome || 'Carregando...'}</h1>
          <div className="flex items-center gap-2 mt-3 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
            <span className="material-symbols-outlined text-white text-[16px]">location_on</span>
            <span className="text-white text-xs font-semibold">{paciente.ubs?.nome || '...'}</span>
          </div>
        </div>
      </header>

      {/* ── Conteúdo principal ── */}
      <main className="px-6 -mt-16 relative z-20 space-y-6">
        <h2 className="text-xl font-extrabold text-on-surface">Minhas Solicitações Ativas</h2>
        <div className="space-y-4">
          {sols.map(sol => (
            <div key={sol.id} className={`bg-white p-5 rounded-2xl shadow-sm border ${sol.prioridade === 'urgente' ? 'border-red-300' : 'border-surface-variant'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined">{sol.tipo === 'exame' ? 'bloodtype' : 'event_note'}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface leading-tight">{sol.descricao_paciente}</h3>
                  </div>
                </div>
              </div>
              {/* O status técnico nunca é exibido diretamente ao paciente. */}
              <div className={`rounded-xl p-3 mb-4 ${STATUS_CORES[sol.status] || 'bg-surface-container-low text-on-surface'}`}>
                <p className="text-sm font-semibold">
                  {STATUS_LABELS[sol.status] || 'Status em atualização'}
                </p>
                {sol.data_prevista && (
                  <p className="text-xs opacity-80 mt-1">Previsão: {sol.data_prevista}</p>
                )}
              </div>
              <button
                onClick={() => navigate(`/paciente/solicitacao/${sol.id}`)}
                className="w-full text-center py-2.5 bg-primary/10 text-primary font-bold rounded-xl text-sm hover:bg-primary/20 transition-colors"
              >
                Ver Detalhes
              </button>
            </div>
          ))}
          {sols.length === 0 && (
            <p className="text-center text-on-surface-variant p-6">Nenhuma solicitação ativa.</p>
          )}
        </div>
      </main>
    </PacienteLayout>
  );
}
