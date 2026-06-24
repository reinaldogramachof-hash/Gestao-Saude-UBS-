// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: DashboardExterna
// FUNÇÃO: Dashboard analítico e central de controle operacional para
//         Unidades Externas (AMEs, laboratórios, hospitais conveniados).
//         Apresenta indicadores quantitativos da fila, dois gráficos de rosca
//         SVG dinâmicos (Status e Gravidade Clínica) e mural de demandas recentes.
// DESIGN: Acabamento de alta fidelidade com cards estatísticos HSL glassmorphic,
//         gráficos donut com moldura e legendas translúcidas, e painel de alerta
//         de pendências clínicas urgente (Wow Factor).
// ─────────────────────────────────────────────────────────────────────────────

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

  // Busca todos os encaminhamentos pertencentes à unidade externa autenticada
  const fetchDados = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/externa/encaminhamentos');
      setEncaminhamentos(data);
    } catch (err) {
      console.error('[DashboardExterna] Erro ao carregar dados:', err);
      toast.error('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // ── 1. CÁLCULO DAS MÉTRICAS DOS CARDS ──
  const pendentesReceber = encaminhamentos.filter(e => e.status === 'AGUARDANDO_VAGA').length;
  const aguardandoConfirmacao = encaminhamentos.filter(e => e.status === 'AGUARDANDO_CONFIRMACAO').length;
  const agendados = encaminhamentos.filter(e => e.status === 'AGENDADO').length;
  
  // Ações urgentes: casos aguardando triagem (recebimento ou agendamento)
  const acaoNecessaria = encaminhamentos.filter(e => ['AGUARDANDO_VAGA', 'RECEBIDO'].includes(e.status)).length;
  
  const hojeISO = new Date().toISOString().slice(0, 10);
  const concluidosHoje = encaminhamentos.filter(e =>
    e.status === 'RETORNO_UBS' &&
    e.feedback_data_retorno?.slice(0, 10) === hojeISO
  ).length;

  // Ordenação cronológica para o mural de últimos encaminhamentos
  const ultimos = [...encaminhamentos]
    .sort((a, b) => new Date(b.atualizado_em || b.data_solicitacao) - new Date(a.atualizado_em || a.data_solicitacao))
    .slice(0, 5);

  // ── 2. CÁLCULOS MATEMÁTICOS DOS GRÁFICOS DONUT SVG ──
  const r = 36;
  const circ = 2 * Math.PI * r; // ~226.19

  // A. Donut Chart de Status
  const totalGraficoStatus = pendentesReceber + aguardandoConfirmacao + agendados + concluidosHoje;
  
  let acumuladoOffsetStatus = 0;
  const obterSegmentoStatus = (valor, corHex) => {
    if (valor === 0 || totalGraficoStatus === 0) return null;
    const percent = (valor / totalGraficoStatus) * 100;
    const strokeDash = (percent / 100) * circ;
    const strokeOffset = circ - strokeDash + acumuladoOffsetStatus;
    acumuladoOffsetStatus -= strokeDash;
    return {
      strokeDasharray:  `${strokeDash} ${circ}`,
      strokeDashoffset: strokeOffset,
      cor:              corHex,
      percent:          percent.toFixed(0)
    };
  };

  const segReceber = obterSegmentoStatus(pendentesReceber, '#f97316');      // Laranja
  const segAguardando = obterSegmentoStatus(aguardandoConfirmacao, '#3b82f6'); // Azul
  const segAgendados = obterSegmentoStatus(agendados, '#a855f7');          // Roxo
  const segConcluidos = obterSegmentoStatus(concluidosHoje, '#10b981');       // Verde (Esmeralda)

  // B. [NOVA FUNÇÃO] Donut Chart de Gravidade Clínica (Prioridades dos Casos Ativos)
  // Casos ativos são os que ainda não foram concluídos (Retorno UBS) ou cancelados
  const casosAtivos = encaminhamentos.filter(e => e.status !== 'RETORNO_UBS' && e.status !== 'CANCELADO');
  const totalCasosAtivos = casosAtivos.length;

  const ativosVermelho = casosAtivos.filter(e => e.prioridade === 'VERMELHO').length;
  const ativosAmarelo = casosAtivos.filter(e => e.prioridade === 'AMARELO').length;
  const ativosVerde = casosAtivos.filter(e => e.prioridade === 'VERDE').length;

  let acumuladoOffsetPrioridade = 0;
  const obterSegmentoPrioridade = (valor, corHex) => {
    if (valor === 0 || totalCasosAtivos === 0) return null;
    const percent = (valor / totalCasosAtivos) * 100;
    const strokeDash = (percent / 100) * circ;
    const strokeOffset = circ - strokeDash + acumuladoOffsetPrioridade;
    acumuladoOffsetPrioridade -= strokeDash;
    return {
      strokeDasharray:  `${strokeDash} ${circ}`,
      strokeDashoffset: strokeOffset,
      cor:              corHex,
      percent:          percent.toFixed(0)
    };
  };

  const segVermelho = obterSegmentoPrioridade(ativosVermelho, '#ef4444'); // Vermelho (Urgente)
  const segAmarelo = obterSegmentoPrioridade(ativosAmarelo, '#eab308');  // Amarelo (Preferencial)
  const segVerde = obterSegmentoPrioridade(ativosVerde, '#10b981');     // Verde (Rotina)

  // Componente interno reutilizável para renderizar cards estatísticos superiores
  const CardResumo = ({ title, value, icon, bgGradiente, borderCor, textCor, onClick }) => (
    <div
      onClick={onClick}
      className={`bg-surface-container-lowest p-5 rounded-3xl border ${borderCor} shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-lg hover:border-primary/25 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] group`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr ${bgGradiente} border border-surface-variant/20 transition-all duration-300 group-hover:scale-105`}>
        <span className={`material-symbols-outlined text-2xl ${textCor} transition-transform duration-300 group-hover:rotate-12`}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-on-background leading-none mt-1.5">{value}</p>
      </div>
    </div>
  );

  return (
    <ExternaLayout>
      {/* ── SEÇÃO DE CABEÇALHO ── */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">Visão Geral</h1>
        <p className="text-on-surface-variant font-medium mt-1 text-sm md:text-base">
          Acompanhamento do fluxo de regulação clínica, fila de espera secundária e retornos epidemiológicos.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-[96px] bg-surface-container-high/50 rounded-3xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="h-80 bg-surface-container-high/50 rounded-3xl lg:col-span-2"></div>
            <div className="h-80 bg-surface-container-high/50 rounded-3xl"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
          
          {/* ── ALERTA DE AÇÕES PENDENTES DE TRIAGEM ── */}
          {acaoNecessaria > 0 && (
            <div
              onClick={() => navigate('/externa/encaminhamentos')}
              className="bg-orange-500/5 border border-orange-500/15 hover:border-orange-500/35 p-4.5 rounded-3xl mb-6 flex items-center gap-4 cursor-pointer hover:bg-orange-500/[0.08] active:scale-[0.99] transition-all duration-350 shadow-sm"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-orange-500 to-amber-450 text-white shadow-md shadow-orange-500/15 flex-shrink-0">
                <span className="material-symbols-outlined text-2xl animate-pulse">warning</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-orange-850 uppercase tracking-widest">Triagem Requerida</p>
                <p className="text-sm font-bold text-orange-950 mt-0.5">
                  Existem {acaoNecessaria} encaminhamentos pendentes aguardando recebimento físico ou agendamento de data.
                </p>
              </div>
              <span className="material-symbols-outlined text-orange-850 hidden sm:block">arrow_forward</span>
            </div>
          )}

          {/* ── GRID DE CARDS ESTATÍSTICOS (HSL GLASSMORPHIC) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <CardResumo
              title="Aguardando Recebimento"
              value={pendentesReceber}
              icon="inbox"
              bgGradiente="from-orange-500/10 to-amber-500/5"
              borderCor="border-orange-500/15"
              textCor="text-orange-650"
              onClick={() => navigate('/externa/encaminhamentos')}
            />
            <CardResumo
              title="Aguardando Paciente"
              value={aguardandoConfirmacao}
              icon="schedule"
              bgGradiente="from-blue-500/10 to-cyan-500/5"
              borderCor="border-blue-500/15"
              textCor="text-blue-650"
              onClick={() => navigate('/externa/encaminhamentos')}
            />
            <CardResumo
              title="Procedimentos Agendados"
              value={agendados}
              icon="event"
              bgGradiente="from-purple-500/10 to-pink-500/5"
              borderCor="border-purple-500/15"
              textCor="text-purple-650"
              onClick={() => navigate('/externa/encaminhamentos')}
            />
            <CardResumo
              title="Concluídos Hoje"
              value={concluidosHoje}
              icon="task_alt"
              bgGradiente="from-emerald-500/10 to-teal-500/5"
              borderCor="border-emerald-500/15"
              textCor="text-emerald-700"
              onClick={() => navigate('/externa/encaminhamentos')}
            />
          </div>

          {/* ── LAYOUT DE DOIS BLOCOS PRINCIPAIS (DESKTOP) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Coluna 1 e 2: Mural de Demandas Recentes (66% de largura) */}
            <div className="bg-surface-container-lowest border border-surface-variant/45 rounded-3xl overflow-hidden shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-surface-variant/40 flex justify-between items-center bg-surface-container-low/40">
                  <div>
                    <h2 className="font-extrabold text-on-background text-base md:text-lg tracking-tight">Últimos Encaminhamentos</h2>
                    <p className="text-xs text-on-surface-variant font-semibold">Demandas reguladas recentemente pela rede UBS.</p>
                  </div>
                  <button
                    onClick={() => navigate('/externa/encaminhamentos')}
                    className="text-primary text-xs font-bold hover:underline flex items-center gap-1 bg-primary/10 hover:bg-primary/15 px-3.5 py-2 rounded-xl transition-all border border-primary/20"
                  >
                    Ver fila completa <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
                
                <div className="divide-y divide-surface-variant/35">
                  {ultimos.length === 0 ? (
                    <div className="p-12 text-center text-on-surface-variant text-sm font-semibold">Nenhum encaminhamento registrado recentemente.</div>
                  ) : (
                    ultimos.map(enc => (
                      <div
                        key={enc.id}
                        onClick={() => navigate('/externa/encaminhamentos')}
                        className="p-5 flex items-center justify-between hover:bg-surface-container-low/30 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          {/* Ponto de prioridade com brilho e pulsação se for urgente */}
                          {enc.prioridade && (
                            <span
                              className={`w-3.5 h-3.5 rounded-full block flex-shrink-0 shadow-sm border border-white relative ${
                                enc.prioridade === 'VERMELHO' ? 'bg-red-500 shadow-red-500/25' :
                                enc.prioridade === 'AMARELO' ? 'bg-yellow-400 shadow-yellow-400/25' :
                                'bg-green-500 shadow-green-500/25'
                              }`}
                              title={`Prioridade: ${enc.prioridade}`}
                            >
                              {enc.prioridade === 'VERMELHO' && (
                                <span className="w-full h-full rounded-full bg-red-500 absolute inset-0 animate-ping opacity-60" />
                              )}
                            </span>
                          )}
                          <div>
                            <h3 className="font-extrabold text-on-background text-sm md:text-base group-hover:text-primary transition-colors">
                              {enc.paciente_nome}
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-1 font-semibold flex items-center gap-1">
                              <span>{enc.catalogo_nome || enc.especialidade}</span>
                              <span className="text-on-surface-variant/40">•</span>
                              <span className="font-bold text-on-background/75">{enc.ubs_nome || enc.ubs_origem || 'UBS'}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Badges Translúcidos com bolinha indicadora */}
                          {enc.status === 'AGUARDANDO_VAGA' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-orange-500/10 text-orange-850 border border-orange-500/15">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                              Pendente
                            </span>
                          )}
                          {enc.status === 'RECEBIDO' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-blue-500/10 text-blue-850 border border-blue-500/15">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Recebido
                            </span>
                          )}
                          {enc.status === 'AGUARDANDO_CONFIRMACAO' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-surface-variant/20 text-on-surface-variant border border-surface-variant/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40 animate-pulse" />
                              Aguardando Paciente
                            </span>
                          )}
                          {enc.status === 'AGENDADO' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-purple-500/10 text-purple-850 border border-purple-500/15">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              Agendado
                            </span>
                          )}
                          {enc.status === 'CONFIRMADO_PACIENTE' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-teal-500/10 text-teal-850 border border-teal-500/15">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                              Confirmado
                            </span>
                          )}
                          {enc.status === 'RETORNO_UBS' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-emerald-500/10 text-emerald-850 border border-emerald-500/15">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Concluído
                            </span>
                          )}
                          <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-lg">chevron_right</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Rodapé institucional */}
              <div className="p-4 bg-surface-container-low/20 border-t border-surface-variant/35 text-center">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary/75">shield</span>
                  Ambiente Seguro • Em conformidade com a LGPD e o Decreto Municipal 18.855/2021 de SJC
                </p>
              </div>
            </div>

            {/* Coluna 3: Métricas da Fila (Donut Charts de Status e Gravidade) */}
            <div className="space-y-6">
              {/* Painel 1: Distribuição da Fila por Status */}
              <div className="bg-surface-container-lowest border border-surface-variant/45 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="font-extrabold text-on-background text-base tracking-tight mb-1">Distribuição da Fila</h2>
                  <p className="text-xs text-on-surface-variant font-semibold mb-6">Métricas proporcionais por status clínico.</p>
                  
                  {/* Área do Gráfico */}
                  <div className="flex justify-center items-center my-4 relative">
                    <div className="absolute inset-0 rounded-full border border-surface-variant/15 scale-90 pointer-events-none" />
                    <svg viewBox="0 0 100 100" className="w-36 h-36 transform -rotate-90 relative z-10">
                      {totalGraficoStatus === 0 ? (
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
                          {segReceber && (
                            <circle
                              cx="50"
                              cy="50"
                              r={r}
                              fill="transparent"
                              stroke={segReceber.cor}
                              strokeWidth="10"
                              strokeDasharray={segReceber.strokeDasharray}
                              strokeDashoffset={segReceber.strokeDashoffset}
                              strokeLinecap="round"
                              className="transition-all duration-500 hover:stroke-[12px] cursor-pointer"
                            />
                          )}
                          {segAguardando && (
                            <circle
                              cx="50"
                              cy="50"
                              r={r}
                              fill="transparent"
                              stroke={segAguardando.cor}
                              strokeWidth="10"
                              strokeDasharray={segAguardando.strokeDasharray}
                              strokeDashoffset={segAguardando.strokeDashoffset}
                              strokeLinecap="round"
                              className="transition-all duration-500 hover:stroke-[12px] cursor-pointer"
                            />
                          )}
                          {segAgendados && (
                            <circle
                              cx="50"
                              cy="50"
                              r={r}
                              fill="transparent"
                              stroke={segAgendados.cor}
                              strokeWidth="10"
                              strokeDasharray={segAgendados.strokeDasharray}
                              strokeDashoffset={segAgendados.strokeDashoffset}
                              strokeLinecap="round"
                              className="transition-all duration-500 hover:stroke-[12px] cursor-pointer"
                            />
                          )}
                          {segConcluidos && (
                            <circle
                              cx="50"
                              cy="50"
                              r={r}
                              fill="transparent"
                              stroke={segConcluidos.cor}
                              strokeWidth="10"
                              strokeDasharray={segConcluidos.strokeDasharray}
                              strokeDashoffset={segConcluidos.strokeDashoffset}
                              strokeLinecap="round"
                              className="transition-all duration-500 hover:stroke-[12px] cursor-pointer"
                            />
                          )}
                        </>
                      )}
                    </svg>
                    {/* Texto central da rosca */}
                    <div className="absolute flex flex-col items-center justify-center bg-white/55 backdrop-blur-xs w-20 h-20 rounded-full border border-surface-variant/20 z-0">
                      <span className="text-2xl font-black text-on-background leading-none">{totalGraficoStatus}</span>
                      <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mt-1">Total</span>
                    </div>
                  </div>
                </div>

                {/* Legenda explicativa com as cores e porcentagens */}
                <div className="space-y-2 mt-4 pt-4 border-t border-surface-variant/35">
                  {totalGraficoStatus === 0 ? (
                    <p className="text-xs text-on-surface-variant text-center font-semibold italic">Nenhum dado estatístico disponível.</p>
                  ) : (
                    <>
                      {pendentesReceber > 0 && (
                        <div className="flex items-center justify-between text-xs font-extrabold bg-surface-container-low/20 p-1.5 rounded-lg border border-surface-variant/10">
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                            <span>Aguardando Receb.</span>
                          </div>
                          <span className="text-on-background">{segReceber?.percent}%</span>
                        </div>
                      )}
                      {aguardandoConfirmacao > 0 && (
                        <div className="flex items-center justify-between text-xs font-extrabold bg-surface-container-low/20 p-1.5 rounded-lg border border-surface-variant/10">
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                            <span>Aguardando Paciente</span>
                          </div>
                          <span className="text-on-background">{segAguardando?.percent}%</span>
                        </div>
                      )}
                      {agendados > 0 && (
                        <div className="flex items-center justify-between text-xs font-extrabold bg-surface-container-low/20 p-1.5 rounded-lg border border-surface-variant/10">
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                            <span>Agendados</span>
                          </div>
                          <span className="text-on-background">{segAgendados?.percent}%</span>
                        </div>
                      )}
                      {concluidosHoje > 0 && (
                        <div className="flex items-center justify-between text-xs font-extrabold bg-surface-container-low/20 p-1.5 rounded-lg border border-surface-variant/10">
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span>Concluídos Hoje</span>
                          </div>
                          <span className="text-on-background">{segConcluidos?.percent}%</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* [NOVA FUNÇÃO] Painel 2: Gravidade Clínica dos Casos Ativos (Donut Chart de Prioridades) */}
              <div className="bg-surface-container-lowest border border-surface-variant/45 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="font-extrabold text-on-background text-base tracking-tight mb-1">Gravidade da Fila</h2>
                  <p className="text-xs text-on-surface-variant font-semibold mb-6">Grau de prioridade clínica dos casos ativos.</p>
                  
                  {/* Área do Gráfico de Prioridades */}
                  <div className="flex justify-center items-center my-4 relative">
                    <div className="absolute inset-0 rounded-full border border-surface-variant/15 scale-90 pointer-events-none" />
                    <svg viewBox="0 0 100 100" className="w-36 h-36 transform -rotate-90 relative z-10">
                      {totalCasosAtivos === 0 ? (
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
                          {segVermelho && (
                            <circle
                              cx="50"
                              cy="50"
                              r={r}
                              fill="transparent"
                              stroke={segVermelho.cor}
                              strokeWidth="10"
                              strokeDasharray={segVermelho.strokeDasharray}
                              strokeDashoffset={segVermelho.strokeDashoffset}
                              strokeLinecap="round"
                              className="transition-all duration-500 hover:stroke-[12px] cursor-pointer"
                            />
                          )}
                          {segAmarelo && (
                            <circle
                              cx="50"
                              cy="50"
                              r={r}
                              fill="transparent"
                              stroke={segAmarelo.cor}
                              strokeWidth="10"
                              strokeDasharray={segAmarelo.strokeDasharray}
                              strokeDashoffset={segAmarelo.strokeDashoffset}
                              strokeLinecap="round"
                              className="transition-all duration-500 hover:stroke-[12px] cursor-pointer"
                            />
                          )}
                          {segVerde && (
                            <circle
                              cx="50"
                              cy="50"
                              r={r}
                              fill="transparent"
                              stroke={segVerde.cor}
                              strokeWidth="10"
                              strokeDasharray={segVerde.strokeDasharray}
                              strokeDashoffset={segVerde.strokeDashoffset}
                              strokeLinecap="round"
                              className="transition-all duration-500 hover:stroke-[12px] cursor-pointer"
                            />
                          )}
                        </>
                      )}
                    </svg>
                    {/* Texto central da rosca */}
                    <div className="absolute flex flex-col items-center justify-center bg-white/55 backdrop-blur-xs w-20 h-20 rounded-full border border-surface-variant/20 z-0">
                      <span className="text-2xl font-black text-on-background leading-none">{totalCasosAtivos}</span>
                      <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mt-1">Ativos</span>
                    </div>
                  </div>
                </div>

                {/* Legenda explicativa com as cores e porcentagens de prioridade */}
                <div className="space-y-2 mt-4 pt-4 border-t border-surface-variant/35">
                  {totalCasosAtivos === 0 ? (
                    <p className="text-xs text-on-surface-variant text-center font-semibold italic">Nenhum caso ativo na fila.</p>
                  ) : (
                    <>
                      {ativosVermelho > 0 && (
                        <div className="flex items-center justify-between text-xs font-extrabold bg-red-500/5 p-1.5 rounded-lg border border-red-500/10">
                          <div className="flex items-center gap-2 text-red-900">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                            <span>Vermelho (Urgente)</span>
                          </div>
                          <span className="text-red-950">{segVermelho?.percent}%</span>
                        </div>
                      )}
                      {ativosAmarelo > 0 && (
                        <div className="flex items-center justify-between text-xs font-extrabold bg-yellow-500/[0.03] p-1.5 rounded-lg border border-yellow-500/10">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-450"></span>
                            <span>Amarelo (Preferencial)</span>
                          </div>
                          <span className="text-yellow-950">{segAmarelo?.percent}%</span>
                        </div>
                      )}
                      {ativosVerde > 0 && (
                        <div className="flex items-center justify-between text-xs font-extrabold bg-emerald-500/[0.03] p-1.5 rounded-lg border border-emerald-500/10">
                          <div className="flex items-center gap-2 text-emerald-800">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-550"></span>
                            <span>Verde (Rotina)</span>
                          </div>
                          <span className="text-emerald-950">{segVerde?.percent}%</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </ExternaLayout>
  );
}
