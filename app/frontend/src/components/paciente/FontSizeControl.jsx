// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: FontSizeControl
// FUNÇÃO: Permite ao paciente ajustar o tamanho do texto do portal em 3 níveis.
//         A preferência é persistida em localStorage e injetada no :root.
// NÍVEIS:
//   - 1 (Normal / A-)
//   - 1.15 (Médio / A)
//   - 1.3 (Grande / A+)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';

export default function FontSizeControl() {
  const [escala, setEscala] = useState('1');

  // Inicializa o estado com a preferência salva localmente
  useEffect(() => {
    const salva = localStorage.getItem('ubs_font_scale') || '1';
    setEscala(salva);
  }, []);

  // Altera a escala de fonte salvando em localStorage e atualizando o root do documento
  const alterarEscala = (novaEscala) => {
    setEscala(novaEscala);
    localStorage.setItem('ubs_font_scale', novaEscala);
    document.documentElement.style.setProperty('--font-scale', novaEscala);
  };

  const botoes = [
    { valor: '1', rotulo: 'A-', aria: 'Diminuir tamanho da fonte' },
    { valor: '1.15', rotulo: 'A', aria: 'Definir tamanho médio da fonte' },
    { valor: '1.3', rotulo: 'A+', aria: 'Aumentar tamanho da fonte' }
  ];

  return (
    <div
      className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-variant select-none"
      role="group"
      aria-label="Controle de acessibilidade: tamanho do texto"
    >
      {botoes.map((btn) => {
        const ativo = escala === btn.valor;
        return (
          <button
            key={btn.valor}
            onClick={() => alterarEscala(btn.valor)}
            className={`w-9 h-8 flex items-center justify-center rounded-lg text-xs font-extrabold transition-all duration-200 ${
              ativo
                ? 'bg-primary text-on-primary shadow-md scale-105'
                : 'text-on-surface-variant hover:bg-surface-container-high active:scale-95'
            }`}
            aria-label={btn.aria}
            aria-pressed={ativo}
          >
            {btn.rotulo}
          </button>
        );
      })}
    </div>
  );
}
