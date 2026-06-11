# Bloco 1 Correcoes Criticas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os sete contratos de seguranca, LGPD, historico, ordenacao e linguagem simples definidos no Bloco 1.

**Architecture:** Manter as rotas e componentes existentes, estreitando consultas e atualizacoes no ponto em que os dados atravessam a fronteira entre UBS, gestor e paciente. Centralizar os rotulos visuais de status em um helper frontend e proteger os contratos por testes estaticos executados com `node:test`, sem depender do banco remoto.

**Tech Stack:** Node.js, Express, Knex, React, Vite, Tailwind CSS e `node:test`.

---

### Task 1: Testes de contrato do Bloco 1

**Files:**
- Create: `tests/bloco1-contracts.test.mjs`

- [ ] Escrever testes que verifiquem: contas ativas, escopo por UBS, transacoes, select seguro do paciente, ordenacao de prioridade, redirecionamento por portal e helper compartilhado.
- [ ] Executar `node --test tests/bloco1-contracts.test.mjs`.
- [ ] Confirmar falha causada pelos contratos ainda ausentes.

### Task 2: Seguranca e integridade no backend

**Files:**
- Modify: `app/backend/src/routes/auth.js`
- Modify: `app/backend/src/routes/gestor.js`
- Modify: `app/backend/src/routes/paciente.js`

- [ ] Restringir autenticacao a contas ativas.
- [ ] Validar a UBS da solicitacao antes de qualquer atualizacao por ID e retornar 403 para recurso de outra unidade.
- [ ] Manter update e historico dentro da mesma transacao.
- [ ] Criar solicitacao e primeiro evento de historico na mesma transacao.
- [ ] Selecionar explicitamente os campos de solicitacao destinados ao paciente.
- [ ] Retornar apenas solicitacoes ativas e ordenar urgente, prioritario e rotina.
- [ ] Executar os testes de contrato e confirmar aprovacao dos itens backend.

### Task 3: Sessao e linguagem simples no frontend

**Files:**
- Create: `app/frontend/src/utils/statusHelper.js`
- Modify: `app/frontend/src/services/api.js`
- Modify: `app/frontend/src/pages/paciente/DashboardPaciente.jsx`
- Modify: `app/frontend/src/pages/paciente/DetalheSolicitacao.jsx`

- [ ] Criar mapas compartilhados de rotulos e cores.
- [ ] Remover descricao tecnica e referencias a campos internos das telas do paciente.
- [ ] Usar rotulos e cores simples no dashboard e na timeline.
- [ ] Preservar o tipo do usuario antes de limpar o storage e redirecionar o 401 ao portal correto.
- [ ] Executar os testes de contrato e confirmar aprovacao dos itens frontend.

### Task 4: Verificacao e relatorio

**Files:**
- Create: `.Agent/reports/Relatorio_Bloco1_Correcoes_Criticas.md`

- [ ] Executar `node --test tests/bloco1-contracts.test.mjs`.
- [ ] Executar checagem sintatica das tres rotas backend.
- [ ] Executar `npm.cmd run build` em `app/frontend`.
- [ ] Revisar o diff para confirmar que nao houve ampliacao de escopo.
- [ ] Registrar arquivos, linhas alteradas, tarefas e resultados no relatorio.
