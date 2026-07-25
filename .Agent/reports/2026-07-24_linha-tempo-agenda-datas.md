# Relatorio de Sessao — Linha do tempo, datas e agenda

Data: 2026-07-24

## Objetivo

Corrigir a data exibida no painel do paciente, fazer a linha do tempo do gestor refletir eventos auditaveis do processo e impedir exibicao/criacao/reserva de agendamentos em datas passadas.

## Alteracoes aplicadas

- O detalhe da solicitacao do paciente agora usa a data operacional do procedimento quando o historico representa `data_marcada`, mantendo a data de movimentacao visivel como trilha complementar.
- A linha do tempo do perfil do paciente no gestor passa a combinar atendimentos clinicos manuais com eventos de `historico_status` das solicitacoes da UBS.
- Eventos de processo aparecem como `Processo UBS+`, sem acoes de editar/remover, preservando sua natureza de auditoria.
- A agenda do gestor filtra slots futuros no backend e tambem no frontend como protecao contra cache/tela antiga.
- A criacao de grade e a criacao individual de horarios rejeitam datas passadas.
- A reserva de agendamento pelo paciente rejeita slots vencidos mesmo que tenham sido carregados antes.

## Validacoes

- `node --test tests\task-data-paciente-timeline.test.mjs tests\expansao-painel-gestor-contracts.test.mjs tests\task32-agenda-contracts.test.mjs tests\task28-agendamentos-lote.test.mjs` — 21/21 testes passaram.
- `npm.cmd run build` em `app/frontend` — build Vite concluido com sucesso; permaneceu apenas aviso de bundle/import dinamico.
- `node --test tests\*.test.mjs` — 120/120 testes passaram.
- `node --check app\backend\src\routes\gestor.js` — sintaxe valida.
- `node --check app\backend\src\routes\paciente.js` — sintaxe valida.
- `git diff --check` — sem erros; apenas avisos esperados de LF/CRLF no Windows.

## Observacoes

- O contrato de modo matriz foi preservado: a rota de perfil continua permitindo visualizacao ampla de pacientes conforme arquitetura atual, enquanto os eventos de processo da linha do tempo sao filtrados pela UBS operacional.
- Nao foi feito commit/push nesta etapa; o repositorio ja tinha alteracoes pendentes da etapa anterior de datas/responsividade externa.
