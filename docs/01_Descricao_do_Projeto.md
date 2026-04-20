# Documento 01 — Descrição do Projeto
## Gestão Saúde UBS+ | Projeto de Extensão Multidisciplinar
### Faculdade UFBRA — Engenharia de Software

**Versão:** 1.0
**Data:** 2026-04-20
**Status:** Em desenvolvimento

---

## 1. Identificação do Projeto

| Campo | Informação |
|---|---|
| **Nome do Projeto** | Gestão Saúde UBS+ |
| **Curso** | Engenharia de Software |
| **Tipo** | Projeto de Extensão Multidisciplinar |
| **Município Parceiro** | São José dos Campos — SP |
| **Contexto de Aplicação** | Unidades Básicas de Saúde (UBS) da rede municipal do SUS |

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

## 3. Proposta de Solução

Desenvolvimento de uma **aplicação web responsiva** (acessível por smartphone e computador) com dois portais distintos:

### Portal do Gestor (Equipe da UBS)
A equipe gestora utiliza um painel administrativo para:
- Cadastrar pacientes e suas solicitações (exames, consultas, procedimentos)
- Atualizar o status de cada solicitação em linguagem simples
- Gerenciar a disponibilidade de medicamentos na unidade
- Enviar comunicados gerais ou individuais
- Disponibilizar horários para atendimento presencial com a gestão

### Portal do Paciente (Munícipe)
O paciente acessa um painel personalizado para:
- Visualizar o status atualizado de seus exames, consultas e procedimentos em linguagem acessível
- Verificar se um medicamento está disponível na sua UBS antes de sair de casa
- Receber comunicados da equipe gestora
- Agendar um horário de atendimento com a gestão da UBS

### Princípio Central
> "Não reinventar a roda — melhorar os eixos para um giro mais funcional."

O sistema **não substitui** os sistemas nacionais do SUS (e-SUS, SISREG, CROSS). Funciona como uma **camada de transparência e comunicação** sobre os processos já existentes, com a equipe gestora alimentando as informações manualmente.

---

## 4. Público-Alvo

| Perfil | Descrição |
|---|---|
| **Gestores e Recepcionistas de UBS** | Profissionais responsáveis por atualizar o sistema com informações de pacientes |
| **Pacientes da rede municipal** | Munícipes de SJC cadastrados no SUS com CRA (Cadastro de Regulação Ambulatorial) |
| **Responsáveis legais** | Pais, tutores ou cuidadores que gerenciam a saúde de dependentes |

---

## 5. Justificativa Social e Acadêmica

### Justificativa Social
São José dos Campos possui mais de 730 mil habitantes e opera uma rede de UBSs que realiza milhares de atendimentos mensais. O programa UBS Resolve, iniciativa inovadora da prefeitura, já internalizou a coleta laboratorial nas próprias unidades (aproximadamente 4.000 exames/mês por unidade populosa), aumentando o volume de informações que precisam ser rastreadas pelo paciente.

A transparência no acompanhamento de filas e solicitações de saúde é objeto de legislação ativa no Brasil (PL nº 335/2024, em tramitação na Câmara Federal) e já foi implementada em estados como Santa Catarina (Lei 17.066/2017). Este projeto antecipa essa tendência legislativa com uma solução tecnológica prática.

### Justificativa Acadêmica
O projeto aplica diretamente competências do curso de Engenharia de Software:
- Levantamento e análise de requisitos em contexto real de governo
- Desenvolvimento fullstack com tecnologias de mercado (React, Node.js, PostgreSQL)
- Arquitetura de software multicamadas
- Segurança de dados e conformidade com LGPD
- Design centrado no usuário (UX) para populações diversas

---

## 6. Alinhamento com a LGPD

O sistema foi concebido com conformidade à **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)** e ao **Decreto Municipal 18.855/2021** de São José dos Campos:

- Nenhuma lista pública de pacientes é exibida
- Cada paciente acessa exclusivamente seus próprios dados
- Autenticação dupla: CRA + Data de Nascimento (padrão já adotado pela prefeitura de SJC)
- Dados sensíveis (diagnósticos, medicamentos controlados) nunca são expostos sem autenticação

---

## 7. Resultados Esperados

| Resultado | Indicador de Sucesso |
|---|---|
| Redução de filas de informação nas UBSs | Pacientes conseguem verificar status sem presença física |
| Redução de deslocamentos desnecessários à farmácia | Consulta de estoque de medicamentos via app antes de sair de casa |
| Melhoria na satisfação do paciente | Feedback qualitativo coletado em testes com usuários |
| Comunicação UBS → Paciente mais eficiente | Envio de comunicados e confirmações digitais |
| Protótipo funcional validado | Sistema testado com usuários reais de pelo menos uma UBS |

---

## 8. Cronograma Macro

| Fase | Período | Entregas |
|---|---|---|
| Fase 1 — Fundação | Semanas 1–3 | Documentação, arquitetura, modelo de dados, wireframes |
| Fase 2 — MVP | Semanas 4–8 | Portais do gestor e paciente funcionais, autenticação, CRUD básico |
| Fase 3 — Refinamento | Semanas 9–12 | Notificações, histórico, testes com usuários, documentação final |

---

*Documento mantido e atualizado pelo time de desenvolvimento a cada fase concluída.*
