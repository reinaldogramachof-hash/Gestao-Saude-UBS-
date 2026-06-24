// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: TopBarGestor
// FUNÇÃO: Barra de navegação superior do portal do gestor. Exibe saudação personalizada,
//         identificação da UBS logada com chip dinâmico e status em tempo real,
//         data atualizada e um relógio minimalista glassmorphic com pulsação suave.
// PROPS:
//   - onAbrirSidebar: callback — abre o drawer lateral da navegação no mobile
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function TopBarGestor({ onAbrirSidebar }) {
  const { user } = useAuth();
  const [dataAtual, setDataAtual] = useState(new Date());
  
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

      {/* ── Lado direito: Data Estendida e Relógio Minimalista Glassmorphic ── */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Data legível por extenso (oculta em telas pequenas) */}
        <div className="hidden lg:flex flex-col items-end justify-center text-right">
          <span className="text-sm font-bold text-on-background capitalize">{dataFormatada}</span>
          <span className="text-[10px] font-extrabold text-on-surface-variant/70 uppercase tracking-widest mt-0.5">
            Gestão em Tempo Real
          </span>
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