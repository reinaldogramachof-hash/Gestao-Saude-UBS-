import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function TopBarGestor({ onAbrirSidebar }) {
  const { user } = useAuth();
  const [dataAtual, setDataAtual] = useState(new Date());

  useEffect(() => {
    // Atualiza o relógio a cada minuto
    const timer = setInterval(() => setDataAtual(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatarData = (data) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(data);
  };

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
      
      {/* ── Lado esquerdo: hamburger (mobile) + saudação ── */}
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
          <h2 className="text-lg md:text-2xl font-extrabold text-on-background tracking-tight">
            Olá, {user?.nome?.split(' ')[0] || 'Gestor'}
          </h2>
          <p className="text-xs md:text-sm font-semibold text-on-surface-variant hidden sm:block">
            Portal do Gestor — UBS+
          </p>
        </div>
      </div>

      {/* ── Lado direito: Data e Relógio ── */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="hidden lg:flex flex-col items-end justify-center text-right">
          <span className="text-sm font-bold text-on-background capitalize">{dataFormatada}</span>
          <span className="text-[10px] font-extrabold text-on-surface-variant/70 uppercase tracking-widest mt-0.5">
            Gestão em Tempo Real
          </span>
        </div>
        
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 md:py-2.5 rounded-2xl border border-primary/20 shadow-inner">
          <span className="material-symbols-outlined text-primary text-[20px] md:text-[24px]">schedule</span>
          <span className="text-sm md:text-lg font-black text-primary tracking-widest">{horaFormatada}</span>
        </div>
      </div>
    </header>
  );
}