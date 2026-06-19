# Avaliação UX — Portal do Paciente
**Data:** 19/06/2026 | **Executado por:** Subagente de Navegador (Claude Chrome)  
**Paciente testado:** Reinaldo Gramacho (CRA 992191018) | **Viewport:** 375px

---

## Nota geral: 7.5/10

Base sólida com navegação clara e identidade visual SUS. Três gaps críticos impedem adoção em escala.

---

## Pontos fortes confirmados
- Identidade visual verde SUS imediata
- Bottom-tab navigation — padrão mobile correto
- Boas-vindas com nome + UBS contextualizado
- Status em linguagem simples ("Em análise pela equipe")
- Timeline visual no histórico de solicitações
- Badge de disponibilidade em medicamentos com busca funcional
- Comunicados com badges e ícones temáticos expansíveis
- Modal de agendamento direto e claro

---

## Problemas críticos (bloqueiam uso real)

**C1 — Sem seção Perfil/Dados Pessoais** → *Resolvido na TASK_11*  
Paciente não conseguia ver/editar dados de contato, tipo sanguíneo, alergias.

**C2 — Sem confirmação visual pós-agendamento** → *Resolvido na TASK_11*  
Após "Confirmar Reserva", sem feedback claro. Toast + scroll automático implementado.

**C3 — Lista "Meus Agendamentos" não atualizava após reserva** → *Resolvido na TASK_11*

---

## Problemas relevantes (não bloqueiam)
1. Solicitações sem categoria visual — *Resolvido na TASK_11*
2. Descrição do agendamento genérica ("150 minutos" sem contexto)
3. Campo "Motivo" com placeholder inadequado — *Resolvido na TASK_11*
4. Medicamentos sem instrução de retirada (horário, documentos, local)
5. Comunicados sem distinção de urgência
6. Sem indicador visual de comunicado lido/não-lido

---

## Módulos ausentes — priorização

| Módulo | Classificação | Status |
|--------|---------------|--------|
| Perfil/Meus Dados | MUST HAVE | ✅ Implementado (TASK_11) |
| Notificações Push | MUST HAVE | Fase 2 |
| Histórico de atendimentos | SHOULD HAVE | Backend pronto, frontend pendente |
| Download comprovante | SHOULD HAVE | Pendente |
| Chat/suporte | SHOULD HAVE | Fase 2 |
| FAQ | SHOULD HAVE | Pendente |
| WhatsApp integration | SHOULD HAVE | Fase 2 (CLAUDE.md) |
| Mapa UBS | NICE TO HAVE | Pendente |
| Modo offline | NICE TO HAVE | Fase 3 |

---

## Visão de app mobile (resumo)
- Diferencial principal: notificações push + offline + biometria + câmera
- Home ideal: Boas-vindas → Comunicados badge → Solicitações pendentes → Atalho Agendar
- Onboarding: 5 telas com explicação visual de onde encontrar o CRA
- Modo offline: sincronizar dados críticos a cada 24h

---

## Nota final do avaliador
> "Este sistema traz dignidade ao paciente do SUS — deixa claro que ele é protagonista, não coadjuvante."

---

*Arquivo original: `.Agent/reports/REPORT_10_avaliacao_ux_portal_paciente.md`*
