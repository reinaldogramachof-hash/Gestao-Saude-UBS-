# ROADMAP — Gestão Saúde UBS+
> Documento vivo. Atualizar a cada sprint concluído.
> Última revisão: 2026-06-11 | Autor: Reinaldo + Claude Sonnet 4.6

---

## Missão do Produto

**Transformar a comunicação entre UBSs e pacientes de passiva para ativa.**

O paciente não deve precisar ligar, ir até a unidade ou adivinhar o status do seu caso.
O gestor não deve precisar vasculhar listas para encontrar o que está em risco.
Casos urgentes nunca podem se perder dentro de uma unidade de saúde.

---

## Os Três Pilares do MVP

| Pilar | O que resolve | Como |
|---|---|---|
| **Notificação Ativa** | Paciente no escuro — informação não chega | Push notification quando status muda ou comunicado chega |
| **Triagem de Urgência** | Casos graves se perdem na fila comum | Card prioritário no dashboard do gestor + alertas de casos parados |
| **Linha do Tempo** | Paciente não entende o que aconteceu com seu pedido | Histórico cronológico em linguagem simples na tela de detalhes |

---

## Horizonte Real: 2 Semanas

```
SEMANA 1                          SEMANA 2
Dias 1–3      Dias 4–7            Dias 8–11     Dias 12–14
─────────     ─────────           ──────────    ──────────
Correções     Triagem +           Push          Deploy +
de bugs       Card Urgência       Notifications Documentação
críticos      no Dashboard        funcionais    + Apresentação
```

---

## Sprint 1 — Estabilização e Triagem (Dias 1–4)

**Objetivo:** Sistema sem bugs críticos + card de urgência no dashboard do gestor funcionando.

### 1.1 — Correções Críticas (saídas da revisão do Codex)
> Executar após receber o relatório `Relatorio_Revisao_Geral_Modulos.md`

- [ ] Corrigir todos os bugs 🔴 Críticos identificados
- [ ] Corrigir bugs 🟡 Médios que impactam os fluxos principais
- [ ] Garantir que nenhuma rota retorna dados sem autenticação (LGPD)

### 1.2 — Card de Urgência no Dashboard do Gestor

**Descrição:** O `DashboardGestor.jsx` deve ter, no topo da tela, um card/seção dedicada chamada **"Atenção Imediata"** que agrupa automaticamente:

- Solicitações com `prioridade = 'urgente'` sem atualização há mais de **48 horas**
- Solicitações com `prioridade = 'prioritario'` sem atualização há mais de **7 dias**
- Qualquer solicitação no status `em_analise` há mais de **10 dias**

**Comportamento:**
- Card vermelho com contador ("3 casos precisam de ação")
- Cada linha mostra: nome do paciente, tipo de solicitação, dias sem atualização, botão de ação rápida "Atualizar"
- Se zero casos: card some (não ocupa espaço)
- Backend: nova rota `GET /api/gestor/alertas` que retorna esses casos com a lógica de dias calculada no servidor

### 1.3 — Escalada de Urgência pelo Gestor

- [ ] No perfil do paciente (`PerfilPaciente.jsx`), adicionar botão **"Escalar Urgência"** em cada solicitação
- [ ] Ao escalar: modal de confirmação + campo de justificativa obrigatório
- [ ] Backend registra no `historico_status` com `status_novo = 'urgente_escalado'`
- [ ] Solicitação escalada aparece imediatamente no card "Atenção Imediata" do dashboard

---

## Sprint 2 — Notificações Ativas (Dias 5–9)

**Objetivo:** Push notification funcionando no celular. Paciente recebe aviso real quando algo muda.

### 2.1 — Diagnóstico e Correção do Push Atual

O sistema já tem estrutura de push mas não notifica o celular corretamente. Antes de reconstruir:

- [ ] Auditar o service worker existente (`/app/frontend/public/sw.js` ou similar)
- [ ] Verificar se `VAPID keys` estão configuradas no backend
- [ ] Testar o fluxo: inscrição do navegador → envio do backend → recebimento no celular
- [ ] Identificar onde o fluxo quebra

### 2.2 — Push Notification: Eventos que Disparam

| Evento | Destinatário | Mensagem |
|---|---|---|
| Status de solicitação atualizado | Paciente | "Seu [tipo] foi atualizado: [novo status em linguagem simples]" |
| Comunicado individual enviado | Paciente | "A UBS [nome] enviou uma mensagem para você" |
| Agendamento reservado | Gestor | "[Nome do paciente] reservou um horário: [data/hora]" |
| Caso escalado para urgente | Gestor responsável | "⚠️ Solicitação urgente: [nome do paciente] aguarda ação" |
| Solicitação parada há 48h (urgente) | Gestor da UBS | "⚠️ [Nome] tem solicitação urgente sem atualização há 2 dias" |

