/**
 * PÁGINA: DetalheSolicitacao.jsx + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Detalhe de uma solicitação do paciente com histórico de status.
 *         Timeline vertical mostra a evolução do processo.
 *         Usa PacienteLayout para centralização no desktop.
 *
 * API: GET /api/paciente/solicitacao/:id
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PacienteLayout from '../../components/paciente/PacienteLayout';
import { STATUS_LABELS, STATUS_CORES, formatarDataBR } from '../../utils/statusHelper';

export default function DetalheSolicitacao() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sol, setSol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const carregar = () => {
    setLoading(true);
    setErro(false);
    api.get(`/paciente/solicitacao/${id}`)
      .then(r => setSol(r.data))
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, [id]);

  // Skeleton de carregamento enquanto aguarda a API
  if (loading) {
    return (
      <PacienteLayout semNav>
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-8 bg-surface-container-high rounded w-3/4"></div>
          <div className="h-4 bg-surface-container-high rounded w-1/2"></div>
          <div className="h-40 bg-surface-container-high rounded-2xl mt-8"></div>
        </div>
      </PacienteLayout>
    );
  }

  // Estado de erro com botão de nova tentativa — evita tela travada em branco
  if (erro || !sol) {
    return (
      <PacienteLayout semNav>
        <div className="flex flex-col items-center justify-center h-64 gap-4 px-6 text-center">
          <span className="material-symbols-outlined text-5xl text-red-400">error_outline</span>
          <p className="text-on-surface-variant font-medium">Não foi possível carregar os detalhes.</p>
          <button onClick={carregar} className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm">
            Tentar novamente
          </button>
        </div>
      </PacienteLayout>
    );
  }

  return (
    <PacienteLayout semNav>
      {/* ── Header com botão de voltar ── */}
      <header className="bg-surface-container-lowest px-4 py-5 border-b border-surface-variant flex items-center gap-4 sticky top-0 z-30">
        <button onClick={() => nav(-1)} className="w-10 h-10 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface flex-shrink-0">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-on-surface">Detalhes do Pedido</h1>
      </header>

      <main className="px-6 py-6 pb-10">
        {/* O detalhe usa apenas o texto preparado para o paciente. */}
        <h2 className="text-2xl font-bold text-on-surface">{sol.descricao_paciente}</h2>
        {sol.observacao_paciente && (
          <p className="text-sm text-on-surface-variant mt-2">{sol.observacao_paciente}</p>
        )}

        {/* Local de execução — exibido quando o serviço é fora da UBS do paciente */}
        {sol.local_executor && (
          <div className="flex items-center gap-2 mt-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-blue-500 text-lg">location_on</span>
            <p className="text-sm text-blue-700 font-medium">
              Este atendimento será realizado em: <strong>{sol.local_executor}</strong>
            </p>
          </div>
        )}

        {/* ── Badges de tipo, prioridade e status atual ── */}
        <div className="flex gap-2 flex-wrap mt-4 mb-8">
          {sol.tipo && (
            <span className="text-xs font-bold px-3 py-1.5 bg-surface-container-high text-on-surface-variant rounded-lg capitalize">
              {sol.tipo}
            </span>
          )}
          {sol.prioridade && (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg capitalize ${sol.prioridade === 'urgente' ? 'bg-red-100 text-red-600' : sol.prioridade === 'prioritario' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
              {sol.prioridade}
            </span>
          )}
          {sol.status && (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${STATUS_CORES[sol.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[sol.status] || 'Status em atualização'}
            </span>
          )}
        </div>

        {/* ── Timeline de histórico de status ── */}
        <div className="relative border-l-2 border-surface-variant ml-3 space-y-8">
          {sol.historico?.length > 0 ? (
            sol.historico.map(h => (
              <div key={h.id} className="relative pl-6">
                {/* Marcador da timeline */}
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-surface-container-lowest bg-primary"></div>
                <p className="text-xs font-bold text-primary mb-1">
                  {formatarDataBR(h.alterado_em)}
                </p>
                <div className={`p-4 rounded-xl rounded-tl-none ${STATUS_CORES[h.status_novo] || 'bg-surface-container-low text-on-surface'}`}>
                  <h4 className="font-bold text-sm mb-1">
                    {STATUS_LABELS[h.status_novo] || 'Status em atualização'}
                  </h4>
                  {h.observacao && (
                    <p className="text-xs opacity-80 leading-relaxed">{h.observacao}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="pl-6">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-surface-container-lowest bg-surface-variant"></div>
              <p className="text-sm text-on-surface-variant">Ainda não há histórico para esta solicitação.</p>
            </div>
          )}
        </div>
      </main>
    </PacienteLayout>
  );
}
