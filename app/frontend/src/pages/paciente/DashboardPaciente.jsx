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
import { STATUS_LABELS, STATUS_CORES, formatarDataBR } from '../../utils/statusHelper';

export default function DashboardPaciente() {
  const [sols, setSols] = useState([]);
  const [paciente, setPaciente] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const navigate = useNavigate();

  // Função separada para permitir retry em caso de erro
  const fetchDados = () => {
    setLoading(true);
    setErro(false);
    Promise.all([
      api.get('/paciente/meus-dados'),
      api.get('/paciente/minhas-solicitacoes'),
    ])
      .then(([rDados, rSols]) => {
        setPaciente(rDados.data);
        setSols(rSols.data);
      })
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDados(); }, []);

  // Exibe esqueleto animado enquanto os dados carregam
  if (loading) {
    return (
      <PacienteLayout>
        <div className="animate-pulse">
          <div className="bg-primary pt-12 pb-24 px-6 rounded-b-[2.5rem] md:pt-8 md:pb-12 md:rounded-b-none">
            <div className="h-4 w-24 bg-white/30 rounded mb-3"></div>
            <div className="h-8 w-48 bg-white/40 rounded"></div>
          </div>
          <div className="px-6 -mt-16 md:-mt-8 relative z-20 space-y-4 max-w-5xl mx-auto w-full">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-variant">
                <div className="h-5 w-3/4 bg-surface-container-high rounded mb-3"></div>
                <div className="h-12 bg-surface-container-high rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </PacienteLayout>
    );
  }

  // Exibe mensagem amigável se as APIs falharem — com botão de nova tentativa
  if (erro) {
    return (
      <PacienteLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">
            wifi_off
          </span>
          <p className="font-bold text-on-surface text-lg">
            Não conseguimos carregar seus dados
          </p>
          <p className="text-sm text-on-surface-variant">
            Verifique sua conexão e tente novamente.
          </p>
          <button
            onClick={fetchDados}
            className="mt-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </PacienteLayout>
    );
  }

  return (
    <PacienteLayout>
      {/* ── Cabeçalho verde com nome e UBS ── */}
      <header className="bg-primary pt-12 pb-24 px-6 rounded-b-[2.5rem] md:pt-8 md:pb-12 md:rounded-b-none relative overflow-hidden flex justify-center">
        <div className="relative z-10 w-full max-w-5xl flex justify-between items-start">
          <div>
          <p className="text-white/70 text-sm font-semibold tracking-wide uppercase mb-1">Bem-vindo(a)</p>
          <h1 className="text-on-primary text-3xl font-extrabold">{paciente.nome || 'Carregando...'}</h1>
          <div className="flex items-center gap-2 mt-3 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
            <span className="material-symbols-outlined text-white text-[16px]">location_on</span>
            <span className="text-white text-xs font-semibold">{paciente.ubs?.nome || '...'}</span>
          </div>
          </div>
        </div>
      </header>

      {/* ── Conteúdo principal ── */}
      <main className="px-6 -mt-16 md:-mt-8 md:pb-12 relative z-20 space-y-6 pb-28 max-w-5xl mx-auto w-full">
        {/* Linha de título com atalho para histórico completo */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-extrabold text-on-surface">Minhas Solicitações Ativas</h2>
          <button
            onClick={() => navigate('/paciente/solicitacoes')}
            className="text-primary text-sm font-semibold flex items-center gap-0.5 hover:underline"
          >
            Ver todas
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
        <div className="space-y-4">
          {sols.map(sol => (
            <div key={sol.id} className={`bg-surface-container-lowest p-5 rounded-2xl shadow-sm border ${sol.prioridade === 'urgente' ? 'border-red-300' : 'border-surface-variant'}`}>
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
                  <p className="text-xs opacity-80 mt-1">Previsão: {formatarDataBR(sol.data_prevista)}</p>
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
