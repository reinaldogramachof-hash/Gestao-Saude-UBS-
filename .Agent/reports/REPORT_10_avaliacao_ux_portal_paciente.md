# REPORT_10 — Avaliação UX Portal do Paciente
**Data:** 19/06/2026  
**Agente:** Claude do Chrome (Subagente de Navegador)  
**Paciente testado:** Reinaldo Gramacho (CRA 992191018) — dados reais  
**Nota geral:** 7.5/10

---

## PONTOS FORTES CONFIRMADOS
1. Identidade visual verde SUS — imediata
2. Bottom-tab navigation — padrão mobile correto
3. Boas-vindas com nome + UBS — contextualizado
4. Status em linguagem simples ("Em análise pela equipe")
5. Timeline visual no histórico de solicitações
6. Badge de disponibilidade em medicamentos com busca funcional
7. Comunicados com badges "(4 novos)" e ícones temáticos
8. Modal de agendamento direto e claro

---

## PROBLEMAS CRÍTICOS (bloqueiam uso real)

### C1 — Sem seção Perfil/Dados Pessoais
Paciente não consegue ver/editar dados de contato, tipo sanguíneo, alergias. Sem self-service = ida presencial à UBS para corrigir cadastro.

### C2 — Sem confirmação visual pós-agendamento
Após "Confirmar Reserva", não há feedback claro. Paciente fica inseguro se precisa tentar de novo.

### C3 — Lista "Meus Agendamentos" não atualiza após reserva
Exibe "Você ainda não tem agendamentos" mesmo após agendar.

---

## PROBLEMAS RELEVANTES (não bloqueiam)
1. Solicitações sem categoria visual (ícone Exame/Consulta/Procedimento)
2. Descrição do agendamento genérica — "150 minutos" sem contexto
3. Campo "Motivo" com placeholder inadequado para atendimento com gestão
4. Medicamentos sem instrução de retirada (horário, documentos, local)
5. Comunicados sem distinção de urgência (urgente vs informativo)
6. Sem indicador visual de comunicado lido/não-lido

---

## MÓDULOS AUSENTES — PRIORIZAÇÃO

| Módulo | Classificação | Para a Banca? |
|--------|---------------|---------------|
| Perfil/Meus Dados | MUST HAVE | Sim — criar MVP básico |
| Notificações push | MUST HAVE | Não — citar como fase 2 |
| Histórico de atendimentos | SHOULD HAVE | Já existe no backend |
| Download comprovante | SHOULD HAVE | Não — complexidade visual |
| Chat/suporte | SHOULD HAVE | Não — infraestrutura |
| FAQ | SHOULD HAVE | Sim — simples de criar |
| WhatsApp integration | SHOULD HAVE | Não — API |
| Mapa UBS | NICE TO HAVE | Sim — link externo simples |
| Acompanhamento de fila | NICE TO HAVE | Não |
| Modo offline | NICE TO HAVE | Não |

---

## VISÃO DE APP MOBILE (resumo)
- Diferencial principal: notificações push + offline + biometria + câmera
- Home sugerida: Boas-vindas → Comunicados badge → Solicitações pendentes → Atalho Agendar
- Onboarding: 5 telas com explicação visual de onde encontrar o CRA
- Modo offline: sincronizar dados críticos a cada 24h

---

## NOTA FINAL DO AVALIADOR
> "Este sistema traz dignidade ao paciente do SUS — deixa claro que ele é protagonista, não coadjuvante. Essa mensagem compensa muitas deficiências técnicas iniciais."

---

*Gerado pelo Subagente de Navegador — arquivado por Claude Sonnet 4.6*
