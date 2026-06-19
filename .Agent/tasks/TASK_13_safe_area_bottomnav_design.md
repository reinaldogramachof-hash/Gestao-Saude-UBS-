# TASK_13 — Safe Area iOS + Bottom Nav + Refinamentos de Design
## Para o Agente Antigravity

> **Prioridade:** Alta — crítico para banca (iOS é o dispositivo principal de avaliação)
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19
> **Contexto:** TASK_12 entregou Header + Drawer. Bug de safe area confirmado no iPhone XR real.
>              Usuário solicitou barra de navegação inferior com 3 ações fixas + refinamentos visuais.

---

## ITEM 1 — FIX CRÍTICO: Safe Area iOS (HeaderPaciente.jsx + PacienteLayout.jsx)

### Diagnóstico confirmado

`index.html` já tem:
- `viewport-fit=cover` ✅
- `apple-mobile-web-app-status-bar-style: black-translucent` ✅

O `black-translucent` faz o app ocupar a tela inteira, incluindo a área da status bar.
Por isso o conteúdo do `HeaderPaciente` sobrepõe o horário/ícones do iOS.

**Faltante:** `padding-top: env(safe-area-inset-top)` no header.

### Fix em `app/frontend/src/components/paciente/HeaderPaciente.jsx`

Substituir a classe `h-14` por altura dinâmica que soma 56px + safe area do topo:

```jsx
<header
  className="fixed top-0 left-0 right-0 bg-surface-container-lowest border-b border-surface-variant flex items-end justify-between px-4 z-30 shadow-sm"
  style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: 'calc(56px + env(safe-area-inset-top))' }}
>
  {/* conteúdo interno deve ficar em uma div com h-14 para manter os 56px de área clicável */}
  <div className="flex items-center gap-3 h-14">
    {/* hambúrger + logo */}
  </div>
  <div className="h-14 flex items-center">
    {/* sino */}
  </div>
</header>
```

**Lógica:** `padding-top` empurra o conteúdo para baixo da status bar. `minHeight` garante que o header nunca seja menor que 56px (em dispositivos sem notch o `env()` retorna 0).

### Fix em `app/frontend/src/components/paciente/PacienteLayout.jsx`

O `pt-14` (56px) compensa o header. Agora precisa compensar header + safe area:

```jsx
{/* Antes: */}
<div className={`flex-1 overflow-y-auto ${semNav ? '' : 'pt-14'}`}>

{/* Depois: */}
<div
  className={`flex-1 overflow-y-auto ${semNav ? '' : ''}`}
  style={semNav ? {} : { paddingTop: 'calc(56px + env(safe-area-inset-top))' }}
>
```

---

## ITEM 2 — CRIAR: BottomNavSimples.jsx

Nova barra de navegação inferior fixa com **3 itens apenas** — ação rápida para as seções mais acessadas.

### Estrutura visual

```
┌────────────────────────────────┐
│  🏠 Início  [+]  📅 Agenda     │  ← barra branca fixa, shadow-up
└────────────────────────────────┘
```

O botão "+" é um **FAB elevado**: verde sólido, circular, maior que os outros, ligeiramente acima da linha da barra (transform -translate-y-2 ou similar).

### Arquivo a criar: `app/frontend/src/components/paciente/BottomNavSimples.jsx`

```jsx
// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: BottomNavSimples
// FUNÇÃO: Barra de navegação inferior fixa com 3 ações de acesso rápido.
//         Fica sempre visível no portal do paciente.
//         O botão central "+" é um FAB (Floating Action Button) estilizado
//         em verde, ligeiramente elevado acima da barra.
// PROPS:
//   - (sem props externas — usa useNavigate internamente)
// ─────────────────────────────────────────────────────────────────────────────
```

**Especificações dos 3 botões:**

| Posição | Ícone | Label | Rota |
|---------|-------|-------|------|
| Esquerda | `home` (Material Symbols) | Início | `/paciente/dashboard` |
| Centro | `add` (Material Symbols) | Agendar | `/paciente/agendamentos` |
| Direita | `calendar_month` (Material Symbols) | Agenda | `/paciente/agendamentos` |

**Botão central FAB:**
```jsx
// FAB central — destaque verde, elevado acima da barra
<button
  onClick={() => navigate('/paciente/agendamentos')}
  className="relative -top-5 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/40 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
  aria-label="Agendar atendimento"
>
  <span className="material-symbols-outlined text-2xl">add</span>
  <span className="text-[9px] font-semibold leading-none">Agendar</span>
</button>
```

