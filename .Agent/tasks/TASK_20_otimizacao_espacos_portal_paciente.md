# TASK_20 — Otimização de Espaços: Portal do Paciente
## Para o Agente Antigravity

> **Prioridade:** 🟡 Média — impacta densidade de informação e conforto de uso em celular
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19
> **Escopo:** Somente Portal do Paciente (PacienteLayout + páginas de paciente)
> **Objetivo:** Maximizar conteúdo visível sem scroll em telas de 375–430px.
>
> **Arquivos alterados:**
> - `app/frontend/src/pages/paciente/DashboardPaciente.jsx`
> - `app/frontend/src/pages/paciente/SolicitacoesPaciente.jsx`
> - `app/frontend/src/pages/paciente/AgendamentosPaciente.jsx`
> - `app/frontend/src/pages/paciente/Medicamentos.jsx`
> - `app/frontend/src/pages/paciente/ComunicadosPaciente.jsx`

---

## CONTEXTO

Após a análise módulo a módulo, foram identificados padrões que consomem espaço
vertical sem agregar valor de leitura:

1. **Botão "Ver Detalhes" em linha própria** — maior desperdício individual (~52px/card)
2. **Padding generoso nos cards** — `p-5` funciona no desktop, mas em mobile comprime o conteúdo útil
3. **Espaçamento entre seções** — `space-y-8` (32px) é grande para telas pequenas
4. **Headers de módulo** — `pb-6` em todos os cabeçalhos verdes; `pb-4` bastaria

---

## ITEM 1 — MAIOR GANHO: Eliminar botão "Ver Detalhes" dos cards de solicitação

O maior desperdício de espaço é o botão "Ver Detalhes" em linha dedicada no final de
cada card de solicitação. O card inteiro já tem `hover:scale-[1.01]` sugerindo
que foi pensado para ser clicável — só faltou conectar o onClick no wrapper.

### 1a. DashboardPaciente.jsx — cards inline de solicitação (~linha 244)

O card atual:
```jsx
<div
  key={sol.id}
  className={`bg-surface-container-lowest p-5 rounded-2xl shadow-sm border-y border-r transition-all hover:scale-[1.01] hover:shadow-md duration-200 ${
    sol.prioridade === 'urgente'
      ? 'border-l-4 border-l-red-500 border-red-300'
      : 'border-l-4 border-l-primary border-surface-variant'
  }`}
>
```

Deve virar um `<button>` clicável (remove a necessidade do botão interno):
```jsx
<button
  key={sol.id}
  onClick={() => navigate(`/paciente/solicitacao/${sol.id}`)}
  className={`w-full text-left bg-surface-container-lowest p-4 rounded-2xl shadow-sm border-y border-r transition-all hover:scale-[1.01] hover:shadow-md active:scale-[0.99] duration-200 ${
    sol.prioridade === 'urgente'
      ? 'border-l-4 border-l-red-500 border-red-300'
      : 'border-l-4 border-l-primary border-surface-variant'
  }`}
>
```
> Mudanças: `<div>` → `<button>`, adicionado `onClick`, `w-full text-left`, `active:scale-[0.99]`, padding `p-5` → `p-4`.

O chip de status (logo abaixo):
```jsx
// ANTES:
<div className={`rounded-xl p-3 mb-4 ${STATUS_CORES[sol.status] || 'bg-surface-container-low text-on-surface'}`}>

// DEPOIS: mb-4 → mb-0 (removemos o botão abaixo, não precisa mais de margem inferior)
<div className={`rounded-xl p-3 ${STATUS_CORES[sol.status] || 'bg-surface-container-low text-on-surface'}`}>
```

**Remover completamente** o botão "Ver Detalhes" interno:
```jsx
// REMOVER ESTE BLOCO:
<button
  onClick={() => navigate(`/paciente/solicitacao/${sol.id}`)}
  className="w-full py-2.5 rounded-xl border border-primary text-primary text-sm font-bold hover:bg-primary/5 active:bg-primary/10 transition-colors text-center"
>
  Ver Detalhes
</button>
```

**Fechar** com `</button>` em vez de `</div>`.

### 1b. SolicitacoesPaciente.jsx — componente CardSolicitacao (~linha 30)

Mesmo padrão. Transformar o wrapper `<div>` em `<button>` clicável:

```jsx
// ANTES:
function CardSolicitacao({ sol, navigate }) {
  return (
    <div
      className={`bg-white p-5 rounded-2xl shadow-sm border-y border-r transition-all hover:scale-[1.01] hover:shadow-md duration-200 ${
        sol.prioridade === 'urgente'
          ? 'border-l-4 border-l-red-500 border-red-300'
          : 'border-l-4 border-l-primary border-surface-variant'
      }`}
    >

// DEPOIS:
function CardSolicitacao({ sol, navigate }) {
  return (
    <button
      onClick={() => navigate(`/paciente/solicitacao/${sol.id}`)}
      className={`w-full text-left bg-white p-4 rounded-2xl shadow-sm border-y border-r transition-all hover:scale-[1.01] hover:shadow-md active:scale-[0.99] duration-200 ${
        sol.prioridade === 'urgente'
          ? 'border-l-4 border-l-red-500 border-red-300'
          : 'border-l-4 border-l-primary border-surface-variant'
      }`}
    >
```

Chip de status:
```jsx
// ANTES:
<div className={`rounded-xl px-3 py-2 mb-3 ${STATUS_CORES[sol.status] || 'bg-surface-container-low text-on-surface'}`}>

// DEPOIS:
<div className={`rounded-xl px-3 py-2 ${STATUS_CORES[sol.status] || 'bg-surface-container-low text-on-surface'}`}>
```

