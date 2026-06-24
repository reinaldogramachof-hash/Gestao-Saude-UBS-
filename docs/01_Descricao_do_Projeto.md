# Documento 01 — Descrição do Projeto
## Gestão Saúde UBS+ | Projeto de Extensão Multidisciplinar
### Faculdade UFBRA — Engenharia de Software

**Versão:** 2.0
**Data:** 2026-06-24
**Status:** ✅ Entregue — Sistema em produção

---

## 1. Identificação do Projeto

| Campo | Informação |
|---|---|
| **Nome do Projeto** | Gestão Saúde UBS+ |
| **Curso** | Engenharia de Software |
| **Tipo** | Projeto de Extensão Multidisciplinar |
| **Município Parceiro** | São José dos Campos — SP |
| **Contexto de Aplicação** | Unidades Básicas de Saúde (UBS) da rede municipal do SUS |
| **URL de Produção (Frontend)** | Vercel — gestao-saude-ubs.vercel.app |
| **URL de Produção (Backend)** | Vercel Serverless Functions |
| **Banco de Dados** | PostgreSQL — Supabase (projeto: crdtguvjuyfszxbpnwms) |

---

## 2. Problema Identificado

As Unidades Básicas de Saúde (UBS) de São José dos Campos operam com um modelo de comunicação predominantemente presencial e reativo. Os pacientes não têm acesso digital claro e centralizado a informações sobre suas solicitações médicas, criando os seguintes problemas:

- **Desinformação sobre filas:** O paciente não sabe em que fase está seu exame, consulta ou procedimento.
- **Deslocamentos desnecessários:** Pacientes vão presencialmente à UBS apenas para saber se um medicamento chegou ou qual é o status de um pedido.
- **Sobrecarga da recepção:** A equipe responde repetidamente perguntas que poderiam ser respondidas por um sistema digital.
- **Filas físicas evitáveis:** Parte significativa das filas nas UBSs é causada por demandas de informação, não de atendimento clínico.
- **Informações desencontradas:** A Central 156 e o balcão da UBS nem sempre têm o mesmo status para o paciente, gerando desconfiança.

O aplicativo atual da prefeitura ("Saúde na Mão") possui limitações críticas:
- Não permite marcação de novas consultas digitalmente
- Apresenta instabilidades de autenticação relatadas pelos usuários
- Funciona como canal de leitura passiva, sem comunicação bidirecional real com a gestão da UBS

---

## 3. Proposta de Solução — Sistema Entregue

Desenvolvimento de uma **aplicação web responsiva** (acessível por smartphone e computador) com **três portais distintos**:

### Portal do Gestor (Equipe da UBS)
A equipe gestora utiliza um painel administrativo completo para:
- Cadastrar pacientes e suas solicitações (exames, consultas, procedimentos)
- Atualizar o status de cada solicitação em linguagem simples com histórico auditável
- Gerenciar a disponibilidade de medicamentos, com instruções de retirada e dosagem
- Enviar comunicados gerais, individuais ou segmentados por condição clínica (ex: só para pacientes com Diabetes)
- Disponibilizar horários para atendimento presencial em lote (ex: "criar 10 slots de 15min a partir das 8h")
- Gerenciar regulação ambulatorial, vigilância epidemiológica, serviço social e transporte sanitário
- Encaminhar pacientes para unidades externas (AMEs, hospitais, centros de especialidade)
- Gerar relatórios de atividade com distribuição por status e alertas de urgência

### Portal do Paciente (Munícipe)
O paciente acessa um painel personalizado para:
- Visualizar o status atualizado de seus exames, consultas e procedimentos em linguagem acessível, com linha do tempo interativa
- Acompanhar mudanças de status em tempo real (polling automático a cada 20 segundos)
- Verificar se um medicamento está disponível na sua UBS antes de sair de casa
- Receber comunicados da equipe gestora (gerais, individuais ou por condição clínica)
- Agendar um horário de atendimento com a gestão da UBS
- Consultar seu histórico de solicitações concluídas e canceladas
- Confirmar presença em agendamentos com push notification ao gestor

### Portal de Unidades Externas (AMEs, Hospitais, Centros de Especialidade)
Acesso dedicado para unidades da rede secundária e terciária:
- Visualizar encaminhamentos recebidos com dados clínicos do paciente
- Confirmar recebimento, agendar data do procedimento e registrar retorno
- Dashboard com indicadores em tempo real (donut chart por status de encaminhamentos)
- Notificar automaticamente o paciente via Web Push ao agendar ou concluir

