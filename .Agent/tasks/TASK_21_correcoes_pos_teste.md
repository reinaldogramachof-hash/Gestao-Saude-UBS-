# TASK_21 — Correções Pós-Teste Funcional
## Para o Agente Antigravity

> **Prioridade:** 🔴 Alta — contém bug real de língua portuguesa e UX inconsistente
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19
> **Origem:** Análise de screenshots do teste funcional pós-TASK_20
>
> **Arquivos alterados:**
> - `app/frontend/src/pages/paciente/AgendamentosPaciente.jsx` (bug capitalize + formato data)
> - `app/frontend/src/pages/paciente/PerfilPaciente.jsx` (formatação telefone)
> - `app/frontend/src/pages/paciente/Medicamentos.jsx` (header mais compacto)
> - `app/frontend/src/pages/paciente/ComunicadosPaciente.jsx` (space-y entre cards)

---

## ITEM 1 — BUG CRÍTICO: Capitalização incorreta nas datas de Agendamentos

### Problema
A classe `capitalize` do Tailwind aplica `text-transform: capitalize`, que capitaliza
a **primeira letra de cada palavra**. Em português isso gera erros gramaticais:

```
"Domingo, 12 De Julho, Às 14:00"
                 ↑          ↑
         preposição maiúscula = erro gramatical
```

Correto seria: "Domingo, 12 de julho, às 14:00"

### Fix em AgendamentosPaciente.jsx

#### 1a. Corrigir a função formatarDataHora (~linha 111)

```js
// ANTES:
const formatarDataHora = (dt) => {
  const dateStr = dt.includes('T') ? dt : dt + 'T12:00:00';
  const data = new Date(dateStr).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const hora = new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data}, às ${hora}`;
};

// DEPOIS:
const formatarDataHora = (dt) => {
  const dateStr = dt.includes('T') ? dt : dt + 'T12:00:00';
  const data = new Date(dateStr).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const hora = new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  // Capitaliza apenas a primeira letra do dia da semana (português correto).
  // NÃO usar CSS 'capitalize' pois capitaliza cada palavra individualmente.
  const str = `${data}, às ${hora}`;
  return str.charAt(0).toUpperCase() + str.slice(1);
};
```

#### 1b. Remover a classe `capitalize` dos parágrafos de data

Localizar TODAS as ocorrências de `capitalize` em AgendamentosPaciente.jsx e remover.
São tipicamente os `<p>` que chamam `formatarDataHora(...)`.

**Horários disponíveis** (~linha 156):
```jsx
// ANTES:
<p className="font-bold text-on-background capitalize text-sm">{formatarDataHora(slot.data_hora)}</p>

// DEPOIS:
<p className="font-bold text-on-background text-sm">{formatarDataHora(slot.data_hora)}</p>
```

**Meus agendamentos** (~linha 183):
```jsx
// ANTES:
<p className="font-bold text-on-background capitalize text-sm">{formatarDataHora(ag.data_hora)}</p>

// DEPOIS:
<p className="font-bold text-on-background text-sm">{formatarDataHora(ag.data_hora)}</p>
```

**Modal de confirmação de reserva** (~linha 225):
```jsx
// ANTES:
<p className="text-primary font-extrabold capitalize text-sm">{formatarDataHora(slotSelecionado.data_hora)}</p>

// DEPOIS:
<p className="text-primary font-extrabold text-sm">{formatarDataHora(slotSelecionado.data_hora)}</p>
```

**Modal de confirmação de cancelamento** (~linha 261):
```jsx
// ANTES:
<p className="text-sm text-on-surface-variant mb-1 capitalize font-medium">
  {formatarDataHora(agendamentoCancelando.data_hora)}
</p>

// DEPOIS:
<p className="text-sm text-on-surface-variant mb-1 font-medium">
  {formatarDataHora(agendamentoCancelando.data_hora)}
</p>
```

**Resultado esperado:** "Domingo, 12 de julho, às 14:00" (sem capitalização de "de" e "às")

---

## ITEM 2 — Formato de data mais compacto nos slots disponíveis

O texto "Domingo, 12 de julho, às 14:00" quebra em duas linhas no card, tornando
o card mais alto do que deveria. Nos **slots disponíveis** (não em "Meus Agendamentos"),
usar um formato mais curto que não quebre linha.

Criar uma segunda função apenas para listagem compacta:

```js
// Formato compacto para listagem de horários: "Dom, 12/07 · 14:00"
// Usado nos cards de horários disponíveis para evitar quebra de linha.
const formatarSlotCompacto = (dt) => {
  const dateStr = dt.includes('T') ? dt : dt + 'T12:00:00';
  const d = new Date(dateStr);
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dia = diasSemana[d.getDay()];
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia}, ${data} · ${hora}`;
};
```

