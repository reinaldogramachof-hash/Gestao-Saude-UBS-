# Documento 05 — Roadmap e Cronograma
## Gestão Saúde UBS+ | Projeto de Extensão Multidisciplinar
### Faculdade UFBRA — Engenharia de Software

**Versão:** 2.0
**Data:** 2026-06-24
**Status:** ✅ Entregue — Sistema em produção | Banca: 26/06/2026 às 20h

---

## 1. Visão Geral das Fases

```
FASE 1 ✅       FASE 2 ✅                FASE 3 ✅
Fundação        MVP                      Refinamento
(Sem. 1–3)      (Sem. 4–8)              (Sem. 9–12)

Docs ✅         Frontend Gestor ✅       Notificações Push ✅
Arquitetura ✅  Frontend Paciente ✅     Histórico Completo ✅
Modelo Dados ✅ Backend API ✅          RBAC Médico ✅
Setup Dev ✅    Autenticação ✅          Portal Externo ✅
                CRUD Solicitações ✅     Relatórios ✅
                Medicamentos ✅          Regulação/Vigilância ✅
                Comunicados ✅           Documentação Final ✅
                                         Banca ← AMANHÃ
```

---

## 2. Fase 1 — Fundação ✅ (Semanas 1–3)

**Objetivo:** Estabelecer a base técnica, documental e de design.

| # | Tarefa | Status |
|---|---|---|
| 1.1 | Análise do ecossistema de saúde de SJC | ✅ Concluído |
| 1.2 | Definição de escopo e requisitos | ✅ Concluído |
| 1.3 | Definição da stack tecnológica | ✅ Concluído |
| 1.4 | Criação do CLAUDE.md e documentação base | ✅ Concluído |
| 1.5 | Modelo de dados (esquema PostgreSQL) | ✅ Concluído |
| 1.6 | Wireframes das telas core | ✅ Concluído (via Stitch MCP / design iterativo) |
| 1.7 | Setup do repositório GitHub | ✅ Concluído |
| 1.8 | Inicialização do projeto React (frontend) | ✅ Concluído |
| 1.9 | Inicialização do projeto Node.js (backend) | ✅ Concluído |
| 1.10 | Criação das migrations do banco de dados | ✅ 27 migrations aplicadas em produção |

---

## 3. Fase 2 — MVP ✅ (Semanas 4–8)

**Objetivo:** Sistema funcional com as funcionalidades essenciais dos dois portais.

### Fundação do Código
| # | Tarefa | Status |
|---|---|---|
| 2.1 | Configuração de autenticação JWT (backend) | ✅ JWT + bcrypt + RBAC por perfil |
| 2.2 | Tela de login — Portal do Paciente | ✅ CRA + data de nascimento |
| 2.3 | Tela de login — Portal do Gestor | ✅ Email + senha + perfil |
| 2.4 | Rotas protegidas no backend | ✅ Middleware autenticarToken em todas as rotas |

### Portal do Gestor
| # | Tarefa | Status |
|---|---|---|
| 2.5 | Dashboard de pacientes com filtros | ✅ Filtros por status, prioridade, tipo + busca por CRA/nome |
| 2.6 | Cadastro de paciente (formulário + API) | ✅ Incluindo dados clínicos e auto-cadastro |
| 2.7 | Cadastro e atualização de solicitações | ✅ Com historico_status automático |
| 2.8 | Gestão de medicamentos | ✅ Com dosagem e instruções de retirada |
| 2.9 | Envio de comunicados | ✅ Geral, individual + segmentação clínica + urgente |

### Portal do Paciente
| # | Tarefa | Status |
|---|---|---|
| 2.10 | Dashboard do paciente — cards de status | ✅ Com cor por status e badge urgente |
| 2.11 | Tela de consulta de medicamentos | ✅ Com busca parcial e instruções de retirada |
| 2.12 | Tela de comunicados | ✅ Com indicação de não lido e badge urgente |
| 2.13 | Detalhes de uma solicitação + histórico | ✅ Timeline visual com polling 20s |
| 2.14 | Validação visual de todas as telas (mobile) | ✅ Responsivo em 375px |

