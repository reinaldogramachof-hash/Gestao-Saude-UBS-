# Relatorio de Sessao - TASK_29 Bridge Solicitacao -> Encaminhamento

**Data:** 2026-06-21  
**Agente:** Codex Deep Think  
**Escopo:** corrigir o bug estrutural em que solicitacoes com `unidade_externa_id` nao apareciam no portal externo porque nenhum registro era criado em `encaminhamentos`.

## 1. Diagnostico

- `solicitacoes.unidade_externa_id` apenas guardava o destino escolhido no modal do gestor.
- O portal externo lista a tabela `encaminhamentos`, filtrando por `encaminhamentos.unidade_externa_id`.
- Como a criacao de solicitacao nao criava o encaminhamento correspondente, AME/CAPS/HOSPITAL/UPA recebiam login funcional, mas nao viam a demanda nova.
- `pushService.enviar` ja aceita qualquer `tipo_usuario` salvo em `push_subscriptions`; o tipo `externa` nao exigiu alteracao estrutural.

## 2. Alteracoes aplicadas

- `app/backend/src/db/migrations/025_add_unidade_externa_feedback_to_encaminhamentos.js`
  - Criada migration idempotente para garantir os campos usados pelo portal externo em `encaminhamentos`.
  - Os checks com `hasColumn` rodam antes do `alterTable`, evitando `await` assincrono dentro do builder do Knex.
  - Campos cobertos: `unidade_externa_id`, `data_procedimento_unidade`, `confirmado_paciente`, `feedback_tipo`, `feedback_conduta`, `feedback_data_retorno`.
  - O `down` e intencionalmente nao destrutivo, pois esses campos tambem podem ter sido criados pela migration 021 e ja sao contrato ativo.
- `app/backend/src/routes/gestor.js`
  - `POST /gestor/paciente/:id/solicitacao` agora busca dados explicitos de catalogo e unidade externa antes da transacao.
  - Quando `unidade_externa_id` e enviado, cria um registro em `encaminhamentos` dentro da mesma transacao da solicitacao e do historico inicial.
  - O encaminhamento herda `paciente_id`, `ubs_id`, `gestor_id`, `solicitacao_id`, `unidade_externa_id`, `destino`, `especialidade`, `prioridade`, `status` e `data_solicitacao`.
  - Apos a transacao, dispara push para o paciente e para a unidade externa sem desfazer o registro caso a notificacao falhe.
- `app/backend/src/routes/externa.js`
  - `GET /externa/encaminhamentos` agora faz join com `solicitacoes` e `catalogo_procedimentos`.
  - A resposta inclui `catalogo_nome` e `solicitacao_id` para o portal externo exibir o procedimento padronizado e manter rastreabilidade.
  - O filtro de unidade externa foi qualificado como `encaminhamentos.unidade_externa_id` para evitar SQL ambiguo depois do join com `solicitacoes`.
- `app/frontend/src/pages/externa/EncaminhamentosExterna.jsx`
  - Removido uso da rota inexistente `/externa/encaminhamento/:id/status`.
  - Adicionado dispatcher para chamar exatamente `/receber`, `/agendar` e `/concluir`.
  - Payload de agendamento passa a enviar `data_procedimento_unidade`.
  - Payload de retorno passa a enviar `feedback_conduta`.
  - Status `CONFIRMADO_PACIENTE` voltou a aparecer com chip proprio e botao de registrar retorno.
- `app/frontend/src/pages/externa/DashboardExterna.jsx`
  - `concluidosHoje` agora usa diretamente `feedback_data_retorno?.slice(0, 10) === hojeISO`, campo retornado pelo backend corrigido.
- `tests/task29-bridge.test.mjs`
  - Novo contrato cobrindo migration 025, bridge transacional, ausencia de bridge sem unidade externa, push externo/paciente, join do catalogo no portal externo e compatibilidade do `pushService` com `tipo_usuario = externa`.
- `tests/task29-externa-frontend-contracts.test.mjs`
  - Novo contrato para impedir regressao dos endpoints e payloads do portal externo.
- `tests/bloco1-contracts.test.mjs`
  - Contrato do interceptor 401 atualizado para o storage segmentado por portal (`getUserKey`) ja presente no frontend.

## 3. Verificacao

- `node --test tests\task29-bridge.test.mjs`
  - Resultado inicial esperado: 4 pass, 2 fail por ausencia da migration 025 e `solicitacao_id` fora do SELECT externo.
  - Resultado final: 6 pass, 0 fail.
- `node --test tests\task29-externa-frontend-contracts.test.mjs`
  - Resultado inicial esperado: 0 pass, 4 fail por rota `/status`, payloads antigos e ausencia de `CONFIRMADO_PACIENTE`.
  - Resultado final: 4 pass, 0 fail.
- `node --test`
  - Resultado final pos-ajustes frontend: 66 pass, 0 fail.
- `npm.cmd run build` em `app/frontend`
  - Resultado: build Vite concluido com sucesso.
  - Observacao: permanece apenas o aviso existente do Vite sobre import dinamico/estatico de `react-hot-toast`.
- `node -e "require('./src/routes/gestor'); require('./src/routes/externa'); console.log('task29 routes ok')"` em `app/backend`
  - Resultado: `task29 routes ok`.
- Smoke local do endpoint externo:
  - Login externo `upa.norte@sjc.sp.gov.br`.
  - `GET http://localhost:3001/api/externa/encaminhamentos`: respondeu sem 500, com `0` itens para a unidade testada.
- `npm.cmd run migrate` em `app/backend`
  - Primeira tentativa bloqueada pelo sandbox com `EACCES`.
  - Execucao com permissao elevada: `Batch 14 run: 1 migrations`.
- Consulta de confirmacao via Knex:
  - `knex_migrations`: `025_add_unidade_externa_feedback_to_encaminhamentos.js`, batch `14`.
  - Colunas presentes em `encaminhamentos`: `unidade_externa_id`, `data_procedimento_unidade`, `confirmado_paciente`, `feedback_tipo`, `feedback_conduta`, `feedback_data_retorno`.

## 4. Observacoes

- `data_procedimento_unidade` aparece no banco como `timestamp with time zone` porque a coluna ja existia pela migration 021; a 025 nao recria nem altera tipo quando o campo ja esta presente.
- As migrations 023/024, o seed 005 da TASK_27B e a migration 025 ja foram aplicados no banco nesta sessao.
- Ainda nao houve validacao visual em producao nesta sessao; a validacao feita foi por contrato Node e smoke de importacao das rotas.