### 2.3 — Badge de Notificações no App (fallback)

Para dispositivos que bloqueiam push:

- [ ] Ícone de sino na `TopBarGestor` e `BottomNavPaciente` com badge contador
- [ ] `GET /api/[perfil]/notificacoes` retorna lista das últimas 20 notificações
- [ ] Marcar como lida ao abrir
- [ ] Nova tabela no banco: `notificacoes` (destinatario_id, tipo, mensagem, lida, criado_em)

### 2.4 — Linha do Tempo do Paciente (DetalheSolicitacao)

- [ ] `DetalheSolicitacao.jsx` exibe o `historico_status` em formato de timeline vertical
- [ ] Cada entrada: ícone de status, data/hora, mensagem em linguagem simples
- [ ] Status atual destacado (maior, cor primária)
- [ ] Se `observacao_paciente` preenchida pelo gestor: exibir em destaque abaixo do status

---

## Sprint 3 — Deploy e Entrega (Dias 10–14)

**Objetivo:** Sistema estável no ar, documentação pronta, apresentação preparada.

### 3.1 — Testes End-to-End Completos

Roteiro de validação (executar com Subagente de Navegador ou manualmente):

**Fluxo do Gestor:**
- [ ] Login → Dashboard → ver card "Atenção Imediata"
- [ ] Buscar paciente → abrir perfil → criar solicitação urgente
- [ ] Atualizar status → verificar que notificação foi disparada
- [ ] Escalar urgência → verificar que aparece no card de alertas
- [ ] Criar comunicado individual → verificar recebimento pelo paciente
- [ ] Criar slot de agendamento → paciente reserva → gestor vê reserva

**Fluxo do Paciente:**
- [ ] Login com CRA + data de nascimento
- [ ] Dashboard → ver solicitações ativas com status em linguagem simples
- [ ] Clicar em solicitação → ver linha do tempo completa
- [ ] Consultar medicamento por nome parcial
- [ ] Ver comunicados (geral e individual)
- [ ] Reservar slot de agendamento
- [ ] Receber push notification ao ter status atualizado

### 3.2 — Deploy

| Serviço | Plataforma | Status |
|---|---|---|
| Frontend | Vercel | ⏳ Pendente |
| Backend | Railway ou Render | ⏳ Pendente |
| Banco de dados | Supabase (já configurado) | ✅ Pronto |

**Pré-requisitos técnicos para deploy:**
- [ ] Variáveis de ambiente configuradas no painel do Vercel e Railway/Render
- [ ] `VITE_API_URL` apontando para a URL de produção do backend
- [ ] CORS no backend liberado para o domínio do Vercel
- [ ] VAPID keys configuradas como variáveis de ambiente (não hardcoded)
- [ ] `NODE_ENV=production` no backend

### 3.3 — Documentação Final

- [ ] Atualizar `docs/05_Roadmap.md` → substituir pelo este ROADMAP.md
- [ ] Atualizar `Inicio_de_Sessao.md` com status final
- [ ] Relatório de sessão gerado em `.Agent/reports/`
- [ ] `docs/02_Arquitetura_Tecnica.md` atualizado para refletir Supabase (migrado do Neon)

---

## Backlog Pós-Banca (se aprovado pela Prefeitura de SJC)

> Estas funcionalidades entram apenas após validação com usuários reais em UBSs reais.

| Funcionalidade | Valor | Complexidade |
|---|---|---|
| Notificações por WhatsApp Business API | Alto | Alta |
| Integração de leitura com e-SUS (somente consulta) | Alto | Muito Alta |
| Módulo de relatórios analíticos por UBS | Médio | Média |
| App mobile nativo (React Native) | Alto | Muito Alta |
| Múltiplas UBSs por gestor admin | Médio | Média |
| Atualização de dados de contato pelo paciente | Baixo | Baixa |
| Pesquisa de satisfação pós-atendimento | Médio | Baixa |

---

## Critérios de Aprovação para Apresentação à Banca

O sistema está pronto para apresentação quando:

- [ ] Gestor consegue cadastrar paciente, criar solicitação urgente e atualizar status em menos de 2 minutos
- [ ] Paciente recebe push notification em até 30 segundos após atualização de status
- [ ] Card "Atenção Imediata" no dashboard mostra casos urgentes corretamente
- [ ] Todos os textos ao paciente estão em linguagem simples (zero jargão médico)
- [ ] Sistema funciona em celular 375px sem quebras visuais
- [ ] Nenhuma rota retorna dados de paciente sem autenticação

---

*Próxima atualização: após conclusão do Sprint 1*
*Mantido por: Reinaldo (decisões) + Claude Sonnet 4.6 (execução)*
