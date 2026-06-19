# TASK_12 — Redesign de Navegação do Portal do Paciente
## Para o Agente Antigravity

> **Prioridade:** Alta — impacto visual direto antes da banca  
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19  
> **Contexto:** O `BottomNavPaciente` atual tem 6 itens — apertado em 375px. O novo layout usa drawer lateral + header fixo com sino de notificações.

---

## OBJETIVO

Substituir o `BottomNavPaciente` por um padrão **Header + Drawer lateral** (hamburger menu), deixando a tela principal mais limpa. O badge de comunicados não lidos migra para o sino no header.

---

## ARQUITETURA DO NOVO LAYOUT

```
┌─────────────────────────┐
│ ☰  UBS+     🔔(4)       │  ← HeaderPaciente (fixo no topo)
├─────────────────────────┤
│                         │
│   [conteúdo da página]  │  ← área scrollável (igual ao atual)
│                         │
└─────────────────────────┘

Drawer (desliza da esquerda quando ☰ é tocado):
┌──────────────────┐
│ 👤 Reinaldo      │  ← nome do paciente + UBS
│ UBS Alto da Ponte│
├──────────────────┤
│ 🏠 Início        │
│ 💊 Medicamentos  │
│ 🔔 Avisos    [4] │  ← badge de não lidos
│ 📅 Agenda        │
│ 👤 Perfil        │
├──────────────────┤
│ ⬇️  Instalar App │  ← se PWA disponível
├──────────────────┤
│ 🚪 Sair          │
└──────────────────┘
```

---

## ARQUIVOS A CRIAR / MODIFICAR

### 1. CRIAR: `app/frontend/src/components/paciente/HeaderPaciente.jsx`

Componente de header fixo no topo. Props: `onOpenDrawer`, `unreadCount`.

```jsx
// Estrutura visual esperada:
// [☰ hamburger] [UBS+ logo] [espaço flex-1] [🔔 sino com badge]
```

- Hambúrger: `menu` (Material Icons) — abre o drawer via `onOpenDrawer()`
- Logo: ícone `health_and_safety` + texto "UBS+" em verde (igual ao que estava no BottomNav desktop)
- Sino: ícone `notifications` com badge vermelho quando `unreadCount > 0`
- Clicar no sino navega para `/paciente/comunicados`
- Fundo: `bg-surface-container-lowest` + `border-b border-surface-variant` + `shadow-sm`
- Altura: `h-14` (56px) — área de toque adequada

### 2. CRIAR: `app/frontend/src/components/paciente/DrawerPaciente.jsx`

Drawer lateral que desliza da esquerda. Props: `aberto`, `onClose`, `unreadCount`, `pacienteNome`, `ubsNome`.

```jsx
// Estrutura:
// - Overlay escuro semitransparente ao clicar fora fecha o drawer
// - Painel branco (w-64) com lista de links
// - Transição CSS: translate-x-(-full) → translate-x-0
```

- Cabeçalho do drawer: ícone `account_circle` + nome do paciente + UBS (buscar do localStorage/contexto de auth)
- Links com ícones idênticos ao BottomNav atual
- Badge de não lidos ao lado de "Avisos"
- Botão "Instalar App" aparece somente se PWA disponível (reutilizar lógica do `usePWAInstall`)
- Botão "Sair" no rodapé do drawer com ícone `logout` e cor vermelha no hover
- Fechar drawer ao clicar em qualquer link de navegação

### 3. MODIFICAR: `app/frontend/src/components/paciente/PacienteLayout.jsx`

Remover a importação do `BottomNavPaciente`. Adicionar `HeaderPaciente` + `DrawerPaciente`.

O `PacienteLayout` passa a gerenciar dois estados:
- `drawerAberto` — boolean (default false)
- `unreadCount` — number (default 0, buscado via `/api/paciente/comunicados`)

```jsx
// Nova estrutura do PacienteLayout:
// <div h-screen flex-col>
//   <HeaderPaciente onOpenDrawer={...} unreadCount={unreadCount} />  ← fixo no topo
//   <div flex-1 overflow-y-auto pt-14>  ← pt-14 para compensar o header fixo
//     {children}
//   </div>
//   <DrawerPaciente aberto={drawerAberto} onClose={...} unreadCount={unreadCount} ... />
// </div>
```

A lógica de `unreadCount` que estava no `BottomNavPaciente` (useEffect + api.get) deve migrar para cá.

### 4. MANTER (não deletar): `BottomNavPaciente.jsx`

Manter o arquivo por segurança, mas não importar mais no `PacienteLayout`. Adicionar comentário no topo:
```js
// DEPRECIADO em 2026-06-19 — substituído por HeaderPaciente + DrawerPaciente (TASK_12)
// Mantido para referência histórica. Não importar.
```

---

## COMPORTAMENTO DO DRAWER (detalhe técnico)

```css
/* Drawer fechado */
transform: translateX(-100%);
transition: transform 0.25s ease-in-out;

/* Drawer aberto */
transform: translateX(0);
```

Overlay (fundo escuro): `fixed inset-0 bg-black/40 z-40` — aparece quando drawer aberto, clicar fecha.  
Drawer: `fixed left-0 top-0 h-full w-64 bg-surface z-50 shadow-xl flex flex-col`

---

## AJUSTE NO DASHBOARD (DashboardPaciente.jsx)

Com o header agora fixo no topo (altura 56px), o padding-top do conteúdo já é tratado pelo `PacienteLayout` (pt-14). Verificar se o `DashboardPaciente` tem padding-top manual e remover se duplicado.

---

## REGRAS DE COMENTÁRIOS (CLAUDE.md)

Todo código novo deve ter comentário de bloco no topo:

```jsx
// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: HeaderPaciente
// FUNÇÃO: Header fixo no topo do portal do paciente.
//         Exibe hamburger para abrir o drawer, logo UBS+ e sino de notificações.
//         O badge vermelho no sino mostra a contagem de comunicados não lidos.
// PROPS:
//   - onOpenDrawer: function — callback para abrir o DrawerPaciente
//   - unreadCount: number — quantidade de comunicados não lidos
// ─────────────────────────────────────────────────────────────────────────────
```

---

## VALIDAÇÃO APÓS IMPLEMENTAÇÃO

1. Abrir em 375px — header visível, conteúdo não sobrepõe o header
2. Tocar ☰ — drawer abre com animação suave
3. Tocar fora do drawer — fecha
4. Tocar um link no drawer — fecha o drawer e navega
5. Sino mostra badge quando há comunicados não lidos
6. Clicar no sino navega para `/paciente/comunicados`
7. Botão Sair no drawer faz logout
8. Build limpo: `npm run build`
9. `git add -A && git commit -m "feat: header + drawer lateral substituem bottom nav" && git push`

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
