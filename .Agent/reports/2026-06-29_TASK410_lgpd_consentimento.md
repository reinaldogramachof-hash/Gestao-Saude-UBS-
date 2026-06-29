# TASK 4.10 - Termo de Consentimento LGPD no Portal do Paciente

Data: 2026-06-29
Agente: Codex

## Objetivo

Implementar o aceite obrigatorio de LGPD no Portal do Paciente com:

- versionamento centralizado da politica
- persistencia de timestamp e versao no banco
- reexibicao do modal quando a versao mudar
- bloqueio de navegacao ate o aceite ser confirmado

## Arquivos alterados

- `app/backend/src/db/migrations/030_lgpd_consentimento.js`
- `app/backend/src/utils/lgpd.js`
- `app/backend/src/routes/auth.js`
- `app/backend/src/routes/paciente.js`
- `app/frontend/src/components/paciente/LgpdModal.jsx`
- `app/frontend/src/contexts/AuthContext.jsx`
- `app/frontend/src/pages/paciente/LoginPaciente.jsx`
- `app/frontend/src/App.jsx`
- `tests/task410-lgpd-consent.test.mjs`

## O que foi implementado

### Backend

- Criada migration `030_lgpd_consentimento.js` adicionando:
  - `pacientes.lgpd_aceite_em`
  - `pacientes.lgpd_versao`
- Criado util central `app/backend/src/utils/lgpd.js` com `VERSAO_ATUAL = '1.0'`
- Login do paciente agora retorna:
  - `lgpd_aceite_em`
  - `lgpd_versao`
  - `lgpd_pendente`
- Criada rota autenticada `POST /paciente/lgpd/aceite`
  - grava `lgpd_aceite_em = now()`
  - grava `lgpd_versao = VERSAO_ATUAL`
  - registra auditoria com `acao: 'LGPD_ACEITE'` e `resultado: 'sucesso'`
  - retorna `{ aceito: true }`

### Frontend

- Criado modal bloqueante `LgpdModal.jsx`
- Modal contem:
  - titulo "Termo de Uso e Privacidade"
  - resumo do tratamento dos dados
  - link "Ler politica completa" para `/privacidade`
  - checkbox obrigatorio
  - botao "Continuar" desabilitado ate o aceite
- Fluxo de login do paciente alterado:
  - se `lgpd_pendente` vier `true`, a sessao e salva mas o dashboard nao abre
  - o modal aparece antes da navegacao
  - apos `POST /paciente/lgpd/aceite`, a sessao local e atualizada e o dashboard e liberado
- `ProtectedRoute` do paciente agora bloqueia acesso por URL quando `user.lgpd_pendente === true`
- Login do gestor nao foi alterado

## Validacoes executadas

### Contrato da tarefa

Comando:

```powershell
node --test tests\task410-lgpd-consent.test.mjs
```

Resultado:

- 7 testes passaram

### Checagem sintatica backend

Comandos:

```powershell
node --check app\backend\src\utils\lgpd.js
node --check app\backend\src\db\migrations\030_lgpd_consentimento.js
node --check app\backend\src\routes\auth.js
node --check app\backend\src\routes\paciente.js
```

Resultado:

- todos passaram sem erro

### Build do frontend

Comando:

```powershell
npm.cmd run build
```

Resultado:

- build concluido com sucesso
- warnings preexistentes de chunk grande do Vite e `react-hot-toast` duplicado entre import dinamico/estatico

### Migration em desenvolvimento

Comando:

```powershell
$env:NODE_ENV='development'; npx knex migrate:latest
```

Resultado:

- `Batch 19 run: 1 migrations`

### Confirmacao das colunas no banco

Consulta executada com acesso direto ao banco de desenvolvimento:

- `lgpd_aceite_em` -> `timestamp with time zone`
- `lgpd_versao` -> `character varying(10)`

## Observacoes

- Nao executei um E2E real com login de paciente em ambiente visual usando um cadastro existente do banco para evitar manipular dados reais sem uma fixture dedicada para teste.
- O comportamento funcional foi validado por contrato de codigo, build do frontend, migration aplicada e confirmacao das colunas no banco.
