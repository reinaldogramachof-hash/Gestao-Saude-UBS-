// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: RelatoriosGestor
// FUNÇÃO: Painel analítico e inteligência de dados da UBS (RF-G09).
//         Exibe estatísticas de solicitações abertas, distribuição de status
//         via gráfico donut de rosca SVG dinâmico e monitor de ociosidade de
//         casos urgentes parados há mais de 7 dias com acesso ao prontuário.
// DESIGN: Visual de alta fidelidade com cards estatísticos HSL glassmorphic,
//         gráfico de rosca SVG polido com legendas translúcidas elegantes, e
//         painel de alertas clínicos de inatividade com destaque pulsante.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GestorLayout from '../../components/gestor/GestorLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Dicionário de tradução amigável para status clínico exibidos na legenda
const STATUS_TRADUCAO = {
  em_analise:           'Em análise',
  aguardando_regulacao: 'Aguardando regulação',
  autorizado:           'Autorizado',
  data_marcada:         'Data marcada',
  aguardando_resultado: 'Aguardando resultado',
  concluido:            'Concluído',
  cancelado:            'Cancelado'
};

// Badges translúcidos elegantes por status com bolinha de cor sólida (Paleta HSL)
const STATUS_CORES = {
  em_analise:           'bg-orange-500/10 text-orange-850 border border-orange-500/20',
  aguardando_regulacao: 'bg-blue-500/10 text-blue-850 border border-blue-500/20',
  autorizado:           'bg-purple-500/10 text-purple-850 border border-purple-500/20',
  data_marcada:         'bg-indigo-500/10 text-indigo-850 border border-indigo-500/20',
  aguardando_resultado: 'bg-cyan-500/10 text-cyan-850 border border-cyan-500/20',
};

const STATUS_CORES_BOLINHA = {
  em_analise:           'bg-orange-500',
  aguardando_regulacao: 'bg-blue-500',
  autorizado:           'bg-purple-500',
  data_marcada:         'bg-indigo-500',
  aguardando_resultado: 'bg-cyan-500',
};

// Cores hexadecimais correspondentes para o SVG do Donut Chart
const STATUS_HEX = {
  em_analise:           '#f97316', // orange-500
  aguardando_regulacao: '#3b82f6', // blue-500
  autorizado:           '#a855f7', // purple-500
  data_marcada:         '#6366f1', // indigo-500
  aguardando_resultado: '#06b6d4', // cyan-500
};

