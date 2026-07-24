# TASK 4.11 - Direito ao Esquecimento - Exclusao de dados do paciente (LGPD Art. 18)

Data: 2026-06-29
Agente: Codex

## Objetivo

Implementar a exclusao irreversivel de dados do paciente conforme LGPD Art. 18, com:

- acesso restrito a admin
- confirmacao dupla no frontend
- transacao atomica no backend
- preservacao dos `security_audit_logs` por anonimização, nunca por delete

## Etapa 1 - Mapeamento de dependencias

Leitura das migrations e referencias em rotas/seed revelou as seguintes dependencias ligadas a `pacientes`:

1. `pacientes`
   - colunas locais de LGPD: `lgpd_aceite_em`, `lgpd_versao`
2. `solicitacoes`
   - FK `paciente_id -> pacientes.id`
3. `historico_status`
   - depende indiretamente do paciente via `solicitacao_id -> solicitacoes.id`
4. `agendamentos_gestao`
   - FK `paciente_id -> pacientes.id`
5. `comunicados`
   - FK `paciente_id -> pacientes.id` para comunicados individuais
6. `comunicados_leitura`
   - FK `paciente_id -> pacientes.id`
7. `push_subscriptions`
   - sem FK formal, mas usa `usuario_id + tipo_usuario = 'paciente'`
8. `atendimentos`
   - FK `paciente_id -> pacientes.id`
9. `encaminhamentos`
   - FK `paciente_id -> pacientes.id`
10. `casos_sociais`
   - FK `paciente_id -> pacientes.id`
11. `transporte_sanitario`
   - FK `paciente_id -> pacientes.id`
12. `notificacoes_vigilancia`
   - FK opcional `paciente_id -> pacientes.id` com `ON DELETE SET NULL`
13. `security_audit_logs`
   - sem FK formal para paciente, mas armazena `usuario_id`, `usuario_tipo = 'paciente'` e `detalhe`

## Arquivos alterados

- `app/backend/src/routes/admin.js`
- `app/frontend/src/pages/gestor/GestorPacientes.jsx`
- `tests/task411-lgpd-exclusao.test.mjs`

## O que foi implementado

### Backend

Criada rota:

- `DELETE /api/admin/pacientes/:id/dados`

Comportamento:

- exige admin por conta do pipeline ja existente em `admin.js`
- valida `id`
- busca o paciente antes de qualquer operacao
- registra `LGPD_EXCLUSAO_INICIADA` com `registrar()`
- executa transacao atomica com limpeza explicita
- registra `LGPD_EXCLUSAO_CONCLUIDA` ao final
- registra `LGPD_EXCLUSAO_FALHA` em erro

Limpeza executada na transacao:

1. `push_subscriptions`
2. `agendamentos_gestao`
3. `comunicados_leitura`
4. `comunicados` individuais
5. `atendimentos`
6. `encaminhamentos`
7. `casos_sociais`
8. `transporte_sanitario`
9. `notificacoes_vigilancia`
   - `paciente_id` vira `NULL` para preservar o registro territorial sem manter o vinculo nominal
10. `historico_status`
11. `solicitacoes`
12. `security_audit_logs`
   - `detalhe = '[DADOS REMOVIDOS - LGPD]'`
13. `pacientes`

Resposta de sucesso:

```json
{ "excluido": true, "mensagem": "Dados do paciente removidos com sucesso." }
```

### Frontend

A exclusao LGPD foi integrada em `GestorPacientes.jsx`, visivel apenas para `user?.perfil === 'admin'`.

Fluxo implementado:

1. Botao `Excluir dados (LGPD)` na linha do paciente
2. Modal com aviso irreversivel
3. Campo obrigatorio com digitacao exata:
   - `CONFIRMAR EXCLUSÃO`
4. Botao `Excluir permanentemente` fica desabilitado ate o texto estar correto
5. Sucesso:
   - fecha modal
   - remove paciente da lista local
   - mostra toast
6. Erro:
   - mantem modal aberto
   - exibe mensagem de erro

## Validacoes executadas

### Contrato da task

Comando:

```powershell
node --test tests\task411-lgpd-exclusao.test.mjs
```

Resultado:

- 4 testes passaram

### Checagem sintatica backend

Comando:

```powershell
node --check app\backend\src\routes\admin.js
```

Resultado:

- passou sem erro

### Build do frontend

Comando:

```powershell
npm.cmd run build
```

Resultado:

- build concluido com sucesso
- warnings preexistentes do Vite sobre chunk grande e `react-hot-toast`

### Teste real da API - exclusao bem-sucedida

Fixture criada em desenvolvimento com dependencias reais em:

- `push_subscriptions`
- `agendamentos_gestao`
- `comunicados`
- `comunicados_leitura`
- `solicitacoes`
- `historico_status`
- `atendimentos`
- `encaminhamentos`
- `casos_sociais`
- `transporte_sanitario`
- `notificacoes_vigilancia`
- `security_audit_logs`

Fluxo executado:

1. login admin com `centro@gestaoubs.dev`
2. chamada real `DELETE /api/admin/pacientes/:id/dados`
3. verificacao direta no banco

Resultado observado:

- `excluido: true`
- contagem `0` para:
  - `push_subscriptions`
  - `agendamentos_gestao`
  - `comunicados`
  - `comunicados_leitura`
  - `atendimentos`
  - `encaminhamentos`
  - `casos_sociais`
  - `transporte_sanitario`
  - `solicitacoes`
  - `historico_status`
  - `pacientes`
- `notificacoes_vigilancia.paciente_id = null`
- `security_audit_logs` preservado com `detalhe = '[DADOS REMOVIDOS - LGPD]'`

### Teste real de rollback

Para simular falha dentro da transacao real da rota, foi criado temporariamente um trigger de banco em `push_subscriptions` que levantava excecao no `DELETE`.

Fluxo executado:

1. criar paciente fixture com `push_subscriptions`
2. criar trigger temporario que aborta o `DELETE`
3. chamar `DELETE /api/admin/pacientes/:id/dados`
4. verificar estado do banco

Resultado observado:

- resposta HTTP `500`
- `push_subscriptions` permaneceu com `1` registro
- `pacientes` permaneceu com `1` registro

Conclusao:

- rollback automatico confirmado na rota real, sem exclusao parcial

## Observacoes

- O backend ficou mais abrangente que o minimo do enunciado para cobrir dependencias adicionais encontradas nas migrations.
- `security_audit_logs` nao foi deletado em nenhum momento.
