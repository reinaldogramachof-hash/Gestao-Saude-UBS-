# TASK 02 — Correções cirúrgicas nos 4 módulos novos
**Origem:** Claude Cowork (Arquiteto)
**Destino:** Antigravity Agent (Executor)
**Projeto:** Gestão Saúde UBS+
**Tipo:** Implementação cirúrgica
**Prioridade:** 🔴 Alta — botões inertes serão clicados na demo da banca
**Data:** 2026-06-18

---

## CONTEXTO

Quatro módulos foram adicionados recentemente ao portal do gestor e todos
compartilham os mesmos 3 problemas que precisam ser corrigidos antes da banca:

1. **Botões de ação inertes** — "Ver Detalhes", "Ver Relatório", "Investigar"
   e os botões de criação ("Novo Encaminhamento" etc.) não têm `onClick`
2. **Labels em caixa alta ou com underscore** — violam a regra de linguagem
   simples do projeto
3. **Erros sem feedback** — `catch` só faz `console.error`, gestor não sabe
   que a API falhou

---

## ESCOPO OBRIGATÓRIO — ler na íntegra antes de qualquer mudança

| Arquivo | Problemas a corrigir |
|---|---|
| `app/frontend/src/pages/gestor/RegulacaoGestor.jsx` | Labels VERMELHO/AMARELO/VERDE + botões inertes + catch sem toast |
| `app/frontend/src/pages/gestor/TransporteGestor.jsx` | Status EM_TRANSITO/AGENDADO sem label + catch sem toast |
| `app/frontend/src/pages/gestor/ServicoSocialGestor.jsx` | Vulnerabilidade com underscore + botão inerte + catch sem toast |
| `app/frontend/src/pages/gestor/VigilanciaGestor.jsx` | Status SUSPEITO/CONFIRMADO sem label PT-BR + botões inertes + catch sem toast |

Leitura adicional obrigatória (referência de padrão):
| Arquivo | Por quê ler |
|---|---|
| `app/frontend/src/pages/gestor/MedicamentosGestor.jsx` | Ver como `toast` é importado e usado no projeto |
| `app/frontend/src/pages/gestor/GestorPacientes.jsx` | Ver padrão de `navigate` para perfil do paciente |

---

## CORREÇÕES DETALHADAS POR ARQUIVO

### A. RegulacaoGestor.jsx

**A1 — Labels de prioridade (VERMELHO/AMARELO/VERDE)**
Substituir o texto bruto do badge de prioridade por labels em PT-BR:
```js
// ANTES: {enc.prioridade}   → exibe "VERMELHO"
// ADICIONAR mapa no topo do componente:
const PRIORIDADE_LABELS = {
  VERMELHO: 'Alta',
  AMARELO:  'Média',
  VERDE:    'Baixa',
};
// USAR: {PRIORIDADE_LABELS[enc.prioridade] || enc.prioridade}
```

**A2 — Botão "Novo Encaminhamento"**
Não há modal de criação nesta task (escopo futuro). Adicionar:
```jsx
onClick={() => toast.info('Funcionalidade em implementação — disponível na Fase 2.')}
```

**A3 — Botão "Ver Detalhes" (por linha)**
O objeto `enc` tem `paciente_id`? Verificar na estrutura de dados.
- Se `enc.paciente_id` existe: `onClick={() => navigate('/gestor/paciente/' + enc.paciente_id)}`
- Se não existe: `onClick={() => toast.info('Detalhes disponíveis em breve.')}`
Reportar qual dos dois casos se aplica.

**A4 — catch sem feedback**
```js
// ANTES:
} catch (err) {
  console.error('Erro ao buscar regulação:', err);
}
// DEPOIS:
} catch (err) {
  console.error('[RegulacaoGestor]', err);
  toast.error('Não foi possível carregar os encaminhamentos. Tente novamente.');
}
```

**A5 — Import de toast**
Verificar se `import toast from 'react-hot-toast'` já existe. Se não, adicionar.
Verificar se `useNavigate` já está importado. Se não, adicionar.

---

### B. TransporteGestor.jsx

**B1 — Labels de status**
O mapa `STATUS_CORES` existe mas não há `STATUS_LABELS`. O status é exibido
raw (linha ~57: `{viagem.status}`).
```js
// ADICIONAR:
const STATUS_LABELS = {
  AGENDADO:     'Agendado',
  EM_TRANSITO:  'Em trânsito',
  CONCLUIDO:    'Concluído',
  FALTOU:       'Paciente faltou',
};
// USAR no badge: {STATUS_LABELS[viagem.status] || viagem.status}
```

**B2 — Botão "Agendar Transporte"**
```jsx
onClick={() => toast.info('Agendamento de transporte disponível na Fase 2.')}
```

