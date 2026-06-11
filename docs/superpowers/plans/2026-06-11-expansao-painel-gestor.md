# Expansao do Painel Gestor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expandir os modulos do painel gestor com historico seguro, indicadores operacionais, edicao de dados e criacao repetida de horarios.

**Architecture:** O backend continuara centralizado em `routes/gestor.js`, com consultas sempre limitadas pela UBS autenticada. Cada pagina React manterá seus modais e estados localmente, reutilizando a instancia Axios e os estilos existentes, sem novos componentes ou dependencias.

**Tech Stack:** Express, Knex, PostgreSQL, React 18, React Router, Axios, Tailwind CSS, react-hot-toast e Node Test Runner.

---

### Task 1: Contratos automatizados

**Files:**
- Create: `tests/expansao-painel-gestor-contracts.test.mjs`

- [ ] Criar testes que leem os arquivos de producao e verificam isolamento por UBS, ausencia de CPF, agregacoes, endpoints e estados de interface.
- [ ] Executar `node --test tests\expansao-painel-gestor-contracts.test.mjs`.
- [ ] Confirmar falhas causadas pelas funcionalidades ainda ausentes.

### Task 2: Backend do painel gestor

**Files:**
- Modify: `app/backend/src/routes/gestor.js`

- [ ] Alterar `GET /pacientes` para fazer `LEFT JOIN` com solicitacoes, contar somente pedidos ativos e sinalizar urgencias.
- [ ] Manter a selecao sem CPF e agrupar todos os campos publicos retornados.
- [ ] Adicionar `GET /solicitacao/:id/historico`, validando primeiro o pertencimento pela relacao solicitacao-paciente-UBS.
- [ ] Retornar historico em ordem crescente com nome do gestor via `LEFT JOIN`.
- [ ] Executar os testes de contrato e a verificacao de sintaxe.

### Task 3: Medicamentos

**Files:**
- Modify: `app/frontend/src/pages/gestor/MedicamentosGestor.jsx`

- [ ] Adicionar estado de erro com retry, filtros e contadores derivados da lista.
- [ ] Adicionar modal de cadastro consumindo `POST /gestor/medicamento`.
- [ ] Adicionar modal de edicao consumindo `PUT /gestor/medicamento/:id`.
- [ ] Exibir observacao e data de atualizacao na tabela, preservando o toggle existente.

### Task 4: Perfil do paciente

**Files:**
- Modify: `app/frontend/src/pages/gestor/PerfilPaciente.jsx`

- [ ] Adicionar edicao inline dos campos nome, telefone e email.
- [ ] Salvar via `PUT /gestor/paciente/:id` e recarregar o perfil.
- [ ] Adicionar controle de expansao e cache local de historico por solicitacao.
- [ ] Exibir loading, erro com retry e linha temporal sem alterar os modais existentes.

### Task 5: Lista de pacientes

**Files:**
- Modify: `app/frontend/src/pages/gestor/GestorPacientes.jsx`

- [ ] Enviar pagina e limite na busca, reiniciando a pagina quando o termo mudar.
- [ ] Adicionar coluna de solicitacoes com badge urgente ou ativo.
- [ ] Adicionar navegacao Anterior/Proxima com desabilitacao no inicio e fim.

### Task 6: Agendamentos

**Files:**
- Modify: `app/frontend/src/pages/gestor/AgendamentosGestor.jsx`

- [ ] Adicionar resumo local de disponiveis, reservados e concluidos hoje.
- [ ] Adicionar link de paciente para slots reservados.
- [ ] Adicionar repeticao por dias e POST sequencial com progresso.
- [ ] Preservar filtros e acoes contextuais atuais.

### Task 7: Verificacao e relatorio

**Files:**
- Create: `.Agent/reports/Relatorio_Expansao_Painel_Gestor.md`

- [ ] Executar testes de contrato.
- [ ] Executar `node --check app/backend/src/routes/gestor.js`.
- [ ] Executar `npm.cmd run build` em `app/frontend`.
- [ ] Revisar os JSX alterados por regras de hooks, acessibilidade e chaves de listas.
- [ ] Documentar resultados, decisoes e pendencias no relatorio solicitado.