**Remover completamente** o botão "Ver Detalhes":
```jsx
// REMOVER:
<button
  onClick={() => navigate(`/paciente/solicitacao/${sol.id}`)}
  className="w-full py-2 rounded-xl border border-primary text-primary text-sm font-bold hover:bg-primary/5 active:bg-primary/10 transition-colors text-center"
>
  Ver Detalhes
</button>
```

Fechar com `</button>` no lugar de `</div>`.

> **Ganho estimado:** ~52px por card (36px botão + 16px margem eliminada).
> Com 3 cards visíveis: recupera ~156px de viewport — equivale a mostrar 1 card extra sem scroll.

---

## ITEM 2 — Padding de cards (mobile-first)

Reduzir o padding interno dos cards de `p-5` (20px) para `p-4` (16px) em todos os módulos.
São 4px de ganho em cada lado = 8px de altura vertical por card.

### 2a. Medicamentos.jsx — card do medicamento (~linha 120)

```jsx
// ANTES:
<div key={m.id} className="bg-surface-container-lowest p-5 rounded-2xl ...">

// DEPOIS:
<div key={m.id} className="bg-surface-container-lowest p-4 rounded-2xl ...">
```

### 2b. AgendamentosPaciente.jsx — cards de horários disponíveis (~linha 154)

```jsx
// ANTES:
<div key={slot.id} className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-5 flex ...">

// DEPOIS:
<div key={slot.id} className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-4 flex ...">
```

### 2c. AgendamentosPaciente.jsx — cards de "Meus Agendamentos" (~linha 180)

```jsx
// ANTES:
<div key={ag.id} className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-5">

// DEPOIS:
<div key={ag.id} className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-4">
```

### 2d. ComunicadosPaciente.jsx — cards (~linha 187)

Localizar o card container dos comunicados e reduzir:
```jsx
// ANTES: (verificar no arquivo, mas padrão típico é)
className="... p-4 md:p-6 ..."

// DEPOIS:
className="... p-3 md:p-5 ..."
```

---

## ITEM 3 — Espaçamento entre seções

### 3a. AgendamentosPaciente.jsx — main (~linha 126)

```jsx
// ANTES:
<main className="px-6 py-6 space-y-8">

// DEPOIS:
<main className="px-6 py-5 space-y-5">
```

### 3b. SolicitacoesPaciente.jsx — main (~linha 161)

```jsx
// ANTES:
<main className="px-6 py-6 space-y-8 pb-28">

// DEPOIS:
<main className="px-6 py-5 space-y-5 pb-28">
```

---

## ITEM 4 — Header dos módulos (padding inferior)

Todos os módulos têm `pb-6` no header verde. `pb-4` é suficiente — economiza 8px por módulo sem perda de respiração visual.

**Aplicar em:**

- `SolicitacoesPaciente.jsx`:
  ```jsx
  // ANTES:
  <header className="bg-primary pt-12 pb-6 px-6">
  // DEPOIS:
  <header className="bg-primary pt-12 pb-4 px-6">
  ```

- `AgendamentosPaciente.jsx`:
  ```jsx
  // ANTES:
  <header className="bg-primary pt-12 pb-6 px-6">
  // DEPOIS:
  <header className="bg-primary pt-12 pb-4 px-6">
  ```

- `Medicamentos.jsx`:
  ```jsx
  // ANTES:
  <header className="bg-primary pt-12 pb-5 px-6">
  // DEPOIS:
  <header className="bg-primary pt-12 pb-4 px-6">
  ```

- `ComunicadosPaciente.jsx`: verificar e aplicar o mesmo padrão `pb-4`.

---

## ITEM 5 — Dashboard hero (header principal)

O hero verde do Dashboard tem `pb-12` para criar espaço de sobreposição com o grid de cards.
Pode ser comprimido para `pb-8` — o grid abaixo tem sua própria margem negativa (`-mt-6`).
Ajustar para:

```jsx
// Localizar (~linha 168):
// ANTES:
<header className="bg-primary pt-4 pb-12 px-6 rounded-b-[1.5rem] ...">

// DEPOIS:
<header className="bg-primary pt-4 pb-8 px-6 rounded-b-[1.5rem] ...">
```

**Importante:** Ao reduzir o `pb`, verificar se a `section` do grid logo abaixo precisa de ajuste de `pt`. Se o grid usar `-mt-` negativo para sobrepor o header, manter a lógica atual, apenas reduzindo o overlap de 48px para 32px.

---

## VALIDAÇÃO

1. Em 375px, cards de solicitação são clicáveis no corpo todo (sem botão "Ver Detalhes") ✓
2. Clicar em qualquer área do card navega para `/paciente/solicitacao/:id` ✓
3. Solicitações ativas: pelo menos 2 cards visíveis sem scroll em iPhone 14 Pro ✓
4. Nenhum texto ou elemento cortado / espremido após redução de padding ✓
5. Estado vazio e estados de loading permanecem bem espaçados ✓
6. Build sem erros, comportamento responsivo desktop intacto ✓
7. Git commit + push ✓

---

## NOTA SOBRE CORREÇÃO JÁ APLICADA

O bug visual encontrado na TASK_18 — botão de confirmação de cancelamento
`bg-red-50 text-white` (texto invisível) → `bg-red-500 text-white` — **já foi
corrigido diretamente pelo arquiteto** em `AgendamentosPaciente.jsx`. Não é
necessário reaplicar esta correção.

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
