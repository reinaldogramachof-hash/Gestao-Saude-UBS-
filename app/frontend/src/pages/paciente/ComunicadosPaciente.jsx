/**
 * PÁGINA: ComunicadosPaciente.jsx — Épico 3 + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Exibe os comunicados da UBS para o paciente logado.
 *         Usa PacienteLayout para centralização no desktop.
 *
 * API: GET /api/paciente/comunicados
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PacienteLayout from '../../components/paciente/PacienteLayout';
import { formatarDataBR } from '../../utils/statusHelper';

export default function ComunicadosPaciente() {
  const [comunicados, setComunicados] = useState([]);
  const [historicoLogs, setHistoricoLogs] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('comunicados'); // 'comunicados' ou 'historico'
  const [loading, setLoading] = useState(true);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [expandidos, setExpandidos] = useState({});
  const [erro, setErro] = useState(false);

  const carregar = () => {
    setLoading(true);
    setErro(false);
    api.get('/paciente/comunicados')
      .then(r => setComunicados(r.data))
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  };

  const carregarHistorico = () => {
    setLoadingHistorico(true);
    api.get('/paciente/notificacoes/historico')
      .then(r => setHistoricoLogs(r.data))
      .catch(err => console.error('Erro ao carregar histórico de notificações:', err))
      .finally(() => setLoadingHistorico(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (abaAtiva === 'historico') {
      carregarHistorico();
    }
  }, [abaAtiva]);

  const unreadCount = comunicados.filter(c => !c.lido).length;

  const handleExpandir = async (comunicado) => {
    const estaExpandido = expandidos[comunicado.id];
    setExpandidos(prev => ({ ...prev, [comunicado.id]: !estaExpandido }));

    if (!estaExpandido && !comunicado.lido) {
      try {
        await api.post(`/paciente/comunicado/${comunicado.id}/lido`);
        setComunicados(prev => prev.map(c => c.id === comunicado.id ? { ...c, lido: true } : c));
        
        // Dispara o evento global customizado para sincronizar o contador no PacienteLayout
        window.dispatchEvent(new CustomEvent('comunicado-lido'));
      } catch (err) {
        console.error('Erro ao marcar como lido', err);
      }
    }
  };

  const marcarTodosLido = async () => {
    const naoLidos = comunicados.filter(c => !c.lido);
    if (naoLidos.length === 0) return;
    
    try {
      await Promise.allSettled(naoLidos.map(c => api.post(`/paciente/comunicado/${c.id}/lido`)));
      setComunicados(prev => prev.map(c => ({ ...c, lido: true })));
      window.dispatchEvent(new CustomEvent('comunicado-lido'));
    } catch (err) {
      console.error('Erro ao marcar todos como lido', err);
    }
  };

  const comunicadosOrdenados = [...comunicados].sort((a, b) => {
    const aUrgente = Boolean(a.urgente);
    const bUrgente = Boolean(b.urgente);

    if (!a.lido && b.lido) return -1;
    if (a.lido && !b.lido) return 1;

    if (!a.lido && !b.lido) {
      if (aUrgente && !bUrgente) return -1;
      if (!aUrgente && bUrgente) return 1;
    }

    if (a.lido && b.lido) {
      if (aUrgente && !bUrgente) return -1;
      if (!aUrgente && bUrgente) return 1;
    }

    return new Date(b.criado_em) - new Date(a.criado_em);
  });

  return (
    <PacienteLayout>
      {/* ── Cabeçalho verde padrão do portal do paciente com abas ── */}
      {/* Soma a área segura do notch/Dynamic Island ao espaçamento do header para o texto não ficar sob a barra de status do celular. */}
      <header
        className="bg-primary pb-4 px-6"
        style={{ paddingTop: 'calc(var(--safe-top) + 1.5rem)' }}
      >
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div>
            <h1 className="text-on-primary text-2xl font-extrabold flex flex-wrap items-center gap-2">
              <span>Notificações & Avisos</span>
              {unreadCount > 0 && (
                <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                  ({unreadCount} {unreadCount > 1 ? 'novos' : 'novo'})
                </span>
              )}
            </h1>
            <p className="text-white/70 text-sm mt-1">Comunicados e histórico de avisos enviados pela sua UBS</p>
          </div>
          {unreadCount > 0 && abaAtiva === 'comunicados' && (
            <button
              onClick={marcarTodosLido}
              className="text-white/80 hover:text-white text-xs font-bold border border-white/30 rounded-full px-3 py-1.5 transition-colors bg-white/10 hover:bg-white/20 self-center flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-sm">done_all</span>
              Ler todos
            </button>
          )}
        </div>

        {/* Abas de Navegação entre Comunicados e Histórico de 12 Meses */}
        <div className="flex gap-2 border-b border-white/20">
          <button
            onClick={() => setAbaAtiva('comunicados')}
            className={`pb-2 px-3 text-xs md:text-sm font-bold border-b-2 transition-colors ${
              abaAtiva === 'comunicados'
                ? 'border-white text-white'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            Comunicados Ativos ({comunicados.length})
          </button>
          <button
            onClick={() => setAbaAtiva('historico')}
            className={`pb-2 px-3 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-1 ${
              abaAtiva === 'historico'
                ? 'border-white text-white'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">history</span>
            Histórico (12 meses)
          </button>
        </div>
      </header>
      <main className="px-6 py-5 space-y-3 md:space-y-4 pb-28">
        {abaAtiva === 'historico' ? (
          loadingHistorico ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-28 bg-surface-container-low rounded-2xl animate-pulse" />
            ))
          ) : historicoLogs.length > 0 ? (
            historicoLogs.map(log => {
              let statusBadge = 'bg-gray-100 text-gray-700';
              let statusText = 'Disparado';
              if (log.status_envio === 'ENTREGUE') {
                statusBadge = 'bg-blue-100 text-blue-800';
                statusText = 'Entregue no Dispositivo';
              } else if (log.status_envio === 'LIDO') {
                statusBadge = 'bg-green-100 text-green-800';
                statusText = 'Lido';
              } else if (log.status_envio === 'FALHA_DISPOSITIVO') {
                statusBadge = 'bg-red-100 text-red-800';
                statusText = 'Falha no Dispositivo';
              }

              return (
                <div key={log.id} className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">
                        {log.canal === 'web_push' ? 'notifications_active' : 'mark_email_read'}
                      </span>
                      <h3 className="font-bold text-on-background text-sm md:text-base">{log.titulo}</h3>
                    </div>
                    <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full ${statusBadge}`}>
                      {statusText}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">{log.corpo_mensagem}</p>
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-on-surface-variant/70 pt-2 border-t border-surface-variant/40 gap-2">
                    <span>Enviado em: {new Date(log.disparado_em).toLocaleString('pt-BR')}</span>
                    {log.lido_em ? (
                      <span className="text-green-700 font-medium">Lido em: {new Date(log.lido_em).toLocaleString('pt-BR')}</span>
                    ) : log.entregue_em ? (
                      <span className="text-blue-700 font-medium">Entregue em: {new Date(log.entregue_em).toLocaleString('pt-BR')}</span>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center text-on-surface-variant font-medium">
              <span className="material-symbols-outlined text-5xl block mb-4 opacity-30">history</span>
              Nenhum registro no histórico dos últimos 12 meses.
            </div>
          )
        ) : loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-surface-container-low rounded-2xl animate-pulse" />
          ))
        ) : erro ? (
          <>
            {/* Estado de erro com retry — exibido quando a API não responde ou retorna falha. */}
            <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
              <span className="material-symbols-outlined text-5xl text-red-400">wifi_off</span>
              <p className="text-on-surface-variant text-center text-sm">
                Não foi possível carregar os dados.<br />Verifique sua conexão e tente novamente.
              </p>
              <button
                onClick={carregar}
                className="bg-primary text-on-primary px-6 py-2 rounded-full text-sm font-semibold"
              >
                Tentar novamente
              </button>
            </div>
          </>
        ) : comunicados.length > 0 ? (
          comunicadosOrdenados.map(c => {
            const isUrgenteComunicado = Boolean(c.urgente);
            
            // Definição dinâmica de classes visuais conforme urgência e status de leitura
            let cardStyle = '';
            let iconBg = '';
            let iconText = '';
            let iconName = c.tipo === 'individual' ? 'person' : 'campaign';

            if (isUrgenteComunicado) {
              if (!c.lido) {
                // Urgente não lido: Vermelho em destaque
                cardStyle = 'bg-red-50 border-red-300 border-l-4 border-l-red-500 shadow-sm hover:bg-red-100/50';
                iconName = 'priority_high';
                iconBg = 'bg-red-100';
                iconText = 'text-red-600';
              } else {
                // Urgente lido: Cinza neutro mas mantendo a identificação de urgência na borda
                cardStyle = 'bg-surface-container-lowest border-surface-variant border-l-4 border-l-red-400/70 hover:bg-surface-container-low';
                iconName = 'priority_high';
                iconBg = 'bg-surface-container-low';
                iconText = 'text-on-surface-variant/70';
              }
            } else {
              if (!c.lido) {
                // Não lido clássico (azul)
                cardStyle = 'bg-blue-50 border-blue-200 shadow-sm hover:bg-blue-100/30';
                iconBg = c.tipo === 'individual' ? 'bg-purple-100' : 'bg-primary/10';
                iconText = c.tipo === 'individual' ? 'text-purple-700' : 'text-primary';
              } else {
                // Lido clássico (cinza)
                cardStyle = 'bg-surface-container-lowest border-surface-variant hover:bg-surface-container-low';
                iconBg = 'bg-surface-container-low';
                iconText = 'text-on-surface-variant';
              }
            }

            return (
              <div 
                key={c.id} 
                onClick={() => handleExpandir(c)}
                className={`rounded-2xl border p-3 md:p-5 cursor-pointer transition-all duration-200 ${cardStyle}`}
              >
                <div className="flex gap-4 items-start">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${iconBg} ${iconText}`}>
                    <span className="material-symbols-outlined text-xl">
                      {iconName}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className={`font-bold leading-tight transition-colors duration-200 ${
                        c.lido ? 'text-on-background' : isUrgenteComunicado ? 'text-red-950' : 'text-blue-900'
                      }`}>
                        {c.titulo}
                      </h3>
                      <div className="flex gap-1.5 flex-shrink-0 items-center">
                        {isUrgenteComunicado && (
                          <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full transition-all duration-200 ${
                            c.lido ? 'bg-surface-container-high text-on-surface-variant/80' : 'bg-red-500 text-white animate-pulse'
                          }`}>
                            Urgente
                          </span>
                        )}
                        {c.tipo === 'individual' && (
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full transition-colors duration-200 ${
                            c.lido ? 'bg-surface-container-high text-on-surface-variant/80' : 'bg-purple-100 text-purple-700'
                          }`}>
                            Para você
                          </span>
                        )}
                        {!c.lido && !isUrgenteComunicado && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                            Novo
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm leading-relaxed transition-colors duration-200 ${
                      c.lido ? 'text-on-surface-variant' : isUrgenteComunicado ? 'text-red-900' : 'text-blue-800'
                    } ${expandidos[c.id] ? '' : 'line-clamp-2'}`}>
                      {c.mensagem}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <p className={`text-xs font-medium transition-colors duration-200 ${
                        c.lido ? 'text-on-surface-variant/60' : isUrgenteComunicado ? 'text-red-700' : 'text-blue-600'
                      }`}>
                        {formatarDataBR(c.criado_em)}
                      </p>
                      <span className={`material-symbols-outlined text-sm transition-colors duration-200 ${
                        c.lido ? 'text-on-surface-variant/60' : isUrgenteComunicado ? 'text-red-700' : 'text-blue-600'
                      }`}>
                        {expandidos[c.id] ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-5xl block mb-4 opacity-30">campaign</span>
            Nenhum comunicado no momento.
          </div>
        )}
      </main>
    </PacienteLayout>
  );
}
