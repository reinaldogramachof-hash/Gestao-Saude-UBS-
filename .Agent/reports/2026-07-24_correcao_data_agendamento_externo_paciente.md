# Relatorio - Correcao de Data do Agendamento Externo no Paciente

Data: 2026-07-24
Responsavel: Codex

## Problema observado

Ao agendar um procedimento no portal da unidade externa para `31/07/2026`, a notificacao do gestor mostrava o valor bruto como `Thu Jul 30 2026 21:00:00 GMT-0300`, e o card de confirmacao pendente no portal do paciente nao exibia a data.

## Causa

- A rota externa validava `data_procedimento_unidade` como `Joi.date().iso()`, convertendo a data civil `YYYY-MM-DD` para objeto `Date` e reintroduzindo conversao de fuso.
- O dashboard do paciente lia `pend.data_agendamento`, mas a API de encaminhamentos retorna `data_procedimento_unidade`.

## Correcoes aplicadas

- `app/backend/src/routes/externa.js`: `data_procedimento_unidade` passou a ser validada como string `YYYY-MM-DD`, preservando a data civil escolhida pela unidade externa.
- `app/backend/src/routes/externa.js`: mensagens de notificacao e push usam `DD/MM/YYYY`, nao o valor bruto do objeto Date.
- `app/frontend/src/pages/paciente/DashboardPaciente.jsx`: o card "Confirmacao pendente" agora exibe `formatarDataBR(pend.data_procedimento_unidade)`.
- `tests/externa-contracts.test.mjs`: contrato adicionado para impedir retorno de `Joi.date()` nesse fluxo.
- `tests/task30-paciente-ux-contracts.test.mjs`: contrato adicionado para proteger o campo correto no dashboard do paciente.

## Validacoes

- Testes focados: 20/20 aprovados.
- Suite completa: 130/130 testes aprovados.
- `node --check app/backend/src/routes/externa.js`: sem erros.
- `npm.cmd run build` em `app/frontend`: build de producao concluido.
- `git diff --check`: sem erros; apenas avisos esperados de CRLF no Windows.

## Observacao

Esta correcao deve fazer o paciente enxergar exatamente a mesma data civil agendada pela unidade externa, por exemplo `31/07/2026`, sem regressao para o dia anterior por fuso horario.
