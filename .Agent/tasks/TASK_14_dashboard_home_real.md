# TASK_14 — Dashboard: Home Screen Real
## Para o Agente Antigravity

> **Prioridade:** 🔴 Alta — maior impacto visual na banca
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19
> **Arquivo:** `app/frontend/src/pages/paciente/DashboardPaciente.jsx`
> **Contexto:** O Dashboard hoje é "um app de solicitações com hero". Com 6 módulos no portal,
>              a home deve ser um painel real que resume o estado de cada módulo.

---

## OBJETIVO

Transformar o `DashboardPaciente` em uma verdadeira **home screen** com:
1. Hero compacto (já feito — manter)
2. **Grid de cards-resumo** com o estado atual de cada módulo
3. Solicitations ativas abaixo (manter, já implementado)

---

## LAYOUT ALVO

```
┌─────────────────────────────────┐
│ Hero verde compacto             │  ← já existe, manter como está
│ BEM-VINDO(A) / Nome / UBS       │
├─────────────────────────────────┤
│ ┌──────────┐  ┌──────────────┐ │
│ │ 🔔 Avisos│  │ 📅 Próximo   │ │  ← linha 1 do grid
│ │ 2 novos  │  │ Seg 10h      │ │
│ └──────────┘  └──────────────┘ │
│ ┌──────────┐  ┌──────────────┐ │
│ │ 💊 Medic.│  │ 📋 Solicit.  │ │  ← linha 2 do grid
│ │ Consultar│  │ 1 ativa      │ │
│ └──────────┘  └──────────────┘ │
├─────────────────────────────────┤
│ Minhas Solicitações Ativas      │  ← seção existente, manter
│ [card]                          │
│ [Ver todas →]                   │
└─────────────────────────────────┘
```

---

## IMPLEMENTAÇÃO

### Passo 1: Novas chamadas de API no `fetchDados`

Adicionar duas chamadas ao `Promise.all` existente:

```jsx
Promise.all([
  api.get('/paciente/meus-dados'),
  api.get('/paciente/minhas-solicitacoes'),
  api.get('/paciente/comunicados'),           // NOVO — para contar não lidos
  api.get('/paciente/agendamentos/meus'),     // NOVO — para próximo agendamento
])
  .then(([rDados, rSols, rComuns, rAgendamentos]) => {
    setPaciente(rDados.data);
    setSols(rSols.data);
    setUnreadComunicados(rComuns.data.filter(c => !c.lido).length);
    
    // Filtra agendamentos futuros e pega o mais próximo
    const agora = new Date();
    const futuros = rAgendamentos.data
      .filter(ag => ag.status === 'reservado' && new Date(ag.data_hora) > agora)
      .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
    setProximoAgendamento(futuros[0] || null);
  })
```

Adicionar novos estados:
```jsx
const [unreadComunicados, setUnreadComunicados] = useState(0);
const [proximoAgendamento, setProximoAgendamento] = useState(null);
```

### Passo 2: Helper de formatação

