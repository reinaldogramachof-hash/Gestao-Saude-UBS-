// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA: DashboardGestor.jsx
// FUNÇÃO: Painel de controle principal da equipe gestora da UBS.
//         Exibe as métricas de saúde da unidade em tempo real, gerencia atalhos rápidos,
//         alertas de atenção imediata para solicitações atrasadas e a atividade recente.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GestorLayout from '../../components/gestor/GestorLayout';

// Mapa de cores e classes de estilo de alta fidelidade para cada status de solicitação.
// Cada chave mapeia um objeto contendo a classe do contêiner (translúcida e com borda fina)
// e a classe da bolinha indicadora sólida para simular status ativos.
const STATUS_ESTILO = {
  em_analise: {
    badge: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
    dot: 'bg-gray-500',
  },
  aguardando_regulacao: {
    badge: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  autorizado: {
    badge: 'bg-blue-500/10 text-blue-850 border-blue-500/20',
    dot: 'bg-blue-500',
  },
  data_marcada: {
    badge: 'bg-teal-500/10 text-teal-800 border-teal-500/20',
    dot: 'bg-teal-500',
  },
  aguardando_resultado: {
    badge: 'bg-purple-500/10 text-purple-800 border-purple-500/20',
    dot: 'bg-purple-500',
  },
  concluido: {
    badge: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  cancelado: {
    badge: 'bg-red-500/10 text-red-800 border-red-500/20',
    dot: 'bg-red-500',
  },
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
  const [pendentes, setPendentes] = useState(0); // Badge para novos cadastros na UBS
  const [loading, setLoading] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);

  // Consulta à API para puxar métricas consolidadas, alertas e cadastros pendentes
  async function fetchDados() {
    try {
      const [rStats, rAlertas, rPendentes] = await Promise.all([
        api.get('/gestor/dashboard/stats'),
        api.get('/gestor/alertas'),
        api.get('/gestor/dashboard/pendentes'),
      ]);
      setStats(rStats.data);
      setAlertas(rAlertas.data);
      setPendentes(rPendentes.data.pendentes_aprovacao);
      setUltimaAtualizacao(new Date());
    } catch (err) {
      console.error('Erro ao atualizar dados do dashboard:', err);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchDados().finally(() => setLoading(false));

    // Polling contínuo a cada 30 segundos para manter os dados atualizados em tempo real
    const intervalo = setInterval(fetchDados, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // Card de métrica reutilizável com efeitos de elevação tridimensional,
  // suporte a navegação por clique (atalho de usabilidade) e visual glassmorphic para o ícone.
  const MetricCard = ({ icon, label, value, colorClass = 'bg-surface-container-low border-outline-variant text-on-surface', onClick }) => {
    const isClickable = !!onClick;
    
    return (
      <div 
        onClick={onClick}
        className={`p-5 rounded-2xl border flex items-center gap-4 transition-all duration-300 select-none ${colorClass} ${
          isClickable 
            ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md active:scale-[0.98] hover:border-primary/30' 
            : ''
        }`}
      >
        {/* Caixa do ícone com acabamento de vidro fosco (glassmorphic) */}
        <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-white/30 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20">
          <span className="material-symbols-outlined text-xl md:text-2xl">{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="h-7 w-12 bg-black/10 rounded animate-pulse mb-1"></div>
          ) : (
            <p className="text-2xl md:text-3xl font-black leading-none tracking-tight">{value ?? 0}</p>
          )}
          <p className="text-xs md:text-sm font-bold mt-1.5 opacity-90 truncate">{label}</p>
        </div>
        {/* Ícone discreto indicando que o card é um link de navegação */}
        {isClickable && !loading && (
          <span className="material-symbols-outlined text-sm opacity-30 group-hover:opacity-100 transition-opacity flex-shrink-0 self-start mt-0.5">
            open_in_new
          </span>
        )}
      </div>
    );
  };

  return (
    <GestorLayout>
      {/* ── Cabeçalho responsivo com timestamp de atualização ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-10">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">Painel Principal</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <p className="text-on-surface-variant font-semibold text-sm">Visão geral da sua unidade</p>
            {ultimaAtualizacao && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant/85 bg-surface-container-low/60 backdrop-blur border border-surface-variant/40 px-2.5 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[13px] animate-spin-slow">sync</span>
                Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          
          {/* Alerta de novos cadastros pendentes */}
          {pendentes > 0 && (
            <button
              onClick={() => navigate('/gestor/pacientes')}
              className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-full
                         bg-amber-500/10 text-amber-800 text-xs md:text-sm font-bold
                         border border-amber-500/20 hover:bg-amber-500/20 active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-base animate-pulse">person_add</span>
              {pendentes} novo{pendentes > 1 ? 's' : ''} paciente{pendentes > 1 ? 's' : ''} aguardando aprovação
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          )}
        </div>
        
        <button
          onClick={() => navigate('/gestor/pacientes')}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined">person_add</span>
          Cadastrar Paciente
        </button>
      </div>

      {/* ── Bloco: Atenção Imediata (Solicitações inativas com prioridade alta) ── */}
      {!loading && alertas && alertas.total > 0 && (
        <div className="mb-8 bg-gradient-to-br from-red-500/5 to-red-500/10 backdrop-blur-md border border-red-500/20 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-5 md:p-6 border-b border-red-500/20 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-600 animate-pulse">warning</span>
            <h2 className="text-lg md:text-xl font-extrabold text-red-900">
              Atenção Imediata — {alertas.total} caso{alertas.total > 1 ? 's' : ''} pendente{alertas.total > 1 ? 's' : ''} de providência
            </h2>
          </div>
          <div className="overflow-x-auto -mx-0">
            <table className="w-full min-w-[640px] text-left bg-white/40">
              <tbody className="divide-y divide-red-500/10">
                {alertas.alertas.slice(0, 5).map(item => (
                  <tr key={item.id} className="hover:bg-red-500/5 transition-colors">
                    <td className="p-4 w-32">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                        item.prioridade === 'urgente' 
                          ? 'bg-red-500/10 text-red-800 border-red-500/20' 
                          : 'bg-orange-500/10 text-orange-800 border-orange-500/20'
                      }`}>
                        {item.prioridade === 'urgente' ? 'Urgente' : 'Prioritário'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-red-950">{item.paciente_nome}</td>
                    <td className="p-4 text-red-900 font-medium">{item.tipo}</td>
                    <td className="p-4 text-red-750 font-bold">Sem movimentação há {item.dias_parado} dias</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/gestor/paciente/${item.paciente_id}`)}
                        className="group/btn inline-flex items-center gap-1 text-sm font-bold text-red-700 hover:text-red-900 hover:underline underline-offset-2 transition-colors duration-200"
                      >
                        Ver Paciente
                        <span className="material-symbols-outlined text-base group-hover/btn:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {alertas.total > 5 && (
            <div className="p-4 bg-white/60 border-t border-red-500/10 text-center">
              <button
                onClick={() => navigate('/gestor/regulacao')}
                className="text-red-800 font-extrabold text-sm hover:text-red-950 hover:underline flex items-center justify-center gap-1.5 mx-auto"
              >
                Visualizar todos os {alertas.total} casos na regulação
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Grid de Métricas Rápidas (Interativo, funcionando como atalhos inteligentes) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 lg:mb-10">
        <MetricCard
          icon="groups"
          label="Pacientes Ativos"
          value={stats?.total_pacientes}
          colorClass="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-primary hover:from-primary/15 hover:to-primary/10"
          onClick={() => navigate('/gestor/pacientes')}
        />
        <MetricCard
          icon="pending"
          label="Em Análise na Regulação"
          value={stats?.em_analise}
          colorClass="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-800 hover:from-amber-500/15 hover:to-amber-500/10"
          onClick={() => navigate('/gestor/regulacao')}
        />
        <MetricCard
          icon="check_circle"
          label="Autorizados"
          value={stats?.autorizados}
          colorClass="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-800 hover:from-emerald-500/15 hover:to-emerald-500/10"
          onClick={() => navigate('/gestor/regulacao')}
        />
        <MetricCard
          icon="medication_liquid"
          label="Med. Indisponíveis"
          value={stats?.medicamentos_indisponiveis}
          colorClass={
            stats?.medicamentos_indisponiveis > 0
              ? 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 text-red-800 hover:from-red-500/15 hover:to-red-500/10'
              : 'bg-surface-container-low border-outline-variant text-on-surface'
          }
          onClick={() => navigate('/gestor/medicamentos')}
        />
      </div>

      {/* ── Bloco: Rede Externa (Design de Central de Operações) ── */}
      <div className="bg-gradient-to-br from-surface-container-lowest to-surface-container-low rounded-3xl p-6 shadow-sm border border-surface-variant flex flex-col justify-between relative overflow-hidden mb-8 lg:mb-10 group">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all duration-300 ${
              stats?.encaminhamentos_pendentes > 0 || stats?.retornos_ubs_pendentes > 0
                ? 'bg-amber-500/15 text-amber-800 border-amber-500/20 animate-pulse' 
                : 'bg-emerald-500/15 text-emerald-800 border-emerald-500/20'
            }`}>
              <span className="material-symbols-outlined">
                {stats?.encaminhamentos_pendentes > 0 || stats?.retornos_ubs_pendentes > 0 ? 'warning' : 'check_circle'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-black text-on-background tracking-tight">Rede Externa</h2>
              <p className="text-sm text-on-surface-variant font-semibold">Regulação com Hospitais, CAPS e AMEs</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            {/* Encaminhamentos ativos na rede */}
            <div>
              <span className={`text-3xl font-black ${
                stats?.encaminhamentos_pendentes > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {stats?.encaminhamentos_pendentes || 0}
              </span>
              <div className="text-[10px] font-extrabold text-on-surface-variant/80 uppercase tracking-widest mt-0.5">
                Em andamento na rede
              </div>
            </div>

            {/* Retornos aguardando ação — só aparece quando há retornos */}
            {stats?.retornos_ubs_pendentes > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <span className="material-symbols-outlined text-orange-700 text-base animate-pulse">
                  assignment_return
                </span>
                <div>
                  <span className="text-lg font-black text-orange-700">
                    {stats.retornos_ubs_pendentes}
                  </span>
                  <span className="text-[10px] font-extrabold text-orange-700/80 uppercase tracking-widest ml-1.5">
                    Retorno aguardando UBS
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => navigate('/gestor/regulacao')}
          className="w-full bg-primary text-white hover:bg-primary-dark font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group/btn-ext"
        >
          Acessar Central de Regulação
          <span className="material-symbols-outlined text-sm group-hover/btn-ext:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>

      {/* ── Bloco: Atividade Recente (Tabela de acompanhamento de status) ── */}
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
          <div className="overflow-x-auto -mx-0">
            <table className="w-full min-w-[640px] text-left relative">
              <thead className="sticky top-0 z-10 bg-surface-container-low/90 backdrop-blur-md border-b border-surface-variant">
                <tr>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Paciente</th>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Pedido / Solicitação</th>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status da Fila</th>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Atualizado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {stats?.atividade_recente?.length > 0 ? (
                  stats.atividade_recente.map(item => (
                    <tr key={item.id} className="hover:bg-surface-container-low/30 transition-colors">
                      {/* Nome do paciente clicável: atalho rápido para abrir o prontuário completo */}
                      <td className="p-4">
                        <button
                          onClick={() => navigate(`/gestor/paciente/${item.paciente_id}`)}
                          className="font-bold text-on-background hover:text-primary hover:underline text-left transition-colors"
                        >
                          {item.paciente_nome}
                        </button>
                      </td>
                      <td className="p-4 text-on-surface-variant font-semibold max-w-[220px] truncate">
                        {item.descricao_paciente}
                      </td>
                      {/* Badge de status com visual translúcido e indicador sólido em formato de bolinha */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          STATUS_ESTILO[item.status]?.badge || 'bg-gray-500/10 text-gray-750 border-gray-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            STATUS_ESTILO[item.status]?.dot || 'bg-gray-500'
                          }`} />
                          {STATUS_LABEL[item.status] || item.status}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant font-semibold text-sm">
                        {new Date(item.atualizado_em).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-on-surface-variant font-medium">
                      Nenhuma atividade recente registrada nesta UBS.
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
