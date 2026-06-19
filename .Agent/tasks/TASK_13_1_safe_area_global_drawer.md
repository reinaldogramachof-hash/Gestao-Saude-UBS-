# TASK_13.1 — Safe Area Global (CSS Vars) + Fix DrawerPaciente
## Para o Agente Antigravity

> **Prioridade:** Alta — fix visual crítico para banca, 2 arquivos apenas
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19
> **Contexto:** O header já tem safe area. O DrawerPaciente não tem. A abordagem
>              atual duplica `env()` inline em cada componente. Centralizar em CSS vars.

---

## ITEM 1 — CENTRALIZAR: `app/frontend/src/index.css`

Adicionar bloco de CSS custom properties LOGO APÓS `@tailwind utilities;`:

```css
/* ─────────────────────────────────────────────────────────────────────────────
 * SAFE AREA — Custom Properties Globais
 * Detectam automaticamente os recortes do dispositivo (notch, dynamic island,
 * barra de gestos do Android, home indicator do iPhone).
 * Valor padrão 0px para dispositivos sem safe area (Android, desktop).
 *
 * USO NOS COMPONENTES: style={{ paddingTop: 'var(--safe-top)' }}
 *                       style={{ paddingBottom: 'var(--safe-bottom)' }}
 *
 * Para compensar header + safe area do topo: var(--content-top)
 * Para compensar bottom nav + safe area do rodapé: var(--content-bottom)
 * ───────────────────────────────────────────────────────────────────────────── */
:root {
  --safe-top:    env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left:   env(safe-area-inset-left, 0px);
  --safe-right:  env(safe-area-inset-right, 0px);

  /* Alturas fixas dos elementos de layout — alterar aqui reflete em todo o app */
  --header-h:     56px;
  --bottom-nav-h: 64px;

  /* Offsets de conteúdo: usados no padding-top e padding-bottom do container */
  --content-top:    calc(var(--header-h) + var(--safe-top));
  --content-bottom: calc(var(--bottom-nav-h) + var(--safe-bottom));
}
```

---

## ITEM 2 — FIX CRÍTICO: `app/frontend/src/components/paciente/DrawerPaciente.jsx`

### Problema
O `<header>` do drawer (linha 53) começa em `top-0` do viewport.
Com `black-translucent`, `top-0` fica atrás da barra de status do iOS.
O nome do paciente e a UBS ficam atrás do horário na tela.

### Fix
Substituir a classe `p-6` pela combinação `px-6 pb-6` + `paddingTop` dinâmico via CSS var:

```jsx
{/* ANTES: */}
<header className="p-6 bg-primary text-on-primary flex flex-col gap-3">

{/* DEPOIS: */}
<header
  className="px-6 pb-6 bg-primary text-on-primary flex flex-col gap-3"
  style={{ paddingTop: 'calc(var(--safe-top) + 24px)' }}
>
```

**Lógica:** `var(--safe-top)` empurra o conteúdo abaixo da status bar. Os `+ 24px` são o padding original que o `p-6` fornecia no topo (24px = 6 * 4px).

---

## ITEM 3 — REFATORAR: Substituir `env()` inline pelos vars globais

Nos componentes que já aplicam safe area inline, substituir para usar os CSS vars.
Isso não muda comportamento — só centraliza a fonte da verdade.

### `HeaderPaciente.jsx`

```jsx
{/* ANTES: */}
style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: 'calc(56px + env(safe-area-inset-top))' }}

{/* DEPOIS: */}
style={{ paddingTop: 'var(--safe-top)', minHeight: 'var(--content-top)' }}
```

### `PacienteLayout.jsx` (container de conteúdo)

```jsx
{/* ANTES: */}
style={semNav ? {} : { paddingTop: 'calc(56px + env(safe-area-inset-top))' }}

{/* DEPOIS: */}
style={semNav ? {} : { paddingTop: 'var(--content-top)' }}
```

### `BottomNavSimples.jsx` (padding do rodapé)

```jsx
{/* ANTES: */}
style={{ paddingBottom: 'env(safe-area-inset-bottom)', minHeight: '64px' }}

{/* DEPOIS: */}
style={{ paddingBottom: 'var(--safe-bottom)', minHeight: 'var(--bottom-nav-h)' }}
```

---

## ORDEM DE EXECUÇÃO

1. Editar `index.css` — adicionar bloco `:root` com CSS vars
2. Editar `DrawerPaciente.jsx` — fix do header do drawer (Item 2)
3. Refatorar `HeaderPaciente.jsx` para usar `var()` (Item 3)
4. Refatorar `PacienteLayout.jsx` para usar `var()` (Item 3)
5. Refatorar `BottomNavSimples.jsx` para usar `var()` (Item 3)
6. `npm run build` — confirmar 0 erros
7. `git add -A && git commit -m "fix: safe area global via CSS vars, corrige drawer iOS" && git push`

---

## VALIDAÇÃO

1. iPhone XR: abrir drawer → nome e UBS aparecem ABAIXO da status bar, não atrás dela
2. Android: layout sem regressão (vars retornam 0px em dispositivos sem safe area)
3. Header continua abaixo da status bar (regressão do TASK_13)
4. Bottom nav alinhada corretamente com home indicator
5. Comportamento idêntico em desktop/tablet

---

## NOTA PARA O AGENTE

Este padrão de CSS vars é a forma canônica de lidar com safe areas em PWAs.
Ao centralizar em `:root`, qualquer novo componente que precise de safe area
simplesmente usa `var(--safe-top)` ou `var(--content-top)` — sem precisar
lembrar da sintaxe `env()` e sem risco de duplicar valores divergentes.

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