**Botões laterais (Início e Agenda):**
```jsx
// Botão de navegação lateral — ícone + label, sem destaque
<button
  onClick={() => navigate('/paciente/dashboard')}
  className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-on-surface-variant hover:text-primary transition-colors"
>
  <span className="material-symbols-outlined text-2xl">home</span>
  <span className="text-[10px] font-medium">Início</span>
</button>
```

**Safe area no rodapé:** a barra deve ter `padding-bottom: env(safe-area-inset-bottom)` para não ficar atrás da home bar do iPhone:

```jsx
<nav
  className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-surface-variant flex items-center justify-around z-30 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]"
  style={{ paddingBottom: 'env(safe-area-inset-bottom)', minHeight: '64px' }}
>
```

**Highlighting de rota ativa:** usar `useLocation()` para checar se `pathname` começa com a rota do item. Ícone e label do item ativo ficam com `text-primary font-bold`.

### Atualizar PacienteLayout.jsx

Adicionar a `BottomNavSimples` ao layout:

```jsx
import BottomNavSimples from './BottomNavSimples';

// Na estrutura do return:
// ...conteúdo...
// <BottomNavSimples />  ← adicionar aqui, fora do div de conteúdo
```

Adicionar `pb-20` no container de conteúdo para não esconder conteúdo atrás da barra inferior:

```jsx
<div
  style={semNav ? {} : { paddingTop: 'calc(56px + env(safe-area-inset-top))' }}
  className={`flex-1 overflow-y-auto ${semNav ? '' : 'pb-20'}`}
>
```

---

## ITEM 3 — REFINAMENTOS VISUAIS (DashboardPaciente.jsx + globais)

### 3.1 Botão "Ver Detalhes" — trocar cor

O botão "Ver Detalhes" nas cards de solicitação está com fundo `bg-surface-container-low` (quase branco), invisível visualmente.

**Localizar em:** `DashboardPaciente.jsx` e `SolicitacoesPaciente.jsx`

Trocar para **outline verde** (borda primária, texto primário, fundo transparente):

```jsx
// Antes (provavelmente):
className="w-full py-2 rounded-lg bg-surface-container-low text-on-surface-variant text-sm font-medium"

// Depois:
className="w-full py-2 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-colors active:bg-primary/10"
```

### 3.2 Título hero — evitar quebra de linha

Em `DashboardPaciente.jsx`, o título "Minhas Solicitações Ativas" quebra para 2 linhas em 375px.

Localizar o elemento do título e reduzir o tamanho ou ajustar:

```jsx
// Antes (provavelmente text-2xl ou text-xl):
<h2 className="text-xl font-bold text-white">Minhas Solicitações Ativas</h2>

// Depois:
<h2 className="text-lg font-bold text-white leading-tight">Minhas Solicitações Ativas</h2>
```

### 3.3 Touch targets do header — ampliar área clicável

Em `HeaderPaciente.jsx`, os botões já têm `w-10 h-10` (40px). Ampliar para 44px mínimo recomendado (HIG Apple):

```jsx
// Ambos os botões (hamburger e sino):
className="w-11 h-11 rounded-full hover:bg-surface-container-low flex items-center justify-center ..."
```

---

## ORDEM DE EXECUÇÃO

1. Fix `HeaderPaciente.jsx` (safe area inset) — mais crítico
2. Fix `PacienteLayout.jsx` (pt dinâmico + pb-20)
3. Criar `BottomNavSimples.jsx`
4. Adicionar `BottomNavSimples` no `PacienteLayout`
5. Refinamento "Ver Detalhes" em Dashboard e Solicitações
6. Ajuste título hero
7. Touch targets header
8. `npm run build` — verificar 0 erros
9. `git add -A && git commit -m "feat: safe area iOS, bottom nav FAB, refinamentos visuais" && git push`

---

## VALIDAÇÃO APÓS IMPLEMENTAÇÃO

1. iOS (Safari, modo PWA adicionado à tela): header NÃO sobrepõe status bar
2. Android: sem regressão, header continua correto
3. "+" central aparece elevado acima da barra
4. Rota ativa (Início/Agenda) destaca com cor primária
5. "Ver Detalhes" visível com borda verde
6. Título hero cabe em 1 linha em 375px
7. Build limpo
8. Git push → Vercel deploy

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
