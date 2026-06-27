# Documento 05 — Roadmap e Cronograma
## Gestão Saúde UBS+ | Projeto de Extensão Multidisciplinar
### Faculdade UFBRA — Engenharia de Software

**Versão:** 3.0
**Data:** 2026-06-27
**Status:** ✅ Aprovado pela banca (25/06/2026) — Fase 4 iniciada: Aplicação Real em SJC

---

## 1. Visão Geral das Fases

```
FASE 1 ✅       FASE 2 ✅                FASE 3 ✅           FASE 4 🚀
Fundação        MVP                      Refinamento          Produção Real
(Sem. 1–3)      (Sem. 4–8)              (Sem. 9–12)          (27/06–26/07/2026)

Docs ✅         Frontend Gestor ✅       Notificações Push ✅  Estabilização ✅→
Arquitetura ✅  Frontend Paciente ✅     Histórico Completo ✅ LGPD Real
Modelo Dados ✅ Backend API ✅          RBAC Médico ✅        Superadmin
Setup Dev ✅    Autenticação ✅          Portal Externo ✅     WhatsApp
                CRUD Solicitações ✅     Relatórios ✅         Acessibilidade
                Medicamentos ✅          Regulação/Vigilância ✅ Monitoramento
                Comunicados ✅           Banca ✅ 25/06/2026   Piloto UBS Real
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

---

## 8. Fase 4 — Produção Real em SJC (27/06 – 26/07/2026)

**Contexto:** O projeto foi aprovado pela banca da UFBRA em 25/06/2026 e autorizado para aplicação em cenário real nas UBSs de São José dos Campos. Esta fase transforma o MVP acadêmico num sistema que gestores e pacientes reais vão depender.

**A diferença fundamental:** num ambiente acadêmico, uma falha é um aprendizado. Num ambiente de saúde pública, uma falha pode privar um paciente de informação crítica sobre seu tratamento.

---

### Semana 1 — Estabilização e Dívida Técnica (27/06 – 03/07)

Resolver tudo que ficou pendente da banca antes de avançar qualquer funcionalidade nova.

| # | Tarefa | Prioridade | Motivo |
|---|---|---|---|
| 4.1 | Remover `index.lock` e fazer commit/push de todos os arquivos pendentes | 🔴 CRÍTICO | ~50 arquivos modificados fora do git há 2+ dias |
| 4.2 | Aplicar migration 027 em produção (`segmentacao_clinica`) | 🔴 CRÍTICO | Feature entregue na banca sem estar ativa em prod |
| 4.3 | Configurar Sentry no frontend e backend | 🔴 CRÍTICO | Sem monitoramento, falhas em produção são invisíveis |
| 4.4 | Configurar UptimeRobot (ou similar) para alertas de downtime | 🟠 ALTA | Sistema de saúde pública não pode cair silenciosamente |
| 4.5 | Rate limiting nas rotas de autenticação (`/auth/login`, `/auth/paciente`) | 🔴 CRÍTICO | Dados de saúde reais expõem risco de brute-force no CRA |
| 4.6 | Remover todos os dados de seed acadêmicos e inserir UBSs reais de SJC | 🟠 ALTA | O sistema está populado com dados fictícios da banca |
| 4.7 | Auditoria de variáveis de ambiente — confirmar que nenhum segredo está no repositório | 🔴 CRÍTICO | Transição de acadêmico para produção real |

---

### Semana 2 — Infraestrutura de Gestão e LGPD Real (04/07 – 10/07)

O sistema não tem mecanismo para criar gestores ou gerenciar múltiplas UBSs sem acesso direto ao banco. Isso é inaceitável em produção real.

| # | Tarefa | Prioridade | Motivo |
|---|---|---|---|
| 4.8 | **Painel Superadmin** — criar/desativar UBSs, criar/resetar contas de gestores, visualizar logs por UBS | 🔴 CRÍTICO | Hoje não existe forma de onboarding de gestores sem SQL manual |
| 4.9 | **Fluxo de redefinição de senha** para gestores (email + token temporário) | 🔴 CRÍTICO | Sem isso, qualquer gestor que esqueça a senha trava o sistema |
| 4.10 | **Termo de consentimento LGPD** exibido no primeiro login do paciente, com registro de aceite em banco | 🟠 ALTA | Dado de saúde real exige consentimento explícito documentado |
| 4.11 | **Rota de exclusão de dados** do paciente (direito ao esquecimento, Art. 18 LGPD) | 🟠 ALTA | Obrigação legal, não opcional |
| 4.12 | **Log de acesso por paciente** — gestor vê quais usuários acessaram os dados de um paciente específico | 🟠 ALTA | Requisito de auditoria para dados sensíveis de saúde |
| 4.13 | Política de privacidade e termos de uso em página pública | 🟡 MÉDIA | Exigência legal para qualquer serviço com dados pessoais |

---

### Semana 3 — WhatsApp e Experiência Real (11/07 – 17/07)

Web Push funciona para usuários tech-savvy com smartphones modernos. O público real das UBSs de SJC — idosos, população de baixa renda — usa WhatsApp. Esta é a mudança de maior impacto desta fase.

| # | Tarefa | Prioridade | Motivo |
|---|---|---|---|
| 4.14 | **Integração WhatsApp Business API** — notificação de mudança de status de solicitação | 🔴 CRÍTICO | Web Push tem taxa de adoção ~10% no público-alvo; WhatsApp ~90% |
| 4.15 | **Notificação WhatsApp** — lembrete de agendamento com gestor (D-1) | 🟠 ALTA | Reduz no-shows sem exigir que o paciente abra o app |
| 4.16 | **Notificação WhatsApp** — medicamento disponível para retirada | 🟠 ALTA | Caso de uso de altíssima frequência nas UBSs |
| 4.17 | **Acessibilidade (WCAG 2.1 AA)** — revisão de contraste, tamanho de toque, suporte a leitor de tela | 🟠 ALTA | Pacientes idosos e com deficiência visual são público primário |
| 4.18 | **Tamanho de fonte configurável** no portal do paciente (+/- via preferência salva) | 🟡 MÉDIA | Idosos com dificuldade visual não usarão o sistema sem isso |
| 4.19 | **Exportação de relatórios** em PDF e Excel para gestores | 🟡 MÉDIA | Gestores precisam reportar para a Secretaria de Saúde fora do sistema |
| 4.20 | Internacionalização básica de erros e mensagens do backend (PT-BR consistente) | 🟡 MÉDIA | Mensagens de erro ainda aparecem em inglês em alguns fluxos |

---

### Semana 4 — Piloto, Treinamento e Documentação Operacional (18/07 – 26/07)

| # | Tarefa | Prioridade | Motivo |
|---|---|---|---|
| 4.21 | **Piloto com 1 UBS real** — onboarding de gestores, cadastro dos primeiros pacientes reais | 🔴 CRÍTICO | Validação real é insubstituível; falhas aparecem aqui |
| 4.22 | **Manual do Gestor** — guia ilustrado para recepcionistas e gestores (PDF imprimível) | 🟠 ALTA | Gestores não vão ler código; precisam de documentação visual |
| 4.23 | **Guia do Paciente** — flyer/card explicando o CRA e como fazer login (para distribuição física) | 🟠 ALTA | Pacientes precisam saber que o sistema existe |
| 4.24 | **Playbook de incidentes** — o que fazer se o sistema cair, quem acionar, como restaurar | 🟠 ALTA | Sistema de saúde pública precisa de protocolo de contingência |
| 4.25 | Sessão de treinamento com equipe da UBS piloto | 🟠 ALTA | Adoção falha sem treinamento presencial |
| 4.26 | **Backup automático** do banco de dados com retenção de 30 dias | 🔴 CRÍTICO | Dado de saúde perdido é irrecuperável e tem implicações legais |
| 4.27 | Avaliação de performance sob carga real (query explain analyze nas rotas críticas) | 🟡 MÉDIA | Seeds acadêmicas têm ~50 registros; produção real pode ter milhares |

---

## 9. Critérios de Sucesso — Fase 4

Ao final de 26/07/2026, o sistema deve atender:

- [ ] Zero dados acadêmicos em produção
- [ ] Pelo menos 1 UBS piloto com gestores reais operando o sistema
- [ ] Monitoramento ativo com alertas configurados (Sentry + UptimeRobot)
- [ ] LGPD: consentimento registrado, exclusão funcionando, logs de acesso ativos
- [ ] WhatsApp: pelo menos a notificação de mudança de status em produção
- [ ] Manual do Gestor impresso e entregue à UBS piloto
- [ ] Backup automático funcionando e testado

---

## 10. O que NÃO entra na Fase 4

Itens descartados desta fase por risco de escopo ou dependência externa:

| Item | Motivo |
|---|---|
| Integração com e-SUS / SISREG / CROSS | Fora do escopo por decisão arquitetural — o gestor alimenta manualmente |
| App nativo (iOS / Android) | Web PWA é suficiente para o prazo; app nativo é Fase 5+ |
| IA para triagem de solicitações | Sem dados históricos reais suficientes para treinar |
| Pagamento / taxa de agendamento | UBS é serviço público gratuito |

---

*Documento atualizado em 2026-06-27 — Fase 4 iniciada após aprovação da banca em 25/06/2026.*
