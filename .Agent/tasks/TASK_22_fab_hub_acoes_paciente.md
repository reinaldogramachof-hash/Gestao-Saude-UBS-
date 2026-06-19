# TASK_22 — FAB "+" como Hub de Intake do Paciente
## Para o Agente Antigravity

> **Prioridade:** 🟡 Média-Alta — diferencia o FAB da navegação duplicada e cria fluxo de intake guiado
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19
> **Deadline:** Antes da banca — 25/06/2026
>
> **Arquivos alterados:**
> - `app/frontend/src/components/paciente/BottomNavSimples.jsx` (principal — FAB sheet)
> - `app/frontend/src/pages/paciente/AgendamentosPaciente.jsx` (leitura de router state + auto-open modal)

---

## CONTEXTO

Atualmente o botão FAB "+" e o botão "Agenda" na barra inferior fazem **exatamente a mesma coisa**:
ambos chamam `navigate('/paciente/agendamentos')`.

O objetivo desta task é transformar o "+" em um **hub de intake**: quando o paciente toca "+" ele
expressa uma necessidade. O sistema guia com 4 categorias, pre-preenche o campo `motivo` do
agendamento e abre o modal de reserva na página de Agendamentos já pronto para confirmar.

**Após esta task, os dois botões têm semânticas distintas:**
- "+" = "Preciso de algo da UBS" → intake guiado, começa com categoria
- "Agenda" (ícone calendario) = "Ver meus agendamentos" → navega para a página completa

---

## ITEM 1 — BottomNavSimples.jsx: Bottom Sheet de Categorias

### 1a. Adicionar state `fabAberto`

```jsx
// Controla a visibilidade do action sheet do FAB
const [fabAberto, setFabAberto] = useState(false);
```

### 1b. Alterar o onClick do FAB

```jsx
// ANTES:
onClick={() => navigate('/paciente/agendamentos')}

// DEPOIS:
onClick={() => setFabAberto(prev => !prev)}
```

### 1c. Adicionar o Bottom Sheet após o `<nav>` wrapper

O sheet deve ser renderizado **dentro** do componente mas **fora** do `<nav>`, como um portal fixo.
Posicionar com `fixed inset-x-0 bottom-0 z-50`.

```jsx
{/* ── FAB Action Sheet ── */}
{/* Overlay escuro semitransparente que fecha o sheet ao clicar fora */}
{fabAberto && (
  <>
    <div
      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
      onClick={() => setFabAberto(false)}
    />
    <div className="fixed inset-x-0 bottom-0 z-50 bg-surface-container-lowest rounded-t-[2rem] shadow-2xl pb-safe">
      {/* Handle visual de arraste */}
      <div className="w-10 h-1 bg-surface-variant rounded-full mx-auto mt-3 mb-1" />

      {/* Título do sheet */}
      <div className="px-6 pt-3 pb-4">
        <h3 className="text-base font-extrabold text-on-background">O que você precisa?</h3>
        <p className="text-xs text-on-surface-variant mt-0.5">Escolha o assunto para agendar um atendimento</p>
      </div>

      {/* Grid de categorias */}
      <div className="px-4 pb-6 grid grid-cols-2 gap-3">
        {CATEGORIAS_FAB.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoria(cat)}
            className="flex flex-col items-start gap-2 p-4 bg-surface-container rounded-2xl border border-surface-variant active:scale-[0.97] transition-transform"
          >
            <span className={`material-symbols-outlined text-2xl ${cat.cor}`}>{cat.icone}</span>
            <div>
              <p className="text-sm font-bold text-on-background leading-tight">{cat.titulo}</p>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">{cat.subtitulo}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  </>
)}
```

### 1d. Definir as categorias (antes do componente, no escopo do módulo)

```jsx
// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIAS_FAB — opções de intake do paciente no action sheet do botão "+"
// Cada categoria sugere um motivo inicial que será pré-preenchido no modal
// de reserva de agendamento, ajudando o gestor a se preparar para o atendimento.
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIAS_FAB = [
  {
    id: 'consulta',
    titulo: 'Consulta médica',
    subtitulo: 'Preciso ver um médico',
    icone: 'stethoscope',
    cor: 'text-primary',
    motivo: 'Gostaria de agendar uma consulta médica. ',
  },
  {
    id: 'exame',
    titulo: 'Exame ou resultado',
    subtitulo: 'Dúvida sobre exame',
    icone: 'biotech',
    cor: 'text-blue-500',
    motivo: 'Tenho uma dúvida sobre meu exame ou resultado. ',
  },
  {
    id: 'medicamento',
    titulo: 'Medicamento',
    subtitulo: 'Retirada ou dúvida',
    icone: 'medication',
    cor: 'text-emerald-600',
    motivo: 'Preciso de informações sobre retirada de medicamento. ',
  },
  {
    id: 'outro',
    titulo: 'Outro assunto',
    subtitulo: 'Outro motivo',
    icone: 'help_outline',
    cor: 'text-on-surface-variant',
    motivo: '',
  },
];
```

> **Nota sobre ícone:** `stethoscope` e `medication` são ícones do Material Symbols já disponível
> no projeto (CDN). Verificar se estão na variante "outlined" — se não existirem, usar
> `medical_services` e `local_pharmacy` como fallback.

### 1e. Handler `handleCategoria`

```jsx
// Ao selecionar uma categoria, fecha o sheet e navega para Agendamentos
// passando o motivo sugerido como state do React Router.
// A página de Agendamentos lê este state e abre o modal de reserva pré-preenchido.
const handleCategoria = (cat) => {
  setFabAberto(false);
  navigate('/paciente/agendamentos', {
    state: { motivoSugerido: cat.motivo, abrirModal: true },
  });
};
```

