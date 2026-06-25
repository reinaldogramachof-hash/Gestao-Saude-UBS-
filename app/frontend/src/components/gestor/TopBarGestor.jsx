// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: TopBarGestor
// FUNÇÃO: Barra de navegação superior do portal do gestor. Exibe saudação personalizada,
//         identificação da UBS logada com chip dinâmico e status em tempo real,
//         data atualizada e um relógio minimalista glassmorphic com pulsação suave.
// PROPS:
//   - onAbrirSidebar: callback — abre o drawer lateral da navegação no mobile
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function TopBarGestor({ onAbrirSidebar }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dataAtual, setDataAtual] = useState(new Date());
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidasCount, setNaoLidasCount] = useState(0);
  const [menuAberto, setMenuAberto] = useState(false);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(false);

  // ─── Polling Reativo para Contagem de Não Lidas ────────────────────────────
  // Busca a contagem de mensagens não lidas a cada 20 segundos
  useEffect(() => {
    if (!user?.id) return;

    const buscarContagem = () => {
      api.get('/gestor/notificacoes/nao-lidas-count')
        .then((res) => setNaoLidasCount(res.data.total))
        .catch((err) => console.warn('[Notificações] Erro ao buscar contagem:', err.message));
    };

    buscarContagem();
    const interval = setInterval(buscarContagem, 20000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Carrega a lista completa ao abrir o dropdown
  const carregarNotificacoes = async () => {
    setCarregandoNotificacoes(true);
    try {
      const res = await api.get('/gestor/notificacoes');
      setNotificacoes(res.data);
    } catch (err) {
      console.warn('[Notificações] Erro ao carregar lista:', err.message);
    } finally {
      setCarregandoNotificacoes(false);
    }
  };

  const toggleMenuNotificacoes = () => {
    const novoEstado = !menuAberto;
    setMenuAberto(novoEstado);
    if (novoEstado) {
      carregarNotificacoes();
    }
  };

  // Marca uma notificação como lida no backend e navega
  const lidarCliqueNotificacao = async (notif) => {
    setMenuAberto(false);
    if (!notif.lida) {
      try {
        await api.post(`/gestor/notificacao/${notif.id}/lida`);
        // Atualiza contagem e lista localmente sem refetch imediato
        setNaoLidasCount(prev => Math.max(0, prev - 1));
        setNotificacoes(prev =>
          prev.map(n => n.id === notif.id ? { ...n, lida: true } : n)
        );
      } catch (err) {
        console.warn('[Notificações] Erro ao marcar como lida:', err.message);
      }
    }
    // Navega para a rota de destino
    if (notif.rota_destino) {
      navigate(`/gestor${notif.rota_destino}`);
    }
  };

  // Marca todas as notificações como lidas de uma vez
  const marcarTodasComoLidas = async () => {
    try {
      await api.post('/gestor/notificacoes/marcar-todas-lidas');
      setNaoLidasCount(0);
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (err) {
      console.warn('[Notificações] Erro ao marcar todas como lidas:', err.message);
    }
  };

  // Formata o tempo relativo de criação do alerta
  const formatarTempoRelativo = (dataIso) => {
    try {
      const data = new Date(dataIso);
      const agora = new Date();
      const diferencaMs = agora - data;
      const diferencaMin = Math.floor(diferencaMs / 60000);
      
      if (diferencaMin < 1) return 'agora mesmo';
      if (diferencaMin < 60) return `há ${diferencaMin} min`;
      
      const diferencaHoras = Math.floor(diferencaMin / 60);
      if (diferencaHoras < 24) return `há ${diferencaHoras}h`;
      
      const diferencaDias = Math.floor(diferencaHoras / 24);
      if (diferencaDias === 1) return 'ontem';
      if (diferencaDias < 7) return `há ${diferencaDias} dias`;
      
      return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(data);
    } catch (_) {
      return 'recentemente';
    }
  };

  // Retorna ícone e cores temáticas com base na categoria do alerta
  const obterConfigEvento = (tipo) => {
    switch (tipo) {
      case 'novo_paciente':
        return { icone: 'person_add', corBg: 'bg-blue-500/10', corTexto: 'text-blue-500' };
      case 'novo_encaminhamento':
        return { icone: 'assignment_turned_in', corBg: 'bg-purple-500/10', corTexto: 'text-purple-500' };
      case 'status_encaminhamento':
        return { icone: 'sync_alt', corBg: 'bg-cyan-500/10', corTexto: 'text-cyan-500' };
      case 'retorno_externo':
        return { icone: 'output', corBg: 'bg-orange-500/10', corTexto: 'text-orange-500' };
      case 'urgencia_escalada':
        return { icone: 'warning', corBg: 'bg-red-500/10', corTexto: 'text-red-500 animate-pulse' };
      case 'vigilancia_epidemiologica':
        return { icone: 'biotech', corBg: 'bg-amber-500/10', corTexto: 'text-amber-500' };
      default:
        return { icone: 'notifications', corBg: 'bg-primary/10', corTexto: 'text-primary' };
    }
  };
  
  // Inicializa o nome da UBS buscando do cache rápido (localStorage)
  // para evitar oscilações visuais (piscadas de tela) ao navegar
  const [ubsNome, setUbsNome] = useState(() => {
    if (!user?.ubs_id) return '';
    return localStorage.getItem(`gestao_ubs_nome_${user.ubs_id}`) || 'Carregando unidade...';
  });

  // ─── Relógio em Tempo Real ────────────────────────────────────────────────
  // Atualiza o objeto de data a cada 60 segundos
  useEffect(() => {
    const timer = setInterval(() => setDataAtual(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ─── Resolução Dinâmica da UBS ─────────────────────────────────────────────
  // Se o gestor possui ubs_id mas o nome amigável ainda não está no localStorage,
  // busca a lista pública de UBSs para encontrar o nome correspondente.
  useEffect(() => {
    if (!user?.ubs_id) return;

    const nomeSalvo = localStorage.getItem(`gestao_ubs_nome_${user.ubs_id}`);
    if (nomeSalvo) {
      setUbsNome(nomeSalvo);
      return;
    }

    let montado = true;
    api.get('/auth/ubs')
      .then((res) => {
        const ubsEncontrada = res.data.find((u) => u.id === Number(user.ubs_id));
        if (ubsEncontrada && montado) {
          setUbsNome(ubsEncontrada.nome);
          localStorage.setItem(`gestao_ubs_nome_${user.ubs_id}`, ubsEncontrada.nome);
        } else if (montado) {
          setUbsNome('Unidade de Saúde');
        }
      })
      .catch(() => {
        if (montado) setUbsNome('Unidade de Saúde');
      });

    return () => {
      montado = false;
    };
  }, [user?.ubs_id]);

  // Formata a data por extenso (ex: quarta-feira, 24 de junho de 2026)
  const formatarData = (data) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(data);
  };

  // Formata a hora em formato hh:mm
  const formatarHora = (data) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  };

  const dataFormatada = formatarData(dataAtual);
  const horaFormatada = formatarHora(dataAtual);

  return (
    <header className="h-16 md:h-20 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-surface-variant flex items-center justify-between px-4 md:px-8 lg:px-10 sticky top-0 z-30 shadow-sm transition-all">
      
      {/* ── Lado esquerdo: hamburger (mobile), saudação e chip institucional ── */}
      <div className="flex items-center gap-4">
        {/* Botão hamburger — visível apenas no mobile (lg:hidden) */}
        <button
          onClick={onAbrirSidebar}
          className="lg:hidden w-10 h-10 rounded-xl hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
          aria-label="Abrir menu lateral"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        <div className="flex flex-col justify-center">
          {/* Saudação e Chip Institucional dispostos lado a lado com wrap responsivo */}
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <h2 className="text-lg md:text-2xl font-extrabold text-on-background tracking-tight">
              Olá, {user?.nome?.split(' ')[0] || 'Gestor'}
            </h2>
            
            {/* Chip da UBS: exibe qual unidade está sob a gestão atual */}
            {user?.ubs_id && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-black bg-primary/10 text-primary border border-primary/20 shadow-sm select-none transition-all duration-300">
                {/* Bolinha pulsante que denota que a sessão corporativa está ativa em tempo real */}
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                {ubsNome}
              </span>
            )}
          </div>
          
          <p className="text-xs md:text-sm font-semibold text-on-surface-variant hidden sm:block">
            Portal do Gestor — UBS+
          </p>
        </div>
      </div>

      {/* ── Lado direito: Data Estendida, Sino de Notificações e Relógio Minimalista ── */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Data legível por extenso (oculta em telas pequenas) */}
        <div className="hidden lg:flex flex-col items-end justify-center text-right">
          <span className="text-sm font-bold text-on-background capitalize">{dataFormatada}</span>
          <span className="text-[10px] font-extrabold text-on-surface-variant/70 uppercase tracking-widest mt-0.5">
            Gestão em Tempo Real
          </span>
        </div>

        {/* ── Sino de Notificações Reativo ── */}
        <div className="relative">
          <button
            onClick={toggleMenuNotificacoes}
            className={`w-10 h-10 rounded-xl hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-all duration-300 relative ${menuAberto ? 'bg-surface-container-high shadow-inner' : ''}`}
            aria-label="Notificações operacionais"
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {naoLidasCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-error text-on-error rounded-full text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                {naoLidasCount}
              </span>
            )}
          </button>

          {/* Overlay invisível para fechar o menu ao clicar fora */}
          {menuAberto && (
            <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(false)} />
          )}

          {/* Painel Dropdown Glassmorphic */}
          {menuAberto && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface-container-high/95 backdrop-blur-xl border border-surface-variant/50 shadow-2xl rounded-2xl z-50 overflow-hidden transition-all duration-300 transform origin-top-right">
              <div className="px-4 py-3 border-b border-surface-variant/40 flex items-center justify-between bg-surface-container-high/50">
                <span className="text-sm font-black text-on-surface">Notificações</span>
                {naoLidasCount > 0 && (
                  <button
                    onClick={marcarTodasComoLidas}
                    className="text-xs font-bold text-primary hover:underline transition-all font-body cursor-pointer bg-transparent border-none"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-surface-variant/20">
                {carregandoNotificacoes ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary text-2xl">sync</span>
                    <span className="text-xs font-bold text-on-surface-variant">Carregando alertas...</span>
                  </div>
                ) : notificacoes.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-4xl">notifications_off</span>
                    <div>
                      <p className="text-xs font-black text-on-surface">Sua unidade está em ordem</p>
                      <p className="text-[10px] text-on-surface-variant/70 mt-0.5">Nenhum alerta operacional pendente.</p>
                    </div>
                  </div>
                ) : (
                  notificacoes.map((notif) => {
                    const config = obterConfigEvento(notif.tipo_evento);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => lidarCliqueNotificacao(notif)}
                        className={`px-4 py-3.5 hover:bg-surface-container-highest flex gap-3 transition-all cursor-pointer items-start ${!notif.lida ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-lg ${config.corBg} flex items-center justify-center flex-shrink-0`}>
                          <span className={`material-symbols-outlined text-lg ${config.corTexto}`}>
                            {config.icone}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs text-on-surface leading-tight ${!notif.lida ? 'font-black' : 'font-bold'}`}>
                            {notif.titulo}
                          </p>
                          <p className="text-xs text-on-surface-variant/90 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.mensagem}
                          </p>
                          <span className="text-[10px] text-on-surface-variant/60 font-semibold mt-1 block">
                            {formatarTempoRelativo(notif.criado_em)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Card do Relógio: visual de vidro jateado (glassmorphism) e fonte monoespaçada 
            para evitar oscilação de largura a cada mudança de dígito */}
        <div className="flex items-center gap-2 bg-surface-container-high/40 backdrop-blur-md px-3.5 py-1.5 md:py-2 rounded-xl border border-surface-variant/40 shadow-sm text-on-surface select-none">
          <span className="material-symbols-outlined text-primary text-[18px] md:text-[20px] animate-pulse flex-shrink-0">
            schedule
          </span>
          <span className="text-sm md:text-base font-bold tracking-wider font-mono">
            {horaFormatada}
          </span>
        </div>
      </div>
    </header>
  );
}