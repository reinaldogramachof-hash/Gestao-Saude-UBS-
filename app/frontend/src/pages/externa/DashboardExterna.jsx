/**
 * PÁGINA: DashboardExterna.jsx + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Dashboard principal para Unidades Externas.
 *         Mostra um resumo dos encaminhamentos com acesso rápido aos últimos.
 * API: GET /api/externa/encaminhamentos
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExternaLayout from '../../components/externa/ExternaLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DashboardExterna() {
  const [encaminhamentos, setEncaminhamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/externa/encaminhamentos');
      setEncaminhamentos(data);
    } catch (err) {
      console.error('[DashboardExterna]', err);
      toast.error('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // Processar cards de resumo
  const pendentesReceber = encaminhamentos.filter(e => e.status === 'AGUARDANDO_VAGA').length;
  const aguardandoConfirmacao = encaminhamentos.filter(e => e.status === 'AGUARDANDO_CONFIRMACAO').length;
  const agendados = encaminhamentos.filter(e => e.status === 'AGENDADO').length;
  
  // Ação necessária: aguardando vaga ou recebido (precisa agendar)
  const acaoNecessaria = encaminhamentos.filter(e => ['AGUARDANDO_VAGA', 'RECEBIDO'].includes(e.status)).length;
  
  const hojeISO = new Date().toISOString().slice(0, 10);
  const concluidosHoje = encaminhamentos.filter(e =>
    e.status === 'RETORNO_UBS' &&
    e.feedback_data_retorno?.slice(0, 10) === hojeISO
  ).length;

  // Ordena por atualizado_em (disponível no SELECT) — criado_em não vem na resposta
  const ultimos = [...encaminhamentos].sort((a, b) => new Date(b.atualizado_em || b.data_solicitacao) - new Date(a.atualizado_em || a.data_solicitacao)).slice(0, 5);

  const CardResumo = ({ title, value, icon, bgCor, textCor, onClick }) => (
    <div
      onClick={onClick}
      className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-variant shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgCor}`}>
        <span className={`material-symbols-outlined text-2xl ${textCor}`}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-extrabold text-on-background leading-tight">{value}</p>
      </div>
    </div>
  );

  return (
    <ExternaLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-background">Visão Geral</h1>
          <p className="text-on-surface-variant text-sm mt-1">Acompanhe as filas e retornos.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-surface-container-high rounded-2xl"></div>)}
          </div>
          <div className="h-64 bg-surface-container-high rounded-2xl mt-8"></div>
        </div>
      ) : (
        <>
          {/* Cards Resumo */}
          {acaoNecessaria > 0 && (
            <div
              onClick={() => navigate('/externa/encaminhamentos')}
              className="bg-orange-100 border border-orange-300 p-4 rounded-2xl mb-4 flex items-center gap-4 cursor-pointer hover:bg-orange-200 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500 text-white">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div>
                <p className="text-xs font-bold text-orange-900 uppercase tracking-wider">Ação Necessária</p>
                <p className="text-2xl font-extrabold text-orange-950 leading-tight">
                  {acaoNecessaria} <span className="text-sm font-medium">pendências</span>
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <CardResumo
              title="Aguardando recebimento"
              value={pendentesReceber}
              icon="inbox"
              bgCor="bg-orange-50"
              textCor="text-orange-600"
              onClick={() => navigate('/externa/encaminhamentos')}
            />
            <CardResumo
              title="Aguardando paciente"
              value={aguardandoConfirmacao}
              icon="schedule"
              bgCor="bg-blue-50"
              textCor="text-blue-600"
              onClick={() => navigate('/externa/encaminhamentos')}
            />
            <CardResumo
              title="Agendados"
              value={agendados}
              icon="event"
              bgCor="bg-purple-50"
              textCor="text-purple-600"
              onClick={() => navigate('/externa/encaminhamentos')}
            />
            <CardResumo
              title="Concluídos hoje"
              value={concluidosHoje}
              icon="task_alt"
              bgCor="bg-green-50"
              textCor="text-green-600"
              onClick={() => navigate('/externa/encaminhamentos')}
            />
          </div>

          {/* Últimos Encaminhamentos */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-surface-variant flex justify-between items-center bg-surface-container-low">
              <h2 className="font-bold text-on-background text-sm">Últimos Encaminhamentos</h2>
              <button
                onClick={() => navigate('/externa/encaminhamentos')}
                className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
              >
                Ver todos <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
            <div className="divide-y divide-surface-variant">
              {ultimos.length === 0 ? (
                <div className="p-6 text-center text-on-surface-variant text-sm">Nenhum encaminhamento recente.</div>
              ) : (
                ultimos.map(enc => (
                  <div key={enc.id} className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                    <div>
                      <h3 className="font-bold text-on-background text-sm flex items-center gap-2">
                        {/* Ponto de prioridade */}
                        {enc.prioridade && (
                          <span
                            className={`w-2.5 h-2.5 rounded-full block flex-shrink-0 ${
                              enc.prioridade === 'VERMELHO' ? 'bg-red-500' :
                              enc.prioridade === 'AMARELO' ? 'bg-yellow-400' :
                              'bg-green-500'
                            }`}
                            title={`Prioridade: ${enc.prioridade}`}
                          ></span>
                        )}
                        {enc.paciente_nome}
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">{enc.catalogo_nome || enc.especialidade} • {enc.ubs_nome || enc.ubs_origem || 'UBS'}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">
                      {enc.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </ExternaLayout>
  );
}
