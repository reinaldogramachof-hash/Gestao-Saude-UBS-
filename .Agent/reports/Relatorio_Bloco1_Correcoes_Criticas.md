# Relatorio do Bloco 1 - Correcoes Criticas

**Projeto:** Gestao Saude UBS+  
**Data:** 11/06/2026  
**Agente:** Codex  
**Base:** `Relatorio_Revisao_Geral_Modulos.md`

## Resumo

Os sete itens do Bloco 1 foram implementados. O trabalho corrigiu isolamento entre UBSs, exposicao de dados internos, login de contas inativas, timeline inicial, ordenacao de urgencias, redirecionamento de sessao e linguagem simples de status.

Tambem foi adicionada uma suite de sete testes de contrato. O ciclo TDD foi registrado:

- Estado inicial: **0 aprovados, 7 reprovados**.
- Estado final: **7 aprovados, 0 reprovados**.

## Confirmacao das tarefas

| Tarefa | Resultado | Evidencia principal |
|---|---|---|
| 1. C-01 - Isolamento entre UBSs | Concluida | `gestor.js:128-178` valida paciente/UBS dentro da transacao, responde 403 e restringe o update |
| 2. C-02 - Campos internos expostos | Concluida | `paciente.js:24-40,103-119,130-151` usa lista explicita de campos publicos |
| 3. C-03 - Contas inativas | Concluida | `auth.js:36-40,82-88` exige `ativo: true` nos dois logins |
| 4. M-02 - Historico inicial | Concluida | `gestor.js:360-390` cria solicitacao e evento inicial na mesma transacao |
| 5. M-14 - Urgentes no topo | Concluida | `paciente.js:103-119` exclui finalizadas e ordena por prioridade/data |
| 6. M-16 - Redirecionamento 401 | Concluida | `api.js:48-67` le o tipo antes de limpar a sessao |
| 7. N-02 - Status em linguagem simples | Concluida | `statusHelper.js:1-27` centraliza textos/cores usados nas duas paginas |

## Arquivos alterados

### `app/backend/src/routes/auth.js`

- Linhas 36-40: a consulta do gestor passou a exigir `ativo: true`.
- Linhas 82-88: a consulta do paciente passou a exigir `ativo: true`.
- Mensagens genericas de credencial invalida foram preservadas.

### `app/backend/src/routes/gestor.js`

- Linhas 98-103: solicitacoes do perfil tambem sao filtradas por `ubs_id`.
- Linhas 123-178: leitura, verificacao de pertencimento, update e historico da mudanca de status agora ocorrem em uma transacao.
- Linhas 129-137: a solicitacao e ligada ao paciente para validar a UBS de referencia.
- Linhas 143-146: solicitacao de outra unidade e identificada pelo `paciente_ubs_id`.
- Linhas 157-160: o update exige simultaneamente ID da solicitacao e UBS do gestor.
- Linhas 172-176: tentativa fora do escopo retorna HTTP 403.
- Linhas 323-333: edicao do paciente reforcada com `id + ubs_id`.
- Linhas 360-390: criacao da solicitacao e primeiro registro em `historico_status` foram reunidos em uma transacao.
- Linhas 379-385: evento inicial grava status anterior nulo, status novo real e mensagem de registro.

### `app/backend/src/routes/paciente.js`

- Linhas 24-40: criada a lista `CAMPOS_SOLICITACAO_PACIENTE`.
- Linhas 103-119: dashboard retorna apenas solicitacoes ativas e campos publicos.
- Linhas 110-117: ordenacao por `urgente`, `prioritario`, demais prioridades e data decrescente.
- Linhas 130-151: detalhe da solicitacao usa o mesmo select explicito.
- `descricao` e `observacao_gestor` nao atravessam mais a API do paciente.

### `app/frontend/src/services/api.js`

- Linhas 48-57: tipo do usuario e lido com protecao contra JSON corrompido antes da limpeza.
- Linhas 59-66: storage e limpo e o login correto e escolhido para gestor ou paciente.

### `app/frontend/src/pages/paciente/DashboardPaciente.jsx`

- Linha 16: importacao dos mapas compartilhados.
- Linhas 52-56: removida a exibicao da descricao tecnica.
- Linhas 58-65: status passou a usar texto simples e cor do helper.

### `app/frontend/src/pages/paciente/DetalheSolicitacao.jsx`

- Linha 15: importacao dos mapas compartilhados.
- Linhas 50-55: removida a descricao tecnica e exibida apenas a observacao destinada ao paciente.
- Linhas 68-72: adicionado status atual em linguagem simples.
- Linhas 85-92: timeline usa rotulos e cores compartilhados, sem valor bruto.

### `app/frontend/src/utils/statusHelper.js`

- Linhas 1-27: novo utilitario comentado com `STATUS_LABELS` e `STATUS_CORES`.

### `tests/bloco1-contracts.test.mjs`

- Linhas 1-96: sete contratos automatizados cobrindo todos os itens do bloco.

### `docs/superpowers/plans/2026-06-11-bloco1-correcoes-criticas.md`

- Plano de implementacao e verificacao usado para executar o bloco de forma rastreavel.

## Revisao das rotas com parametros

O arquivo `gestor.js` foi revisado integralmente:

- Paciente por ID: GET, PUT e criacao de solicitacao validam `id + ubs_id`.
- Solicitacao por ID: passou a validar o paciente e sua UBS dentro da transacao.
- Medicamento, comunicado e agendamento por ID: ja validavam `ubs_id` antes da escrita/exclusao.
- Consultas relacionadas ao perfil foram reforcadas com `ubs_id`.

## Validacoes executadas

### Testes de contrato

Comando:

```powershell
node --test tests\bloco1-contracts.test.mjs
```

Resultado final:

```text
tests 7
pass 7
fail 0
```

### Sintaxe do backend

Foram verificados individualmente:

```powershell
node --check src/routes/auth.js
node --check src/routes/gestor.js
node --check src/routes/paciente.js
```

Resultado:

```text
Backend syntax: 3/3 OK
```

### Build do frontend

Comando:

```powershell
npm.cmd run build
```

Resultado:

```text
vite v5.4.21
108 modules transformed
built in 2.65s
```

## Observacoes de escopo

- Nenhuma migration ou dependencia foi alterada.
- Nenhuma regra fora dos sete itens foi implementada.
- Os testes sao contratos locais e nao dependem de credenciais do banco.
- Nao foi realizado teste end-to-end contra o banco remoto neste bloco.