export default function RelatoriosGestor() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRelatorios();
  }, []);

  // Busca estatísticas analíticas do backend
  const fetchRelatorios = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/gestor/relatorios');
      setDados(data);
    } catch (err) {
      console.error('[RelatoriosGestor] Erro ao carregar dados analíticos:', err);
      toast.error('Erro ao carregar dados do relatório.');
    } finally {
      setLoading(false);
    }
  };

  // Lógica matemática para construção do Donut Chart SVG dinâmico
  const totalGrafico = dados?.distribuicao_status?.reduce((acc, curr) => acc + curr.total, 0) || 0;
  const r = 36;
  const circ = 2 * Math.PI * r; // ~226.19
  
  let acumuladoOffset = 0;
  const segmentosGrafico = dados?.distribuicao_status?.map(d => {
    if (d.total === 0 || totalGrafico === 0) return null;
    const percent = (d.total / totalGrafico) * 100;
    const strokeDash = (percent / 100) * circ;
    const strokeOffset = circ - strokeDash + acumuladoOffset;
    acumuladoOffset -= strokeDash;
    return {
      status:           d.status,
      total:            d.total,
      strokeDasharray:  `${strokeDash} ${circ}`,
      strokeDashoffset: strokeOffset,
      cor:              STATUS_HEX[d.status] || '#cbd5e1',
      percent:          percent.toFixed(0)
    };
  }).filter(Boolean) || [];

  const totalUrgentesParadas = dados?.urgentes_paradas?.length || 0;

  // Retorna a contagem de dias inativos desde a última atualização do status
  const calcularDiasInativos = (dataISO) => {
    const dataUpdate = new Date(dataISO);
    const hoje = new Date();
    const diferencaTime = Math.abs(hoje - dataUpdate);
    const diferencaDias = Math.ceil(diferencaTime / (1000 * 60 * 60 * 24));
    return diferencaDias;
  };

  // Componente interno para os cards de métricas acumuladas
  const CardMetrica = ({ title, value, label, icon, bgGradiente, borderCor, textCor, isAlertActive }) => (
    <div className={`bg-surface-container-lowest p-6 rounded-3xl border ${borderCor} shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300`}>
      <div className="space-y-1">
        <p className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-on-background leading-none mt-1.5">{value}</p>
        <p className="text-xs text-on-surface-variant font-semibold pt-1">{label}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-tr ${bgGradiente} shadow-sm border border-surface-variant/30 flex-shrink-0 relative`}>
        {isAlertActive && (
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 absolute top-1.5 right-1.5 animate-ping" />
        )}
        <span className={`material-symbols-outlined text-3xl ${textCor} group-hover:scale-105 transition-transform duration-300`}>
          {icon}
        </span>
      </div>
    </div>
  );

  return (
    <GestorLayout>
      {/* ── CABEÇALHO ── */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">
          Relatórios de Atividade
        </h1>
        <p className="text-on-surface-variant font-medium mt-1 text-sm md:text-base">
          Painel analítico do fluxo regulatório, distribuição de status e alertas de ociosidade de casos prioritários.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="h-32 bg-surface-container-high/55 rounded-3xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="h-80 bg-surface-container-high/55 rounded-3xl lg:col-span-2"></div>
            <div className="h-80 bg-surface-container-high/55 rounded-3xl"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
          
          {/* ── METRICAS ACUMULADAS DE ALTA FIDELIDADE ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <CardMetrica
              title="Solicitações Ativas na UBS"
              value={dados?.total_abertas || 0}
              label="Volume total de demandas em andamento"
              icon="pending_actions"
              bgGradiente="from-primary/5 to-primary/10"
              borderCor="border-primary/10"
              textCor="text-primary"
              isAlertActive={false}
            />
            <CardMetrica
              title="Alertas de Ociosidade"
              value={totalUrgentesParadas}
              label="Casos urgentes sem atualização há +7 dias"
              icon="crisis_alert"
              bgGradiente={totalUrgentesParadas > 0 ? "from-red-500/5 to-red-500/10" : "from-emerald-500/5 to-emerald-500/10"}
              borderCor={totalUrgentesParadas > 0 ? "border-red-500/15" : "border-emerald-500/15"}
              textCor={totalUrgentesParadas > 0 ? "text-red-650" : "text-emerald-700"}
              isAlertActive={totalUrgentesParadas > 0}
            />
          </div>

          {/* ── DOIS PAINÉIS: GRÁFICO E MONITOR DE INATIVIDADE ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. GRÁFICO DONUT DE STATUS (SVG DINÂMICO) */}
            <div className="bg-surface-container-lowest border border-surface-variant/45 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="font-extrabold text-on-background text-base md:text-lg tracking-tight mb-1">Status das Demandas</h2>
                <p className="text-xs text-on-surface-variant font-semibold mb-6">Divisão proporcional das solicitações ativas.</p>
                
                {/* Donut Chart SVG */}
                <div className="flex justify-center items-center my-6 relative">
                  <div className="absolute inset-0 rounded-full border border-surface-variant/20 scale-95 pointer-events-none" />
                  <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90 relative z-10">
                    {totalGrafico === 0 ? (
                      <circle
                        cx="50"
                        cy="50"
                        r={r}
                        fill="transparent"
                        stroke="#e5e7eb"
                        strokeWidth="10"
                      />
                    ) : (
                      <>
                        {segmentosGrafico.map(seg => (
                          <circle
                            key={seg.status}
                            cx="50"
                            cy="50"
                            r={r}
                            fill="transparent"
                            stroke={seg.cor}
                            strokeWidth="10"
                            strokeDasharray={seg.strokeDasharray}
                            strokeDashoffset={seg.strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-500 hover:stroke-[12px] cursor-pointer"
                            title={`${STATUS_TRADUCAO[seg.status]}: ${seg.total}`}
                          />
                        ))}
                      </>
                    )}
                  </svg>
                  {/* Totalizador Central Glassmorphic */}
                  <div className="absolute flex flex-col items-center justify-center bg-white/45 backdrop-blur-sm w-24 h-24 rounded-full border border-surface-variant/25 z-0">
                    <span className="text-2xl font-black text-on-background leading-none">{totalGrafico}</span>
                    <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mt-1.5">Abertas</span>
                  </div>
                </div>
              </div>

              {/* Legenda Lateral em Pílulas Translúcidas */}
              <div className="space-y-2.5 mt-4 pt-4 border-t border-surface-variant/30">
                {totalGrafico === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center font-medium italic">Nenhum dado ativo no momento.</p>
                ) : (
                  segmentosGrafico.map(seg => (
                    <div key={seg.status} className="flex items-center justify-between text-xs font-bold bg-surface-container-low/25 p-2 rounded-xl border border-surface-variant/10">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.cor }}></span>
                        <span>{STATUS_TRADUCAO[seg.status] || seg.status}</span>
                      </div>
                      <span className="text-on-background">{seg.total} ({seg.percent}%)</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. PAINEL DE ALERTAS — MONITOR DE OCIOSIDADE CLINICA */}
            <div className="bg-surface-container-lowest border border-surface-variant/45 rounded-3xl overflow-hidden shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div>
                {/* Cabeçalho do Bloco com Ping Ativo */}
                <div className="p-5 border-b border-surface-variant/40 flex justify-between items-center bg-surface-container-low/40">
                  <div>
                    <h2 className="font-extrabold text-on-background text-base md:text-lg tracking-tight flex items-center gap-2">
                      {totalUrgentesParadas > 0 && (
                        <span className="w-2 h-2 rounded-full bg-red-650 animate-ping"></span>
                      )}
                      Urgências Sem Movimentação
                    </h2>
                    <p className="text-xs text-on-surface-variant font-semibold">Solicitações de alta prioridade sem alteração de status por mais de 7 dias.</p>
                  </div>
                  {totalUrgentesParadas > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-red-500/10 text-red-800 border border-red-500/15 rounded-full animate-pulse">
                      Ação Requerida
                    </span>
                  )}
                </div>

                {/* Tabela de Casos Ociosos */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[580px]">
                    <thead>
                      <tr className="bg-surface-container-low/20 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-variant/30">
                        <th className="px-5 py-4">Paciente / CRA</th>
                        <th className="px-5 py-4">Procedimento</th>
                        <th className="px-5 py-4">Status / Inatividade</th>
                        <th className="px-5 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant/30 text-xs">
                      {totalUrgentesParadas === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-12 text-center text-emerald-800 font-extrabold bg-emerald-500/[0.02] border-b border-emerald-500/10">
                            <div className="flex flex-col items-center gap-2">
                              <span className="material-symbols-outlined text-3xl">task_alt</span>
                              Excelente! Nenhuma solicitação urgente pendente de movimentação na unidade.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        dados.urgentes_paradas.map(sol => {
                          const dias = calcularDiasInativos(sol.atualizado_em);
                          return (
                            <tr key={sol.id} className="hover:bg-surface-container-low/40 transition-colors">
                              {/* Paciente com Nome e CRA */}
                              <td className="px-5 py-4">
                                <p className="font-bold text-on-background text-sm">{sol.paciente_nome}</p>
                                <p className="text-[10px] text-on-surface-variant/75 font-mono mt-0.5">CRA: {sol.paciente_cra}</p>
                              </td>

                              {/* Procedimento e Descrição */}
                              <td className="px-5 py-4">
                                <p className="font-extrabold text-on-background capitalize text-sm">{sol.tipo}</p>
                                <p className="text-[10px] text-on-surface-variant/80 font-medium mt-0.5">{sol.descricao}</p>
                              </td>

                              {/* Status Translúcido com Contador de Inatividade */}
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${STATUS_CORES[sol.status] || 'bg-surface-variant/10 text-on-surface border border-surface-variant/20'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CORES_BOLINHA[sol.status] || 'bg-on-surface/50'}`} />
                                  {STATUS_TRADUCAO[sol.status] || sol.status}
                                </span>
                                <p className="text-[10px] text-red-750 font-black mt-1.5 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-650 animate-pulse" />
                                  Sem alteração há {dias} dias
                                </p>
                              </td>

                              {/* Atalho de Prontuário */}
                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => navigate(`/gestor/paciente/${sol.paciente_id}`)}
                                  className="h-9 px-4 bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-xs rounded-xl transition-all border border-primary/20 hover:border-primary flex items-center gap-1.5 ml-auto"
                                >
                                  <span className="material-symbols-outlined text-base">folder_shared</span>
                                  → Ver prontuário
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rodapé Informativo (LGPD e Segurança) */}
              <div className="p-4 bg-surface-container-low/20 border-t border-surface-variant/30 text-center">
                <p className="text-[10px] text-on-surface-variant/85 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary/75">shield</span>
                  Inteligência Sanitária da Fila • Dados internos atualizados em tempo real conforme Decreto Municipal 18.855/2021
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </GestorLayout>
  );
}