---

## ITEM 2 — AgendamentosPaciente.jsx: Ler state e pré-abrir modal

### 2a. Importar `useLocation`

```jsx
// ANTES:
import React, { useState, useEffect, useRef } from 'react';

// DEPOIS:
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
// (useNavigate já está importado — verificar se está no import do react-router-dom)
```

### 2b. Usar o location no componente

Adicionar logo após as declarações de state existentes:

```jsx
const location = useLocation();
```

### 2c. useEffect que lê o state do router após carregamento

**IMPORTANTE:** O modal só deve abrir depois que os slots disponíveis forem carregados.
A lógica deve ser: se `location.state?.abrirModal === true` e os dados já carregaram,
verificar se existe ao menos 1 slot disponível:
- Se sim: selecionar o primeiro slot, pré-preencher o motivo e abrir o modal
- Se não: exibir um toast informando que não há horários disponíveis no momento

```jsx
// Abre automaticamente o modal de reserva quando o paciente chega via FAB "+"
// com uma categoria de intake selecionada. Só executa após o carregamento completo.
useEffect(() => {
  if (!loading && location.state?.abrirModal) {
    if (disponiveis.length > 0) {
      // Pré-seleciona o primeiro slot disponível e preenche o motivo sugerido
      setSlotSelecionado(disponiveis[0]);
      setMotivo(location.state.motivoSugerido || '');
      setModalAberto(true);
    } else {
      // Nenhum horário disponível: informa o paciente sem abrir o modal
      toast('Não há horários disponíveis no momento. Tente novamente em breve.', {
        icon: '📅',
      });
    }
    // Limpa o state do router para evitar re-trigger em navegação futura
    // (substitui o history entry atual sem o state)
    window.history.replaceState({}, document.title);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [loading]);
```

> **Por que `[loading]` como dependência?** O `loading` começa `true` e vai para `false` quando
> os dados chegam. Este efeito roda exatamente neste momento, quando `disponiveis` já está
> populado. Rodar em `[disponiveis]` causaria loop pois `disponiveis` é um array novo a cada fetch.

---

## ITEM 3 — Ajuste visual: indicar que o modal veio do FAB

Quando o modal de reserva é aberto via FAB (com motivo pré-preenchido), o campo de observações
deve mostrar que o motivo foi sugerido. Pequena melhoria:

```jsx
{/* Campo de motivo — opcional mas recomendado para ajudar o gestor */}
<div className="space-y-2">
  <label className="text-sm font-bold text-on-surface-variant">
    Observações {motivo ? '' : '(opcional)'}
  </label>
  <textarea
    rows={3}
    placeholder="Ex: Tenho dificuldade de locomoção, necessito de acompanhante, trarei documentos antigos..."
    value={motivo}
    onChange={e => setMotivo(e.target.value)}
    className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none"
  />
  {/* Dica: quando pré-preenchido pelo FAB, lembra o paciente de complementar */}
  {motivo && (
    <p className="text-xs text-on-surface-variant">
      Complete com mais detalhes se quiser.
    </p>
  )}
</div>
```

---

## ITEM 4 — Animação de entrada do FAB sheet (CSS Tailwind)

O sheet deve entrar por baixo. Usar classes de animação do Tailwind com `animate-`:

```jsx
// Na div do sheet principal, adicionar:
className="fixed inset-x-0 bottom-0 z-50 bg-surface-container-lowest rounded-t-[2rem] shadow-2xl pb-safe animate-slide-up"
```

Se `animate-slide-up` não estiver definido no projeto (verificar `tailwind.config.js`),
usar a alternativa sem animação — **não criar config nova se não existir**:
```jsx
// Fallback sem animação customizada:
className="fixed inset-x-0 bottom-0 z-50 bg-surface-container-lowest rounded-t-[2rem] shadow-2xl pb-safe"
```

> **Verificar no `tailwind.config.js`:** se existe `keyframes` com `slide-up`. Se não existir,
> não adicionar — estabilidade é prioridade antes da banca.

---

## VALIDAÇÃO

1. Tocar "+" abre o action sheet com 4 categorias ✓
2. Tocar fora do sheet (overlay) fecha sem navegar ✓
3. Tocar em "Consulta médica" navega para Agendamentos e abre o modal com motivo pré-preenchido ✓
4. Tocar em "Outro assunto" navega para Agendamentos e abre o modal com motivo vazio ✓
5. Se não há horários disponíveis: toast informativo, modal NÃO abre ✓
6. Botão "Agenda" na barra inferior continua navegando para `/paciente/agendamentos` normalmente (SEM abrir modal) ✓
7. Teclar "Voltar" do navegador após a navegação não re-abre o modal (state limpo) ✓
8. Build limpo sem erros de TypeScript/PropTypes ✓
9. Layout em 375px: sheet não ultrapassa 90% da altura da tela ✓
10. Git commit + push ✓

---

## O QUE NÃO FAZER

- ❌ Não adicionar FAB nem bottom sheet no portal do gestor — gestor usa sidebar desktop
- ❌ Não criar nova rota de API — toda lógica usa endpoints existentes
- ❌ Não replicar a lógica de fetch de slots dentro do BottomNavSimples — o Agendamentos já faz isso
- ❌ Não remover o botão "Agenda" da barra — continua com sua função de navegação direta
- ❌ Não adicionar animações customizadas no tailwind.config.js — sem mudanças de config antes da banca

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
