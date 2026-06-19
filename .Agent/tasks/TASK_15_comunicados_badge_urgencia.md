# TASK_15 — Comunicados: Badge Sync + Urgência Visual
## Para o Agente Antigravity

> **Prioridade:** 🟡 Média-Alta — corrige bug visível + melhora percepção de qualidade
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19
> **Arquivos:** `ComunicadosPaciente.jsx` + `PacienteLayout.jsx`

---

## ITEM 1 — BUG: Sino do Header não atualiza após leitura na mesma sessão

### Diagnóstico
O `unreadCount` no `PacienteLayout` é atualizado via `useEffect` que depende de `[pathname]`.
Quando o paciente abre `/paciente/comunicados` e expande um comunicado (marcando como lido),
o estado local do `ComunicadosPaciente` se atualiza corretamente — mas o sino no Header
continua exibindo o número antigo até o paciente navegar para outra página.

### Fix

Em `ComunicadosPaciente.jsx`, após marcar como lido com sucesso, forçar re-fetch no layout:

**Opção A (mais simples):** Usar `window.dispatchEvent` com custom event

Em `ComunicadosPaciente.jsx`, na função `handleExpandir`, após o `api.post` bem-sucedido:

```jsx
// Após: setComunicados(prev => prev.map(...))
// Dispara evento para que o PacienteLayout re-busque o contador de não lidos
window.dispatchEvent(new CustomEvent('comunicado-lido'));
```

Em `PacienteLayout.jsx`, no `useEffect` que busca comunicados, adicionar listener:

```jsx
useEffect(() => {
  if (semNav || !user) return;

  const buscarContagem = () => {
    api.get('/paciente/comunicados')
      .then(r => {
        const unread = r.data.filter(c => !c.lido).length;
        setUnreadCount(unread);
      })
      .catch(() => {});
  };

  buscarContagem(); // executa na montagem e na troca de rota

  // Escuta o evento quando o paciente marca um comunicado como lido dentro da página
  window.addEventListener('comunicado-lido', buscarContagem);
  return () => window.removeEventListener('comunicado-lido', buscarContagem);
}, [pathname, semNav, user]);
```

---

## ITEM 2 — URGÊNCIA VISUAL nos comunicados

### Problema atual
Todos os comunicados têm o mesmo visual. Um aviso de "Vacina amanhã — compareça às 8h" e
"Novidades sobre o sistema" são visualmente idênticos. Sem prioridade visual.

### O que usar: campo `tipo` já existente

O backend retorna `tipo: 'geral' | 'individual'`. Precisamos de um terceiro nível semântico:
o campo `urgente` (boolean) que pode vir do backend.

**Verificar se o campo `urgente` existe na tabela `comunicados`.** Se não existir, usar uma
heurística simples baseada em palavras-chave no título para a demo. Se existir, usá-lo diretamente.

### Heurística para demo (se campo não existir no banco)

```jsx
// Detecta urgência por palavras-chave no título — fallback enquanto campo não está no banco
const isUrgente = (titulo) => {
  const palavras = ['urgente', 'urgência', 'amanhã', 'hoje', 'prazo', 'imediato', 'alerta', 'atenção'];
  return palavras.some(p => titulo.toLowerCase().includes(p));
};
```

### Três estilos visuais de card

```jsx
// Urgente (campo urgente=true OU heurística)
'bg-red-50 border-red-300 border-l-4 border-l-red-500'
// ícone: 'priority_high', cor do ícone: 'bg-red-100 text-red-600'

// Não lido (padrão atual — azul)
'bg-blue-50 border-blue-200'
// ícone: 'campaign', cor: 'bg-primary/10 text-primary'

// Lido
'bg-surface-container-lowest border-surface-variant'
// ícone: 'campaign', cor: 'bg-surface-container-low text-on-surface-variant'
```

### Badge de urgência

No canto superior direito do card, quando urgente:

```jsx
{isUrgenteComunicado && (
  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
    Urgente
  </span>
)}
```

### Ordenação: urgentes primeiro

Antes de renderizar a lista, reordenar:

```jsx
// Urgentes não lidos → não lidos → lidos
const comunicadosOrdenados = [...comunicados].sort((a, b) => {
  const urgA = isUrgente(a.titulo) ? 2 : 0;
  const urgB = isUrgente(b.titulo) ? 2 : 0;
  const lidoA = a.lido ? 0 : 1;
  const lidoB = b.lido ? 0 : 1;
  return (urgB + lidoB) - (urgA + lidoA);
});
```

---

## ITEM 3 — "Marcar todos como lido" button

Adicionar botão discreto no header da página quando há não lidos:

```jsx
{/* No header, ao lado do contador de novos */}
{unreadCount > 0 && (
  <button
    onClick={marcarTodosLido}
    className="text-white/70 text-xs hover:text-white underline mt-1 block"
  >
    Marcar todos como lido
  </button>
)}
```

Implementar a função `marcarTodosLido`:

```jsx
const marcarTodosLido = async () => {
  // Chama o endpoint para cada comunicado não lido em paralelo
  const naoLidos = comunicados.filter(c => !c.lido);
  await Promise.allSettled(naoLidos.map(c => api.post(`/paciente/comunicado/${c.id}/lido`)));
  // Atualiza estado local
  setComunicados(prev => prev.map(c => ({ ...c, lido: true })));
  // Sincroniza o sino do header
  window.dispatchEvent(new CustomEvent('comunicado-lido'));
};
```

---

## VALIDAÇÃO

1. Expandir um comunicado → sino do header atualiza imediatamente (sem precisar trocar de página)
2. Clicar "Marcar todos como lido" → todos os cards ficam cinza, sino vai para 0
3. Comunicados urgentes aparecem com borda vermelha e no topo da lista
4. Badge "Urgente" animado visível nos cards relevantes
5. Ordering: urgentes → não lidos → lidos
6. Build limpo, git commit + push

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
