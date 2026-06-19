# TASK_11 — Correções UX Pré-Banca (Portal do Paciente)
## Para o Agente Antigravity

> **Prazo:** Antes de 25/06/2026 (banca)  
> **Origem:** Avaliação UX realizada pelo Subagente de Navegador — REPORT_10  
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19

---

## CONTEXTO

O portal do paciente recebeu nota 7.5/10. Três problemas críticos foram identificados. Dois são correções de frontend puro (rápidas). Um exige novo módulo (Perfil). As correções abaixo aumentam a nota para ~9/10 e eliminam os bloqueios reais de UX antes da apresentação.

---

## ITEM 1 — Confirmação visual pós-agendamento + refresh da lista

**Arquivo:** `app/frontend/src/pages/paciente/AgendamentosPaciente.jsx`

### Problema
Após confirmar uma reserva, não há feedback claro de sucesso e a lista "Meus Agendamentos" não atualiza — mostra "Você ainda não tem agendamentos".

### O que fazer

Após o `await api.post(...)` de confirmação de reserva ser bem-sucedido:

1. Mostrar `toast.success('Agendamento confirmado! ✓')` (ou equivalente visual do projeto)
2. Recarregar a lista de agendamentos do paciente imediatamente (chamar novamente a função que busca os agendamentos)
3. Fechar o modal de confirmação
4. Rolar a tela para a seção "Meus Agendamentos" (ou trocar para a tab/view que mostra os agendamentos do paciente)

**Padrão esperado:** mesma sequência usada em outros fluxos de confirmação do projeto (ex: comunicados).

---

## ITEM 2 — Ícone/categoria nas solicitações ativas

**Arquivo:** `app/frontend/src/pages/paciente/SolicitacoesPaciente.jsx` (ou tela inicial/dashboard)

### Problema
Paciente vê "Ultrassom do abdômen" mas não sabe que é um exame. A categoria (Exame / Consulta / Procedimento / Cirurgia) não está visível no card.

### O que fazer

No card de cada solicitação, adicionar antes do título um ícone + label de categoria:

```
Ícone sugerido por tipo:
- exame        → 🔬 ou ícone Material: "biotech"
- consulta     → 👨‍⚕️ ou ícone Material: "stethoscope" / "medical_services"  
- procedimento → 🩺 ou ícone Material: "healing"
- cirurgia     → 🏥 ou ícone Material: "local_hospital"
```

Label em texto pequeno acima do título: `EXAME`, `CONSULTA`, etc.

---

## ITEM 3 — Página Perfil do Paciente (MVP mínimo)

**Arquivo novo:** `app/frontend/src/pages/paciente/PerfilPaciente.jsx`  
**Rota nova:** `/paciente/perfil`  
**Backend:** A rota `GET /api/paciente/perfil` já existe e retorna todos os dados.

### O que fazer

Criar uma tela de Perfil simples com dois blocos de informação (somente leitura para MVP):

**Bloco 1 — Dados Pessoais**
- Nome completo
- CRA
- Data de nascimento (formatar como DD/MM/AAAA)
- CPF (mascarado: ***.***.**-**)
- Telefone
- E-mail
- Bairro
- UBS de referência

**Bloco 2 — Informações de Saúde** (campos da migração clínica)
- Tipo sanguíneo
- Peso / Altura
- Alergias
- Comorbidades
- Medicamentos de uso contínuo
- Observações clínicas

Para campos sem valor: exibir `—` (traço), não campo vazio.

**Adicionar ao menu de navegação do paciente:**
- Ícone sugerido: `person` (Material Icons)
- Label: `Perfil`
- Posição: última tab, antes de Sair (ou substituir Sair por ícone separado no header)

**Não implementar edição por enquanto** — MVP de leitura já resolve o crítico C1 do relatório UX.

---

## ITEM 4 — Campo "Motivo" do agendamento com placeholder melhorado

**Arquivo:** `app/frontend/src/pages/paciente/AgendamentosPaciente.jsx`

### Problema
Placeholder "Ex: Renovação de receita, dor no joelho..." induz o paciente a descrever sintoma clínico, mas o agendamento é com o gestor (não com médico).

### O que fazer
Mudar o label e placeholder do campo:

```jsx
// De:
label: "Motivo (opcional)"
placeholder: "Ex: Renovação de receita, dor no joelho..."

// Para:
label: "Observações (opcional)"
placeholder: "Ex: Tenho dificuldade de locomoção, necessito de acompanhante, trarei documentos antigos..."
```

---

## ITENS PARA DOCUMENTAR COMO FASE 2 (NÃO implementar agora)

Estes módulos devem ser mencionados na banca como "Roadmap Fase 2" mas não implementados antes de 25/06:

- Notificações push (WhatsApp Business API — planejado para Fase 2 no docs/05_Roadmap.md)
- Edição de dados do perfil pelo paciente
- Download de comprovante de agendamento (PDF)
- FAQ / perguntas frequentes
- Histórico detalhado de atendimentos no portal do paciente (dados já existem no backend via `/api/paciente/atendimentos`)
- Chat com gestor

---

## VALIDAÇÃO APÓS IMPLEMENTAÇÃO

1. Reservar um slot de agendamento → verificar toast de sucesso + lista atualiza
2. Abrir lista de solicitações → verificar se ícone/label de categoria aparece
3. Navegar para `/paciente/perfil` → todos os campos exibem corretamente
4. Campos sem valor mostram `—` e não estão vazios
5. `git add -A && git commit -m "feat: perfil paciente, confirmação agendamento, categoria em solicitações" && git push`
6. Vercel faz deploy automático — aguardar e verificar em produção

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