---

## 4. Fase 3 — Refinamento ✅ (Semanas 9–12)

**Objetivo:** Polimento, funcionalidades avançadas e documentação final.

| # | Tarefa | Status |
|---|---|---|
| 3.1 | Agendamento com gestão (lote de slots) | ✅ POST /agendamentos/lote com recorrência |
| 3.2 | Histórico completo de solicitações | ✅ Seção "Histórico" em SolicitacoesPaciente |
| 3.3 | Notificações push (Web Push VAPID) | ✅ pushService + push_subscriptions |
| 3.4 | Portal de Unidades Externas | ✅ 3 páginas + dashboard + encaminhamentos |
| 3.5 | RBAC completo — Perfil Médico | ✅ soNaoMedico + PainelMedico + receituário |
| 3.6 | Dashboard analítico para gestor (RF-G09) | ✅ Donut SVG + urgências ociosas |
| 3.7 | Regulação e Vigilância Epidemiológica | ✅ Módulos completos com auditoria |
| 3.8 | Serviço Social e Transporte Sanitário | ✅ CRUD completo com backend |
| 3.9 | Segmentação clínica de comunicados | ✅ ILIKE em comorbidades (migration 027) |
| 3.10 | Suite de testes automatizados | ✅ 86 testes, 0 falhas, 14 arquivos de teste |
| 3.11 | Log de auditoria completo | ✅ registrarAuditoria em todas as ações críticas |
| 3.12 | Documentação técnica atualizada | ✅ docs/01 a 05 atualizados em 2026-06-24 |
| 3.13 | Roteiro de apresentação para banca | ✅ docs/Roteiro_Banca.md |
| 3.14 | Apresentação para banca | 🎯 26/06/2026 às 20h |

---

## 5. Critérios de Conclusão — Verificados

### Fase 1 — ✅ Concluída
- [x] Todos os 10 itens concluídos
- [x] Banco de dados criado e 27 migrations rodando sem erro em produção
- [x] Repositório GitHub organizado com branch main

### Fase 2 — ✅ Concluída
- [x] Gestor consegue: cadastrar paciente, criar solicitação, atualizar status, gerenciar medicamentos, enviar comunicado
- [x] Paciente consegue: fazer login, ver suas solicitações com status, consultar medicamentos, ver comunicados
- [x] Validação visual em 375px (mobile) aprovada
- [x] Nenhuma rota da API retorna dados sem autenticação

### Fase 3 — ✅ Concluída
- [x] Suite de testes: 86/86 passando
- [x] Documentação técnica revisada e atualizada (2026-06-24)
- [x] Roteiro de apresentação preparado
- [x] Sistema em produção na Vercel

---

## 6. Marcos Acadêmicos

| Marco | Data Prevista | Status |
|---|---|---|
| M1 — Entrega Documental | Semana 3 | ✅ Concluído |
| M2 — Demo MVP | Semana 8 | ✅ Superado — 3 portais em produção |
| M3 — Entrega Final | Semana 12 (26/06/2026) | 🎯 Amanhã — sistema completo |

---

## 7. Métricas Finais de Entrega

| Métrica | Valor |
|---|---|
| Arquivos de código (frontend) | ~35 componentes e páginas |
| Rotas de backend | 38 rotas no portal gestor + 12 paciente + 6 externa + 3 auth |
| Migrations de banco de dados | 27 aplicadas em produção |
| Testes automatizados | 86 testes, 0 falhas |
| Portais entregues | 3 (Gestor, Paciente, Externo) |
| Módulos extras (além do escopo MVP) | 4 (Portal Externo, RBAC Médico, Regulação/Vigilância, Serviço Social/Transporte) |
| Notificações push implementadas | Web Push VAPID (paciente + gestor) |
| LGPD: rotas sem auth expondo pacientes | 0 |

---

*Documento atualizado em 2026-06-24 para a entrega final na banca de avaliação.*
