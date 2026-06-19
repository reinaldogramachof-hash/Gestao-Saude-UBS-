# ROTEIRO DE TESTES — COMUNICAÇÃO GESTOR ↔ PACIENTE
## Instrução para o Agente Claude do Chrome

> **Versão:** 1.0 — 2026-06-19  
> **Contexto:** Ambos os portais já estão abertos e logados no sistema em produção (Vercel).  
> Aba 1 = Portal do Gestor | Aba 2 = Portal do Paciente (375px, formato smartphone)  
> O paciente logado é **Ana Clara Souza (DEMO-0001)**.

---

## CONTEXTO DO SISTEMA

**Gestão Saúde UBS+** conecta a equipe gestora de UBSs ao paciente do SUS. O gestor alimenta o sistema; o paciente vê seus dados em linguagem simples, sem precisar ligar para a UBS.

**Foco deste teste:** validar se ações no painel do gestor refletem corretamente no painel do paciente. Atue como testador especialista — busque falhas, inconsistências e comportamentos inesperados.

---

## FLUXO 1 — SOLICITAÇÃO: Gestor cria → Paciente vê

**[Aba Gestor]**
1. Vá em **Pacientes**, busque Ana Clara Souza e abra o perfil
2. Na seção **Solicitações**, crie uma nova:
   - Tipo: `Exame` | Descrição técnica: `Ultrassonografia Abdominal`
   - Descrição para o paciente: `Ultrassom do abdômen` | Prioridade: `Rotina` | Status: `Em análise`
3. Salve

**[Aba Paciente]**
4. Recarregue e vá para **Minhas Solicitações**
5. Verifique se `Ultrassom do abdômen` aparece com status `Em análise` em linguagem simples

**Critério:** solicitação visível com texto correto e sem jargão técnico.

---

## FLUXO 2 — STATUS: Gestor atualiza → Paciente vê mudança

> Use a solicitação criada no Fluxo 1 (ou qualquer solicitação existente de Ana Clara).

**[Aba Paciente]**
1. Anote o status atual visível da solicitação

**[Aba Gestor]**
2. Edite a solicitação — mude o status para `Autorizado`
3. Adicione observação para o paciente: `Aguardando agendamento da data`
4. Salve

**[Aba Paciente]**
5. Recarregue e volte às solicitações
6. Verifique se o status mudou e se a observação aparece para o paciente

**Critério:** status e observação atualizados; texto em linguagem simples, não campo técnico.

---

## FLUXO 3 — COMUNICADO: Gestor envia individual → Paciente recebe

**[Aba Paciente]**
1. Observe a seção **Comunicados** — anote quantos há atualmente e se há badge de notificação

**[Aba Gestor]**
2. Vá em **Comunicados** → criar novo comunicado **Individual**
   - Paciente: Ana Clara Souza (DEMO-0001)
   - Título: `Resultado de Exame Disponível`
   - Mensagem: `Seus exames estão disponíveis na UBS. Compareça com documento de identidade.`
3. Envie

**[Aba Paciente]**
4. Recarregue
5. Verifique: badge de notificação apareceu ou aumentou?
6. Abra **Comunicados** — o comunicado aparece com título e texto corretos?

**Critério:** badge atualizado, comunicado visível com conteúdo íntegro.

---

## FLUXO 4 — AGENDAMENTO: Gestor cria vaga → Paciente reserva → Gestor vê

**[Aba Gestor]**
1. Vá em **Agenda** ou **Agendamentos** → criar novo horário disponível
   - Data: próximo dia útil | Horário: `09:00` | Vagas: `1`
2. Salve

**[Aba Paciente]**
3. Vá em **Agendar Atendimento** (ou seção equivalente)
4. O horário criado aparece disponível? Selecione e confirme a reserva
5. Aparece confirmação visual (mensagem de sucesso ou card de agendamento)?

**[Aba Gestor]**
6. Recarregue a Agenda — o horário agora aparece como ocupado ou com nome de Ana Clara?

**Critério:** ciclo completo funciona — vaga visível, reserva confirmada, gestor vê ocupação.

---

## FLUXO 5 — MEDICAMENTO: Gestor altera disponibilidade → Paciente vê

**[Aba Paciente]**
1. Vá em **Medicamentos** — anote um medicamento marcado como **Disponível**

**[Aba Gestor]**
2. Vá em **Medicamentos** → localize o mesmo medicamento → mude para **Indisponível** → salve

**[Aba Paciente]**
3. Recarregue Medicamentos
4. O medicamento agora aparece como Indisponível? A indicação visual mudou (cor, ícone, texto)?

**[Aba Gestor]**
5. Restaure para **Disponível** após registrar o resultado

**Critério:** status reflete em tempo real; feedback visual coerente no portal do paciente.

---

## VERIFICAÇÕES TRANSVERSAIS

Durante todos os fluxos, observe e registre:

- **Mobile 375px:** portal do paciente legível sem scroll horizontal? Botões com área de toque adequada?
- **Linguagem:** textos ao paciente estão sem jargão médico/burocrático?
- **Loading:** há indicadores visuais durante carregamento?
- **Erros:** mensagens de erro amigáveis ou exibe erro técnico bruto?
- **Segurança:** paciente acessa apenas seus próprios dados?
- **Datas:** exibidas no formato brasileiro (DD/MM/AAAA)?

---

## FORMATO DO RELATÓRIO FINAL

```
# RELATÓRIO — COMUNICAÇÃO GESTOR ↔ PACIENTE
Data: [hoje]

## RESUMO
[3 linhas: o fluxo bidirecional funciona? Gravidade dos problemas?]

## RESULTADOS

| Fluxo | Resultado | Severidade |
|-------|-----------|------------|
| F1 — Criar solicitação         | ✅/❌ | —/Alta/Média/Baixa |
| F2 — Atualizar status          | ✅/❌ | — |
| F3 — Comunicado individual     | ✅/❌ | — |
| F4 — Agendamento ciclo completo | ✅/❌ | — |
| F5 — Disponibilidade medicamento | ✅/❌ | — |

## PROBLEMAS ENCONTRADOS (por severidade)

### [ALTA/MÉDIA/BAIXA] Título
- Onde: [tela/URL]
- O que aconteceu: [objetivo]
- O que deveria acontecer: [esperado]
- Reproduzível: Sim/Não

## OBSERVAÇÕES DE UX MOBILE

## APROVADO PARA A BANCA?
[ ] Sim — sem bloqueio crítico
[ ] Sim com ressalvas — [especificar]
[ ] Não — bloqueio crítico: [especificar]
```

---

*Gestão Saúde UBS+ — UFBRA — roteiro gerado por Claude Sonnet 4.6*
