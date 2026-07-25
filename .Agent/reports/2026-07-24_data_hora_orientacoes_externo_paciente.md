# Relatorio - Alinhamento de Data, Hora e Orientacoes Externo/Paciente

Data: 2026-07-24
Responsavel: Codex

## Problema

O fluxo de agendamento externo precisava alinhar de forma inequívoca as informacoes mostradas para a unidade externa e para o paciente. Apenas a data era registrada, sem hora operacional e sem orientacoes de preparo confirmadas, criando risco de deslocamento no dia/hora errados ou sem preparo adequado.

## Correcoes aplicadas

- Criada a migration `034_add_hora_orientacoes_encaminhamentos.js`.
- Adicionados os campos `hora_procedimento_unidade` e `orientacoes_procedimento` em `encaminhamentos`.
- A rota `PUT /api/externa/encaminhamento/:id/agendar` agora exige:
  - `data_procedimento_unidade` como data civil `YYYY-MM-DD`;
  - `hora_procedimento_unidade` como `HH:mm`;
  - `orientacoes_procedimento` com preparo/instrucoes ao paciente.
- A unidade externa passa a informar data, hora e orientacoes antes de confirmar o agendamento.
- O guia de preparo clinico sugerido no portal externo preenche as orientacoes, mas a unidade pode revisar antes do envio.
- O portal externo mostra o mesmo resumo depois do agendamento.
- O dashboard do paciente mostra data, horario, local e orientacoes no card de confirmacao pendente.
- A tela de detalhes do pedido mostra data, horario e orientacoes do exame.
- As notificacoes de gestor e push passaram a incluir data e hora formatadas.

## Validacoes

- Testes focados: 22/22 aprovados.
- Suite completa: 131/131 testes aprovados.
- `node --check` em backend e migration nova: sem erros.
- `npm.cmd run build` em `app/frontend`: build concluido.
- `git diff --check`: sem erros; apenas avisos esperados de CRLF no Windows.

## Observacao operacional

Antes de validar este fluxo em banco local/producao, executar a migration `034` para criar os novos campos em `encaminhamentos`.
