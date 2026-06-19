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
  const [loading, setLoading] = useState(true);
  const [expandidos, setExpandidos] = useState({});
  const [erro, setErro] = useState(false);

  // O estado de urgência agora é determinado diretamente pelo campo 'urgente'
  // configurado pelo gestor no banco de dados, eliminando falsos positivos.

  const carregar = () => {
    setLoading(true);
    setErro(false);
    api.get('/paciente/comunicados')
      .then(r => setComunicados(r.data))
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
  }, []);

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

  // Marca todos os comunicados não lidos como lidos em lote, efetuando requisições paralelas
  // e disparando o evento de sincronização de notificações.
  const marcarTodosLido = async () => {
    const naoLidos = comunicados.filter(c => !c.lido);
    if (naoLidos.length === 0) return;
    
    try {
      // Executa chamadas à API em paralelo utilizando Promise.allSettled
      await Promise.allSettled(naoLidos.map(c => api.post(`/paciente/comunicado/${c.id}/lido`)));
      
      // Atualiza o estado local para marcar todos como lidos
      setComunicados(prev => prev.map(c => ({ ...c, lido: true })));
      
      // Dispara o evento global customizado para zerar/atualizar o badge do menu e cabeçalho
      window.dispatchEvent(new CustomEvent('comunicado-lido'));
    } catch (err) {
      console.error('Erro ao marcar todos como lido', err);
    }
  };

  // Ordena os comunicados seguindo a hierarquia:
  // 1. Urgentes não lidos
  // 2. Não urgentes não lidos
  // 3. Urgentes lidos
  // 4. Não urgentes lidos
  // Dentro de cada grupo, exibe os comunicados mais recentes primeiro.
  const comunicadosOrdenados = [...comunicados].sort((a, b) => {
    const aUrgente = Boolean(a.urgente);
    const bUrgente = Boolean(b.urgente);

    // 1. Não lidos antes de lidos
    if (!a.lido && b.lido) return -1;
    if (a.lido && !b.lido) return 1;

    // 2. Se ambos forem não lidos, o urgente vem primeiro
    if (!a.lido && !b.lido) {
      if (aUrgente && !bUrgente) return -1;
      if (!aUrgente && bUrgente) return 1;
    }

    // 3. Se ambos forem lidos, o urgente também vem primeiro
    if (a.lido && b.lido) {
      if (aUrgente && !bUrgente) return -1;
      if (!aUrgente && bUrgente) return 1;
    }

    // 4. Fallback: Ordenação cronológica (mais recente primeiro)
    return new Date(b.criado_em) - new Date(a.criado_em);
  });

  return (
    <PacienteLayout>
      {/* ── Cabeçalho verde padrão do portal do paciente com ação em lote ── */}
      <header className="bg-primary pt-12 pb-6 px-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-on-primary text-2xl font-extrabold flex items-center gap-2">
              Comunicados 
              {unreadCount > 0 && <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full">({unreadCount} novos)</span>}
            </h1>
            <p className="text-white/70 text-sm mt-1">Avisos da sua unidade de saúde</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={marcarTodosLido}
              className="text-white/80 hover:text-white text-xs font-bold border border-white/30 rounded-full px-3 py-1.5 transition-colors bg-white/10 hover:bg-white/20 self-center flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-sm">done_all</span>
              Ler todos
            </button>
          )}
        </div>
      </header>

      <main className="px-6 py-6 space-y-4 pb-28">
        {loading ? (
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
                className={`rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${cardStyle}`}
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