**B3 — catch sem feedback**
```js
} catch (err) {
  console.error('[TransporteGestor]', err);
  toast.error('Não foi possível carregar as viagens. Tente novamente.');
}
```

**B4 — Import toast**
Adicionar se ausente.

---

### C. ServicoSocialGestor.jsx

**C1 — Label de vulnerabilidade com underscore**
Linha ~89: `caso.vulnerabilidade.replace('_', ' ')` só remove o primeiro underscore.
`VIOLENCIA_DOMESTICA` vira `VIOLENCIA DOMESTICA` — ainda em caixa alta.
```js
// ADICIONAR mapa completo:
const VULNERABILIDADE_LABELS = {
  FOME:                'Insegurança Alimentar',
  VIOLENCIA_DOMESTICA: 'Violência Doméstica',
  ABANDONO_TRATAMENTO: 'Abandono de Tratamento',
  HIGIENE:             'Condições de Higiene',
};
// USAR: {VULNERABILIDADE_LABELS[caso.vulnerabilidade] || caso.vulnerabilidade}
```

**C2 — Botão "Nova Triagem"**
```jsx
onClick={() => toast.info('Triagem social disponível na Fase 2.')}
```

**C3 — Botão "Ver Relatório" (por linha)**
Verificar se `caso.paciente_id` existe na estrutura de dados.
- Se sim: `onClick={() => navigate('/gestor/paciente/' + caso.paciente_id)}`
- Se não: `onClick={() => toast.info('Relatório disponível em breve.')}`
Reportar qual aplica.

**C4 — catch sem feedback**
```js
} catch (err) {
  console.error('[ServicoSocialGestor]', err);
  toast.error('Não foi possível carregar os casos sociais. Tente novamente.');
}
```

---

### D. VigilanciaGestor.jsx

**D1 — Labels de status em inglês**
Linha ~121: `{notificacao.status_investigacao}` exibe "SUSPEITO", "CONFIRMADO".
```js
// ADICIONAR:
const STATUS_LABELS = {
  SUSPEITO:   'Em Investigação',
  CONFIRMADO: 'Confirmado',
  DESCARTADO: 'Descartado',
};
// USAR: {STATUS_LABELS[notificacao.status_investigacao] || notificacao.status_investigacao}
```

**D2 — Botão "Nova Notificação"**
```jsx
onClick={() => toast.info('Notificação epidemiológica disponível na Fase 2.')}
```

**D3 — Botão "Investigar" (por linha)**
Verificar se `notificacao.paciente_id` existe.
- Se sim: `onClick={() => navigate('/gestor/paciente/' + notificacao.paciente_id)}`
- Se não: `onClick={() => toast.info('Investigação disponível em breve.')}`
Reportar qual aplica.

**D4 — catch sem feedback**
```js
} catch (err) {
  console.error('[VigilanciaGestor]', err);
  toast.error('Não foi possível carregar as notificações. Tente novamente.');
}
```

---

## COMENTÁRIOS OBRIGATÓRIOS

Cada arquivo modificado deve receber, no topo, o bloco padrão do projeto:

```jsx
/**
 * PÁGINA: [NomeDoComponente].jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: [descrição em 1-2 linhas]
 * API: [endpoint(s) consumido(s)]
 * ─────────────────────────────────────────────────────────────────────────────
 */
```

E comentários inline nas seções de lógica relevante (fetch, filtros, badges).

---

## RESTRIÇÕES

- Exibir diff completo de cada arquivo modificado antes de aplicar
- NÃO adicionar modais de criação (escopo futuro, fora desta task)
- NÃO remover lógicas existentes — apenas adicionar/substituir os pontos listados
- Para os botões de navegação: confirmar se `paciente_id` existe no objeto
  antes de propor a navegação (verificar a resposta da API ou o seed de dados)

---

## STATUS DE RETORNO

Gerar arquivo `REPORT_02_correcoes_modulos.md` na raiz com:

```
# REPORT 02 — Correções nos 4 módulos novos
**De:** Antigravity Agent
**Para:** Claude Cowork (Arquiteto)
**Data:** [data]

## Sumário Executivo
[X correções aplicadas em Y arquivos — lista das alterações]

## RegulacaoGestor.jsx
**paciente_id disponível:** [Sim / Não — evidência de linha]
**Diff aplicado:** [diff completo]

## TransporteGestor.jsx
**Diff aplicado:** [diff completo]

## ServicoSocialGestor.jsx
**paciente_id disponível:** [Sim / Não — evidência de linha]
**Diff aplicado:** [diff completo]

## VigilanciaGestor.jsx
**paciente_id disponível:** [Sim / Não — evidência de linha]
**Diff aplicado:** [diff completo]

## Pendências identificadas
[Qualquer coisa que não pôde ser resolvida nesta task]
```