```jsx
// Formata o próximo agendamento de forma curta — "Seg, 23/06 às 10h"
const formatarProximoAg = (dataHora) => {
  if (!dataHora) return null;
  const dateStr = dataHora.includes('T') ? dataHora : dataHora + 'T12:00:00';
  const d = new Date(dateStr);
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dia = diasSemana[d.getDay()];
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia}, ${data} às ${hora}`;
};
```

### Passo 3: Componente QuickAccessCard (definir fora do componente pai)

```jsx
// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: QuickAccessCard
// FUNÇÃO: Card de acesso rápido na home screen. Exibe ícone, título, valor resumido
//         e navega ao clicar. Usado no grid 2x2 do Dashboard.
// PROPS:
//   - icon: string — Material Symbol
//   - titulo: string — nome do módulo
//   - valor: string — resumo do estado atual
//   - cor: string — classe Tailwind para a cor do ícone (ex: 'text-blue-600')
//   - bg: string — classe Tailwind para o fundo do ícone (ex: 'bg-blue-50')
//   - rota: string — rota de destino
//   - badge: number|null — número vermelho no canto superior direito (opcional)
//   - navigate: function — passado do pai
// ─────────────────────────────────────────────────────────────────────────────
function QuickAccessCard({ icon, titulo, valor, cor, bg, rota, badge, navigate }) {
  return (
    <button
      onClick={() => navigate(rota)}
      className="flex-1 min-w-0 bg-surface-container-lowest rounded-2xl border border-surface-variant p-4 text-left shadow-sm hover:shadow-md active:scale-[0.98] transition-all relative"
    >
      {/* Badge de notificação no canto superior direito */}
      {badge > 0 && (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-extrabold w-4 h-4 flex items-center justify-center rounded-full">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
        <span className={`material-symbols-outlined text-xl ${cor}`}>{icon}</span>
      </div>
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">{titulo}</p>
      <p className="text-sm font-bold text-on-surface leading-tight">{valor}</p>
    </button>
  );
}
```

### Passo 4: Grid de cards no JSX (inserir ENTRE o hero e a seção de solicitações)

```jsx
{/* ── Grid de acesso rápido aos módulos ── */}
<section className="px-6 pt-4 pb-2">
  <div className="flex gap-3 mb-3">
    <QuickAccessCard
      icon="notifications"
      titulo="Avisos"
      valor={unreadComunicados > 0 ? `${unreadComunicados} novo${unreadComunicados > 1 ? 's' : ''}` : 'Sem novidades'}
      cor="text-blue-600"
      bg="bg-blue-50"
      rota="/paciente/comunicados"
      badge={unreadComunicados}
      navigate={navigate}
    />
    <QuickAccessCard
      icon="calendar_month"
      titulo="Próximo Agendamento"
      valor={proximoAgendamento ? formatarProximoAg(proximoAgendamento.data_hora) : 'Sem agendamentos'}
      cor="text-emerald-600"
      bg="bg-emerald-50"
      rota="/paciente/agendamentos"
      badge={null}
      navigate={navigate}
    />
  </div>
  <div className="flex gap-3">
    <QuickAccessCard
      icon="medication"
      titulo="Medicamentos"
      valor="Consultar estoque"
      cor="text-purple-600"
      bg="bg-purple-50"
      rota="/paciente/medicamentos"
      badge={null}
      navigate={navigate}
    />
    <QuickAccessCard
      icon="folder_open"
      titulo="Solicitações"
      valor={sols.length > 0 ? `${sols.length} ativa${sols.length > 1 ? 's' : ''}` : 'Nenhuma ativa'}
      cor="text-primary"
      bg="bg-primary/10"
      rota="/paciente/solicitacoes"
      badge={null}
      navigate={navigate}
    />
  </div>
</section>
```

### Passo 5: Skeleton loader (atualizar para incluir o grid)

O skeleton existente deve incluir um bloco para o grid de cards:

```jsx
{/* Skeleton do grid de acesso rápido */}
<div className="px-6 pt-4 pb-2">
  <div className="flex gap-3 mb-3">
    <div className="flex-1 h-28 bg-surface-container-low rounded-2xl animate-pulse" />
    <div className="flex-1 h-28 bg-surface-container-low rounded-2xl animate-pulse" />
  </div>
  <div className="flex gap-3">
    <div className="flex-1 h-28 bg-surface-container-low rounded-2xl animate-pulse" />
    <div className="flex-1 h-28 bg-surface-container-low rounded-2xl animate-pulse" />
  </div>
</div>
```

---

## POSIÇÃO DO GRID NO JSX (referência)

```
<PacienteLayout>
  <header>          ← hero verde (manter)
  </header>
  <section>         ← NOVO: grid 2x2 de quick access
  </section>
  <main>            ← solicitations ativas (manter, com padding-bottom)
  </main>
</PacienteLayout>
```

---

## VALIDAÇÃO

1. Em 375px: 4 cards em grid 2x2, todos tocáveis sem scroll
2. Clicar em cada card navega para o módulo correto
3. Badge vermelho aparece no card de Avisos quando há não lidos
4. Próximo agendamento exibe a data correta (ou "Sem agendamentos")
5. Sem agendamento futuro: card mostra "Sem agendamentos" (não quebra)
6. Solicitations logo abaixo do grid
7. Build limpo
8. Git commit + push

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
