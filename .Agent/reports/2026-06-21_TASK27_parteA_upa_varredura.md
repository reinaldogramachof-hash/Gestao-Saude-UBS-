# Relatorio de Sessao - TASK_27 Parte A + Varredura

**Data:** 2026-06-21  
**Agente:** Codex Deep Think  
**Escopo:** adicionar tipo `UPA` em `unidades_externas`, atualizar seed/demo e corrigir hardcodes diretos de tipo no frontend.  

## 1. Varredura solicitada

### Migrations com texto livre que deve virar catalogo/FK na Parte B

- `app/backend/src/db/migrations/007_create_solicitacoes.js`
  - Campo equivalente a nome tecnico: `descricao` (`table.string('descricao').notNullable()`), usado como texto livre.
  - Nao contem `especialidade`, `local_executor` ou `nome_tecnico` nominalmente.
- `app/backend/src/db/migrations/011_add_local_executor_solicitacoes.js`
  - `local_executor` em `solicitacoes` como texto livre (`table.string('local_executor', 200).nullable()`).
  - Observacao: este campo nao estava na lista de dois arquivos da diretiva, mas foi mapeado porque e o campo real de local executor.
- `app/backend/src/db/migrations/20260618030419_create_encaminhamentos_table.js`
  - `especialidade` em `encaminhamentos` como texto livre (`table.string('especialidade').notNullable()`).

### Hardcodes de `AME`, `CAPS`, `HOSPITAL`, `UPA` no frontend

- `app/frontend/src/components/externa/ExternaLayout.jsx:8` - comentario de contexto (`AME, CAPS`).
- `app/frontend/src/pages/externa/LoginExterna.jsx:4` - comentario de contexto (`AME, CAPS`).
- `app/frontend/src/pages/gestor/DashboardGestor.jsx:224` - copy de dashboard (`Hospitais, CAPS e AMEs`).
- `app/frontend/src/pages/gestor/RegulacaoGestor.jsx:175` - copy atualizada para incluir UPAs.
- `app/frontend/src/pages/gestor/RegulacaoGestor.jsx:396-399` - select de destino atualizado com `UPA`.
- `app/frontend/src/pages/gestor/PerfilPaciente.jsx:54-56` - mapa de labels atualizado com `upa`.
- `app/frontend/src/pages/gestor/PerfilPaciente.jsx:1147-1149` - select de tipo de unidade atualizado com `upa`.
- `app/frontend/src/pages/gestor/PerfilPaciente.jsx:1162` - placeholder atualizado para citar UPA.
- `app/frontend/src/pages/gestor/PainelMedico.jsx:22-24` - mapa read-only de labels atualizado com `upa`.
- Falsos positivos:
  - `app/frontend/src/services/api.js:8` (`AUTOMATICAMENTE`).
  - `app/frontend/src/components/gestor/GestorLayout.jsx:8` (`COMPORTAMENTO`).
  - `app/frontend/src/pages/gestor/ServicoSocialGestor.jsx` (`TRATAMENTO`, `ACOMPANHAMENTO`).

### Rotas que recebem ou retornam `especialidade` como texto livre

- `app/backend/src/routes/externa.js:24` - retorna `encaminhamentos.especialidade`.
- `app/backend/src/routes/paciente.js:253` - retorna `especialidade`.
- `app/backend/src/routes/paciente.js:528` - retorna `encaminhamentos.especialidade`.
- `app/backend/src/routes/gestor.js:128` e `181` - listas de campos sensiveis/publicos incluem `especialidade`.
- `app/backend/src/routes/gestor.js:712-737` - atendimento clinico recebe e grava `especialidade`.
- `app/backend/src/routes/gestor.js:777-787` - edicao de atendimento clinico recebe e atualiza `especialidade`.
- `app/backend/src/routes/gestor.js:1517-1545` - criacao de encaminhamento recebe e grava `especialidade`.
- `app/backend/src/routes/gestor.js:1576` - historico usa `especialidade` no texto da observacao.

## 2. Alteracoes aplicadas

- Criada `app/backend/src/db/migrations/022_add_upa_to_unidades_externas.js`.
  - `up`: recria a CHECK constraint incluindo `UPA`.
  - `down`: restaura a CHECK constraint anterior sem `UPA`.
- Atualizada `app/backend/src/db/seeds/004_unidades_externas.js`.
  - Adicionadas `UPA Norte SJC` e `UPA Sul SJC` com senha demo `externa123`.
- Atualizados hardcodes de tipo no frontend:
  - `app/frontend/src/pages/gestor/RegulacaoGestor.jsx`
  - `app/frontend/src/pages/gestor/PerfilPaciente.jsx`
  - `app/frontend/src/pages/gestor/PainelMedico.jsx`
- Criado teste de contrato `tests/task27-upa-contracts.test.mjs`.

## 3. Restricoes respeitadas

- Nao foram alteradas as tabelas `encaminhamentos` ou `solicitacoes`.
- Nao foi implementado catalogo, combobox ou modulo de configuracao da Parte B.
- A Parte B permanece documentada em `.Agent/tasks/TASK_27_catalogo_procedimentos_upa.md`.

## 4. Verificacao

- `node --test tests\task27-upa-contracts.test.mjs`
  - Resultado: 3 pass, 0 fail.
- `node --test`
  - Resultado: 45 pass, 0 fail.
- `npm.cmd run build` em `app/frontend`
  - Resultado: build aprovado.
  - Aviso nao bloqueante: Vite reportou import dinamico/estatico de `react-hot-toast`, ja existente no projeto.
- `node -e "require('./src/db/knex'); console.log('knex ok')"` em `app/backend`
  - Resultado: `knex ok`.

## 5. Banco e login externo

- `npm.cmd run migrate` em `app/backend`
  - Resultado: `Batch 12 run: 1 migrations`.
- `npx.cmd knex seed:run --specific=004_unidades_externas.js --env production`
  - Resultado: `Ran 1 seed files`.
- Login de producao em `POST https://gestao-saude-ubs-api.vercel.app/api/auth/login-externa`
  - Credencial: `upa.norte@sjc.sp.gov.br / externa123`.
  - Resultado seguro documentado: `ok=true`, `nome=UPA Norte SJC`, `tipo=externa`, `tipo_unidade=UPA`, `token_version=0`.
  - Token retornado, mas nao registrado neste relatorio.

## 6. Observacoes finais

- Existem alteracoes pendentes anteriores fora desta tarefa em arquivos do portal do paciente e no briefing da Parte B. Elas nao foram modificadas nesta sessao.
- Nao foi feito commit nesta sessao porque a diretiva da TASK_27 Parte A nao pediu commit/push.
