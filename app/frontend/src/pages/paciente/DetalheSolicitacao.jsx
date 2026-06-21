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
        <h2 className="text-2xl font-bold text-on-surface break-words">{sol.descricao_paciente}</h2>
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

        {/* ── Seção de Encaminhamento Externo (se houver agendamento) ── */}
        {sol.encaminhamento && (sol.encaminhamento.data_agendamento || sol.encaminhamento.data_procedimento_unidade) && (
          <div className="mb-8 bg-surface-container-low border border-surface-variant rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-on-background uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">share_location</span>
              Encaminhamento Externo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Unidade Destino</p>
                <p className="font-bold text-on-background">{sol.encaminhamento.destino}</p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Data e Horário</p>
                <p className="font-bold text-on-background">
                  {formatarDataBR(sol.encaminhamento.data_agendamento || sol.encaminhamento.data_procedimento_unidade)}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold mt-1 ${
                  sol.encaminhamento.status === 'AGUARDANDO_CONFIRMACAO' ? 'bg-blue-50 text-blue-700' :
                  sol.encaminhamento.status === 'CONFIRMADO_PACIENTE' ? 'bg-emerald-50 text-emerald-700' :
                  sol.encaminhamento.status === 'RETORNO_UBS' ? 'bg-gray-100 text-gray-700' :
                  'bg-surface-container-high text-on-surface'
                }`}>
                  {sol.encaminhamento.status === 'AGUARDANDO_CONFIRMACAO' ? 'Aguardando sua confirmação' :
                   sol.encaminhamento.status === 'CONFIRMADO_PACIENTE' ? 'Presença confirmada' :
                   sol.encaminhamento.status === 'RETORNO_UBS' ? 'Procedimento concluído' :
                   sol.encaminhamento.status}
                </span>
              </div>

              {sol.encaminhamento.status === 'RETORNO_UBS' && sol.encaminhamento.conduta && (
                <div className="md:col-span-2 mt-2 p-3 bg-white rounded-xl border border-surface-variant">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Resultado / Conduta</p>
                  <p className="text-sm text-on-background font-medium">{sol.encaminhamento.conduta}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Timeline de histórico de status ── */}
        <div className="relative ml-2 space-y-8">
          {/* Linha vertical centralizada em ml-2 (8px), dot com w-4 (16px) fica perfeitamente centrado */}
          <div className="absolute top-2 bottom-0 left-[7px] w-[2px] bg-surface-variant"></div>

          {sol.historico?.length > 0 ? (
            sol.historico.map(h => (
              <div key={h.id} className="relative pl-8">
                {/* Marcador da timeline */}
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-4 border-surface-container-lowest bg-primary z-10"></div>
                <p className="text-xs font-bold text-primary mb-1">
                  {formatarDataBR(h.alterado_em)}
                </p>
                <div className={`p-4 rounded-xl ${STATUS_CORES[h.status_novo] || 'bg-surface-container-low text-on-surface'}`}>
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
            <div className="relative pl-8">
              <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-4 border-surface-container-lowest bg-surface-variant z-10"></div>
              <p className="text-sm text-on-surface-variant">Ainda não há histórico para esta solicitação.</p>
            </div>
          )}
        </div>
      </main>
    </PacienteLayout>
  );
}
