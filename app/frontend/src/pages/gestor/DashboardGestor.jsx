/**
 * PÁGINA: DashboardGestor.jsx — Épico 1 + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Painel principal do gestor com métricas reais da UBS.
 *         Usa GestorLayout para gerenciar o sidebar responsivo.
 *
 * API: GET /api/gestor/dashboard/stats
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GestorLayout from '../../components/gestor/GestorLayout';

// Mapa de cores para cada status de solicitação
const STATUS_BADGE = {
  em_analise:           'bg-gray-100 text-gray-600',
  aguardando_regulacao: 'bg-amber-100 text-amber-700',
  autorizado:           'bg-blue-100 text-blue-700',
  data_marcada:         'bg-teal-100 text-teal-700',
  aguardando_resultado: 'bg-purple-100 text-purple-700',
  concluido:            'bg-emerald-100 text-emerald-700',
  cancelado:            'bg-red-100 text-red-600',
};

const STATUS_LABEL = {
  em_analise:           'Em Análise',
  aguardando_regulacao: 'Ag. Regulação',
  autorizado:           'Autorizado',
  data_marcada:         'Data Marcada',
  aguardando_resultado: 'Ag. Resultado',
  concluido:            'Concluído',
  cancelado:            'Cancelado',
};

export default function DashboardGestor() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [alertas, setAlertas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/gestor/dashboard/stats'),
      api.get('/gestor/alertas')
    ])
      .then(([rStats, rAlertas]) => {
        setStats(rStats.data);
        setAlertas(rAlertas.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Card de métrica reutilizável
  const MetricCard = ({ icon, label, value, colorClass = 'bg-surface-container-low border-outline-variant text-on-surface' }) => (
    <div className={`p-5 rounded-2xl border flex items-center gap-4 ${colorClass}`}>
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/50 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-xl md:text-2xl">{icon}</span>
      </div>
      <div>
        {loading ? (
          <div className="h-7 w-10 bg-black/10 rounded animate-pulse mb-1"></div>
        ) : (
          <p className="text-2xl md:text-3xl font-extrabold leading-none">{value ?? 0}</p>
        )}
        <p className="text-xs md:text-sm font-semibold mt-1 opacity-80">{label}</p>
      </div>
    </div>
  );

  return (
    <GestorLayout>
      {/* ── Cabeçalho responsivo ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-10">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">Painel Principal</h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm">Visão geral da sua unidade</p>
        </div>
        <button
          onClick={() => navigate('/gestor/pacientes')}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined">person_add</span>
          Cadastrar Paciente
        </button>
      </div>

      {/* ── Atenção Imediata (Bloco 2) ── */}
      {!loading && alertas && alertas.total > 0 && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 md:p-6 border-b border-red-200 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-600">warning</span>
            <h2 className="text-lg md:text-xl font-extrabold text-red-800">
              Atenção Imediata — {alertas.total} caso(s) precisam de ação
            </h2>
          </div>
          <div className="overflow-x-auto -mx-0">
            <table className="w-full min-w-[640px] text-left bg-white/50">
              <tbody className="divide-y divide-red-100">
                {alertas.alertas.slice(0, 5).map(item => (
                  <tr key={item.id} className="hover:bg-red-50/80 transition-colors">
                    <td className="p-4 w-32">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.prioridade === 'urgente' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.prioridade === 'urgente' ? 'Urgente' : 'Prioritário'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-900">{item.paciente_nome}</td>
                    <td className="p-4 text-gray-700 font-medium">{item.tipo}</td>
                    <td className="p-4 text-red-600 font-semibold">Parado há {item.dias_parado} dias</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/gestor/paciente/${item.paciente_id}`)}
                        className="text-sm font-bold text-red-700 hover:text-red-900 underline underline-offset-2"
                      >
                        Ver Paciente
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {alertas.total > 5 && (
            <div className="p-4 bg-white/50 border-t border-red-100 text-center">
              <button className="text-red-700 font-bold text-sm hover:underline">
                Ver todos os {alertas.total} casos
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Grid de 4 cards de métricas ── */}
      {/* Responsivo: 1 coluna no mobile, 2 no sm, 4 no lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 lg:mb-10">
        <MetricCard
          icon="groups"
          label="Pacientes Ativos"
          value={stats?.total_pacientes}
          colorClass="bg-primary/10 border-primary/20 text-primary"
        />
        <MetricCard
          icon="pending"
          label="Em Análise"
          value={stats?.em_analise}
          colorClass="bg-amber-50 text-amber-700 border-amber-200"
        />
        <MetricCard
          icon="check_circle"
          label="Autorizados"
          value={stats?.autorizados}
          colorClass="bg-emerald-50 text-emerald-700 border-emerald-200"
        />
        <MetricCard
          icon="medication_liquid"
          label="Med. Indisponíveis"
          value={stats?.medicamentos_indisponiveis}
          colorClass={
            stats?.medicamentos_indisponiveis > 0
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-surface-container-low border-outline-variant text-on-surface'
          }
        />
      </div>

      {/* ── Atividade Recente ── */}
      <div className="bg-surface-container-lowest rounded-3xl border border-surface-variant shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-surface-variant">
          <h2 className="text-lg md:text-xl font-extrabold text-on-background">Atividade Recente</h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-10 bg-surface-container-low rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          /* Wrapper de scroll horizontal para tabelas em mobile */
          <div className="overflow-x-auto -mx-0">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Paciente</th>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Pedido</th>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Atualizado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {stats?.atividade_recente?.length > 0 ? (
                  stats.atividade_recente.map(item => (
                    <tr key={item.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="p-4 font-bold text-on-background">{item.paciente_nome}</td>
                      <td className="p-4 text-on-surface-variant font-medium max-w-[200px] truncate">{item.descricao_paciente}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[item.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[item.status] || item.status}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant font-medium text-sm">
                        {new Date(item.atualizado_em).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-on-surface-variant font-medium">
                      Nenhuma atividade recente. Cadastre pacientes para começar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </GestorLayout>
  );
}