### Perfil Médico (RBAC dentro do Portal do Gestor)
Médicos da UBS têm acesso especial:
- Visualização read-only de regulação e vigilância epidemiológica
- Painel Médico exclusivo para geração de receituários e atestados com impressão nativa (`window.print()`)
- Bloqueio de escrita via middleware `soNaoMedico` nas rotas de regulação e vigilância

### Princípio Central
> "Não reinventar a roda — melhorar os eixos para um giro mais funcional."

O sistema **não substitui** os sistemas nacionais do SUS (e-SUS, SISREG, CROSS). Funciona como uma **camada de transparência e comunicação** sobre os processos já existentes, com a equipe gestora alimentando as informações manualmente.

---

## 4. Público-Alvo

| Perfil | Descrição |
|---|---|
| **Gestores e Recepcionistas de UBS** | Profissionais responsáveis por atualizar o sistema com informações de pacientes |
| **Médicos da UBS** | Acesso read-only para consulta clínica e geração de documentos médicos |
| **Pacientes da rede municipal** | Munícipes de SJC cadastrados no SUS com CRA (Cadastro de Regulação Ambulatorial) |
| **Responsáveis legais** | Pais, tutores ou cuidadores que gerenciam a saúde de dependentes |
| **Equipes de Unidades Externas** | Funcionários de AMEs, hospitais e centros de especialidade que recebem encaminhamentos |

---

## 5. Justificativa Social e Acadêmica

### Justificativa Social
São José dos Campos possui mais de 730 mil habitantes e opera uma rede de UBSs que realiza milhares de atendimentos mensais. O programa UBS Resolve, iniciativa inovadora da prefeitura, já internalizou a coleta laboratorial nas próprias unidades (aproximadamente 4.000 exames/mês por unidade populosa), aumentando o volume de informações que precisam ser rastreadas pelo paciente.

A transparência no acompanhamento de filas e solicitações de saúde é objeto de legislação ativa no Brasil (PL nº 335/2024, em tramitação na Câmara Federal) e já foi implementada em estados como Santa Catarina (Lei 17.066/2017). Este projeto antecipa essa tendência legislativa com uma solução tecnológica prática.

### Justificativa Acadêmica
O projeto aplica diretamente competências do curso de Engenharia de Software:
- Levantamento e análise de requisitos em contexto real de governo
- Desenvolvimento fullstack com tecnologias de mercado (React, Node.js, PostgreSQL)
- Arquitetura de software multicamadas com separação clara de responsabilidades
- Controle de acesso baseado em perfil (RBAC) e conformidade com LGPD
- Design centrado no usuário (UX) para populações diversas, mobile-first
- Integração de serviços: Web Push (VAPID), auditoria de ações, notificações em tempo real

---

## 6. Alinhamento com a LGPD

O sistema foi concebido com conformidade à **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)** e ao **Decreto Municipal 18.855/2021** de São José dos Campos:

- Nenhuma lista pública de pacientes é exibida
- Cada paciente acessa exclusivamente seus próprios dados
- Autenticação dupla: CRA + Data de Nascimento (padrão já adotado pela prefeitura de SJC)
- Dados sensíveis nunca são expostos sem autenticação
- `ubs_id` e `gestor_id` vêm sempre do token JWT — nunca do corpo da requisição
- Log de auditoria completo: toda ação crítica é registrada com usuário, timestamp e entidade afetada

---

## 7. Resultados Entregues

| Resultado | Status |
|---|---|
| Portal do Gestor funcional com CRUD completo | ✅ Em produção |
| Portal do Paciente com timeline de status em tempo real | ✅ Em produção |
| Portal de Unidades Externas com push notifications | ✅ Em produção |
| Perfil Médico com RBAC e receituário imprimível | ✅ Em produção |
| 86 testes automatizados passando (suite completa) | ✅ Validado |
| 27 migrations aplicadas no banco de dados | ✅ Aplicadas em produção |
| Comunicados segmentados por condição clínica (ILIKE) | ✅ Em produção |
| Relatórios de atividade para o gestor (RF-G09) | ✅ Em produção |
| Sistema responsivo mobile-first (375px) | ✅ Validado |
| Conformidade LGPD em todas as rotas | ✅ Auditado |

---

## 8. Cronograma Macro — Realizado

| Fase | Período | Status |
|---|---|---|
| Fase 1 — Fundação | Semanas 1–3 | ✅ Concluída — documentação, arquitetura, modelo de dados |
| Fase 2 — MVP | Semanas 4–8 | ✅ Concluída — 3 portais funcionais, autenticação, CRUD completo |
| Fase 3 — Refinamento | Semanas 9–12 | ✅ Concluída — notificações push, histórico, relatórios, RBAC, banca |

---

*Documento atualizado em 2026-06-24 para refletir o sistema entregue na banca de avaliação.*
