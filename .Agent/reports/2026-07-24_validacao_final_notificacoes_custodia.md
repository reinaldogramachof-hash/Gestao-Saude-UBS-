# Relatorio de Validacao Final - Notificacoes, Datas e Custodia

Data: 2026-07-24
Responsavel: Codex

## Escopo validado

- Auditoria de notificacoes ao paciente com registro de disparo, entrega e leitura.
- ACK publico de entrega usando `ack_token` opaco, sem depender de JWT no Service Worker.
- Remocao da rota legada de ACK em `/api/paciente/notificacoes/ack` baseada em `log_id`.
- Separacao correta das migrations: `032` cria a tabela base e `033` adiciona `ack_token`.
- Envio de `api_base_url` no payload WebPush para que o Service Worker confirme entrega contra o backend publico em producao.
- Tela de detalhes do pedido com card de custodia atual e linha do tempo decrescente.
- Datas do paciente/externo preservando data civil operacional.
- Agenda impedindo exibicao/reserva de horarios ja passados.

## Correcoes finais aplicadas

- Removido o envio de `log_id` no payload do push ao dispositivo do paciente.
- Mantido apenas o ACK seguro por `ack_token` na rota publica `/api/public/notificacoes/ack`.
- Adicionado `BACKEND_PUBLIC_URL` ao `.env.example` do backend para orientar deploy em Vercel/Railway.
- Fortalecido o teste de contrato para falhar caso a rota antiga por `log_id` volte a existir.

## Validacoes executadas

- `node --test tests\task-auditoria-notificacoes.test.mjs tests\task-detalhe-pedido-custodia.test.mjs tests\task-data-paciente-timeline.test.mjs`: 9/9 testes aprovados.
- `node --test tests\*.test.mjs`: 128/128 testes aprovados.
- `node --check` em `server.js`, `paciente.js`, `gestor.js`, `publico.js` e `pushService.js`: sem erros.
- `npm.cmd run build` em `app/frontend`: build de producao concluido com sucesso.
- `git diff --check`: sem erros de whitespace; apenas avisos de CRLF esperados no Windows.

## Observacao operacional

Para producao, configurar `BACKEND_PUBLIC_URL` no backend com a URL publica da API. Sem essa variavel, o Service Worker usa `/api/public/notificacoes/ack`, adequado para ambiente local com proxy, mas insuficiente quando o frontend esta em dominio separado.
