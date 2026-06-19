# TASK — Análise do Card "Atenção Imediata" e Rota /alertas
**Origem:** Claude Cowork (Arquiteto)
**Destino:** Antigravity Agent (Executor)
**Projeto:** Gestão Saúde UBS+
**Tipo:** Leitura+Análise
**Prioridade:** 🔴 Alta — banca em ~2 semanas
**Data:** 2026-06-18

---

## CONTEXTO

O Arquiteto fez uma leitura preliminar e confirmou que o card "Atenção Imediata"
**já existe implementado** em ambas as camadas. A tarefa não é mais de descoberta —
é de auditoria de correção. Há 4 suspeitas concretas de bug/desvio que precisam
ser confirmadas ou descartadas com evidência de arquivo + linha.

---

## ESCOPO OBRIGATÓRIO

Leia os arquivos abaixo na íntegra. Amostragem não é permitida.

| Arquivo | Finalidade |
|---|---|
| `app/frontend/src/pages/gestor/DashboardGestor.jsx` | Toda a lógica do card |
| `app/backend/src/routes/gestor.js` | Rota `GET /alertas` completa |

---

## ANÁLISE REQUERIDA

### 1. Bug suspeito — `dias_parado` como número decimal

**Localização:** `gestor.js` linha ~659

```js
knex.raw('EXTRACT(DAY FROM NOW() - solicitacoes.atualizado_em) AS dias_parado')
```

`EXTRACT(DAY ...)` extrai apenas a parte de dias inteiros de um intervalo.
Ex: 50 horas = 2 dias + 2h → retorna `2` (inteiro). Parece correto.

**Confirme:** execute a análise mental do tipo retornado. `EXTRACT(DAY FROM interval)` 
retorna inteiro ou float em PostgreSQL/Knex? Se for float (ex: `2.0`), verificar se 
o frontend trata isso ou exibe "Parado há 2.0 dias".

**Frontend (DashboardGestor.jsx linha ~154):**
```jsx
<td className="p-4 text-red-600 font-semibold">Parado há {item.dias_parado} dias</td>
```

Há algum `parseInt`, `Math.floor` ou formatação? Responda com evidência da linha.

---

### 2. Bug suspeito — Duplicatas na query

**Localização:** `gestor.js` linhas ~633-648

A query usa três cláusulas `orWhere`. Uma solicitação com `prioridade = 'urgente'`
E `status = 'em_analise'` E `atualizado_em < NOW() - 10 days` satisfaz:
- Regra A (urgente + >48h) ✅
- Regra C (em_analise + >10 dias) ✅

**Verifique:** há algum `DISTINCT`, `GROUP BY` ou deduplicação que previne esse
registro aparecer duas vezes na resposta? Responda com evidência de linha.

Se não há deduplicação: confirmar que isso é um bug (mesma solicitação aparece
duas vezes no card do dashboard).

---

### 3. Bug suspeito — Botão "Ver todos" sem navegação

**Localização:** `DashboardGestor.jsx` linhas ~169-173

```jsx
{alertas.total > 5 && (
  <div className="p-4 bg-white/50 border-t border-red-100 text-center">
    <button className="text-red-700 font-bold text-sm hover:underline">
      Ver todos os {alertas.total} casos
    </button>
  </div>
)}
```

**Verifique:** há `onClick` neste botão? Se não há, o botão é inerte —
clicável visualmente mas sem efeito. Confirme com evidência de linha.

Se não há `onClick`: propor a correção (navegar para `/gestor/pacientes` 
com filtro ou para uma lista dedicada).

---

### 4. Desvio de spec — Texto do botão de ação

**Spec (briefing):** botão "Atualizar" em cada linha da tabela
**Implementado (DashboardGestor.jsx linha ~156-160):** botão "Ver Paciente"

```jsx
<button
  onClick={() => navigate(`/gestor/paciente/${item.paciente_id}`)}
  className="text-sm font-bold text-red-700 hover:text-red-900 underline underline-offset-2"
>
  Ver Paciente
</button>
```

Este desvio é **funcional e aceitável** (navega para o perfil onde o gestor
pode atualizar a solicitação), mas registre formalmente se é intencional
ou descuido. Não é necessário propor correção salvo se o Arquiteto discordar.

---

### 5. Verificação de autenticação

**Localização:** `gestor.js` — linha onde `router.get('/alertas', ...)` é declarada.

Verificar se há middleware de autenticação JWT aplicado nesta rota ou no
router inteiro. Buscar por `authenticateToken`, `verifyToken`, `authMiddleware`
ou similar nas linhas anteriores à rota.

Se a rota não exige autenticação: é uma vulnerabilidade crítica (dados de 
pacientes expostos sem login). Reportar com evidência de linha.

---

## RESTRIÇÕES

- NÃO modificar nenhum arquivo
- NÃO executar comandos
- NÃO fazer amostragem — ler os dois arquivos na íntegra
- Para cada item: confirmar (bug existe) ou descartar (não é bug) com citação direta de linha

---

## STATUS DE RETORNO

Gerar arquivo `REPORT_alertas_analise.md` na raiz do projeto com a seguinte estrutura:

```
# REPORT — Análise Card "Atenção Imediata"
**De:** Antigravity Agent
**Para:** Claude Cowork (Arquiteto)
**Data:** [data]

## Sumário Executivo
[1–3 linhas: tudo ok / X bugs confirmados / recomendo implementação cirúrgica]

## Item 1 — dias_parado decimal
**Status:** [Confirmado bug | Descartado | Atenção]
**Evidência:** [arquivo:linha + trecho de código]
**Impacto:** [...]

## Item 2 — Duplicatas na query
**Status:** [Confirmado bug | Descartado]
**Evidência:** [arquivo:linha + trecho de código]
**Impacto:** [...]

## Item 3 — Botão "Ver todos" sem navegação
**Status:** [Confirmado bug | Descartado]
**Evidência:** [arquivo:linha + trecho de código]
**Proposta de correção:** [diff ou pseudocódigo]

## Item 4 — Desvio "Ver Paciente" vs "Atualizar"
**Status:** [Intencional | Descuido]
**Evidência:** [arquivo:linha]
**Recomendação:** [manter | corrigir]

## Item 5 — Autenticação da rota /alertas
**Status:** [Protegida | VULNERÁVEL]
**Evidência:** [arquivo:linha + trecho de middleware]

## Próximos Passos Recomendados
[Lista dos itens que precisam de implementação cirúrgica, em ordem de criticidade]
```
