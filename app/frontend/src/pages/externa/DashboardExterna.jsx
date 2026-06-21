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
  const agendados = encaminhamentos.filter(e => ['AGENDADO', 'CONFIRMADO_PACIENTE'].includes(e.status)).length;
  
  const hojeISO = new Date().toISOString().slice(0, 10);
  const concluidosHoje = encaminhamentos.filter(e => {
    if (e.status !== 'RETORNO_UBS') return false;
    const dataRetorno = e.feedback_data_retorno ? e.feedback_data_retorno.slice(0, 10) : '';
    return dataRetorno === hojeISO;
  }).length;

  const ultimos = [...encaminhamentos].sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em)).slice(0, 5);

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <CardResumo
              title="Receber"
              value={pendentesReceber}
              icon="inbox"
              bgCor="bg-orange-50"
              textCor="text-orange-600"
              onClick={() => navigate('/externa/encaminhamentos')}
            />
            <CardResumo
              title="Aguardando Conf."
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
              bgCor="bg-emerald-50"
              textCor="text-emerald-600"
              onClick={() => navigate('/externa/encaminhamentos')}
            />
            <CardResumo
              title="Concluídos Hoje"
              value={concluidosHoje}
              icon="task_alt"
              bgCor="bg-gray-100"
              textCor="text-gray-600"
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
                      <h3 className="font-bold text-on-background text-sm">{enc.paciente_nome}</h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">{enc.especialidade} • {enc.ubs_origem || 'UBS'}</p>
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