Aplicar **apenas nos slots disponíveis** (~linha 156):
```jsx
// ANTES:
<p className="font-bold text-on-background text-sm">{formatarDataHora(slot.data_hora)}</p>
<p className="text-xs text-on-surface-variant font-medium mt-1">{slot.duracao_minutos} minutos</p>

// DEPOIS:
<p className="font-bold text-on-background text-sm">{formatarSlotCompacto(slot.data_hora)}</p>
<p className="text-xs text-on-surface-variant font-medium mt-0.5">{slot.duracao_minutos} min</p>
```

> "Meus Agendamentos" mantém `formatarDataHora` completo — lá o usuário precisa do detalhe.
> O modal também mantém `formatarDataHora` completo — contexto de confirmação.

---

## ITEM 3 — Perfil: formatar telefone

O telefone é exibido como número bruto "12992191018" sem máscara.
Adicionar função de formatação em `PerfilPaciente.jsx`:

```js
// Formata telefone brasileiro para exibição: "12992191018" → "(12) 99219-1018"
// Suporta celular (11 dígitos) e fixo (10 dígitos).
const formatarTelefone = (tel) => {
  if (!tel || tel === '—') return tel || '—';
  const nums = tel.replace(/\D/g, '');
  if (nums.length === 11) {
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  }
  if (nums.length === 10) {
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
  }
  return tel; // formato desconhecido: exibe como veio
};
```

Localizar o campo de telefone no JSX e aplicar:
```jsx
// ANTES (padrão de exibição dos campos):
{valorOuPlaceholder(perfil.telefone)}

// DEPOIS:
{valorOuPlaceholder(perfil.telefone ? formatarTelefone(perfil.telefone) : null)}
```

> Aplicar APENAS no campo telefone. CPF mantém seu próprio helper `mascaraCPF`.

---

## ITEM 4 — Medicamentos: header mais compacto

O header "Consulta de Estoque" ocupa ~35% da altura visível em 375px.
Reduzir o título e o espaçamento interno do cabeçalho:

```jsx
// ANTES (~linha 57):
<header className="bg-primary pt-12 pb-4 px-6">
  <h1 className="text-on-primary text-2xl font-extrabold">Consulta de Estoque</h1>
  <p className="text-white/70 text-sm mt-1 mb-4">Medicamentos disponíveis na sua UBS</p>

// DEPOIS:
<header className="bg-primary pt-12 pb-3 px-6">
  <h1 className="text-on-primary text-xl font-extrabold">Consulta de Estoque</h1>
  <p className="text-white/70 text-xs mt-0.5 mb-3">Medicamentos disponíveis na sua UBS</p>
```

E o campo de busca já tem `mb-4` de espaçamento que pode ser `mb-3`:
Verificar no JSX e ajustar conforme necessário.

---

## ITEM 5 — Comunicados: reduzir gap entre cards

Os cards de comunicados têm `space-y-3` após a TASK_20, mas nos prints
o espaçamento entre eles ainda parece moderado. Manter `space-y-3` ou
verificar se está aplicado. Se ainda estiver `space-y-4`, ajustar para `space-y-3`.

Verificar e confirmar:
```jsx
// Localizar a div wrapper dos cards e garantir:
<div className="space-y-3 md:space-y-4">
  {comunicadosOrdenados.map(c => ...)}
</div>
```

---

## VALIDAÇÃO

1. "Domingo, 12 de julho, às 14:00" — "de" e "às" em minúsculo ✓
2. Slots disponíveis no formato "Dom, 12/07 · 14:00" sem quebra de linha no card ✓
3. "Meus Agendamentos" mantém o formato completo ✓
4. Telefone no Perfil exibe "(12) 99219-1018" (ou formato equivalente) ✓
5. Header "Consulta de Estoque" mais compacto — ocupa menos altura ✓
6. Build limpo, sem erros ✓
7. Git commit + push ✓

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
