# Documento 05 — Roadmap e Cronograma
## Gestão Saúde UBS+ | Projeto de Extensão Multidisciplinar
### Faculdade UFBRA — Engenharia de Software

**Versão:** 1.0
**Data:** 2026-04-20
**Status:** Em execução — Fase 1

---

## 1. Visão Geral das Fases

```
FASE 1          FASE 2                    FASE 3
Fundação        MVP                       Refinamento
(Sem. 1–3)      (Sem. 4–8)               (Sem. 9–12)

Docs ✓          Frontend Gestor           Notificações
Arquitetura ✓   Frontend Paciente         Histórico Completo
Modelo Dados ✓  Backend API               Testes com Usuários
Wireframes      Autenticação              Documentação Final
Setup Dev       CRUD Solicitações         Ajustes de UX
                Medicamentos
                Comunicados
```

---

## 2. Fase 1 — Fundação (Semanas 1–3)

**Objetivo:** Estabelecer a base técnica, documental e de design antes de escrever qualquer linha de código de produto.

| # | Tarefa | Responsável | Status |
|---|---|---|---|
| 1.1 | Análise do ecossistema de saúde de SJC | Reinaldo + Claude | ✅ Concluído |
| 1.2 | Definição de escopo e requisitos | Reinaldo + Claude | ✅ Concluído |
| 1.3 | Definição da stack tecnológica | Reinaldo | ✅ Concluído |
| 1.4 | Criação do CLAUDE.md e documentação base | Claude | ✅ Concluído |
| 1.5 | Modelo de dados (esquema PostgreSQL) | Claude + Reinaldo | ✅ Concluído |
| 1.6 | Wireframes das telas core | Stitch MCP | ⏳ Pendente |
| 1.7 | Setup do repositório GitHub | Reinaldo | ⏳ Pendente |
| 1.8 | Inicialização do projeto React (frontend) | Fast Mode | ⏳ Pendente |
| 1.9 | Inicialização do projeto Node.js (backend) | Fast Mode | ⏳ Pendente |
| 1.10 | Criação das migrations do banco de dados | Deep Think | ⏳ Pendente |

**Entrega da Fase 1:** Estrutura de código inicializada, banco de dados criado, wireframes validados.

---

## 3. Fase 2 — MVP (Semanas 4–8)

**Objetivo:** Sistema funcional com as funcionalidades essenciais dos dois portais.

### Semana 4–5: Fundação do Código
| # | Tarefa | Agente |
|---|---|---|
| 2.1 | Configuração de autenticação JWT (backend) | Deep Think |
| 2.2 | Tela de login — Portal do Paciente | Stitch MCP + Fast Mode |
| 2.3 | Tela de login — Portal do Gestor | Stitch MCP + Fast Mode |
| 2.4 | Rotas protegidas no backend | Deep Think |

### Semana 5–6: Portal do Gestor
| # | Tarefa | Agente |
|---|---|---|
| 2.5 | Dashboard de pacientes com filtros | Stitch MCP + Fast Mode |
| 2.6 | Cadastro de paciente (formulário + API) | Fast Mode |
| 2.7 | Cadastro e atualização de solicitações | Deep Think |
| 2.8 | Gestão de medicamentos (disponível/indisponível) | Fast Mode |
| 2.9 | Envio de comunicados | Fast Mode |

### Semana 7–8: Portal do Paciente
| # | Tarefa | Agente |
|---|---|---|
| 2.10 | Dashboard do paciente — cards de status | Stitch MCP + Fast Mode |
| 2.11 | Tela de consulta de medicamentos | Fast Mode |
| 2.12 | Tela de comunicados | Fast Mode |
| 2.13 | Detalhes de uma solicitação + histórico | Deep Think |
| 2.14 | Validação visual de todas as telas (mobile) | Subagente de Navegador |

**Entrega da Fase 2:** MVP funcional com os dois portais, demonstrável para os coordenadores da faculdade.

---

## 4. Fase 3 — Refinamento (Semanas 9–12)

**Objetivo:** Polimento, testes com usuários reais e documentação final para entrega acadêmica.

| # | Tarefa | Agente |
|---|---|---|
| 3.1 | Agendamento com gestão (calendário) | Deep Think + Stitch MCP |
| 3.2 | Histórico completo de solicitações | Fast Mode |
| 3.3 | Notificações por e-mail (mudanças de status) | Deep Think |
| 3.4 | Testes de usabilidade com usuários reais | Reinaldo |
| 3.5 | Ajustes de UX baseados no feedback dos testes | Fast Mode |
| 3.6 | Dashboard analítico para gestor (RF-G09) | Deep Think |
| 3.7 | Documentação técnica final | Claude |
| 3.8 | Apresentação para banca | Reinaldo |

**Entrega da Fase 3:** Sistema completo, documentado e validado com usuários reais.

---

## 5. Critérios de Conclusão por Fase

### Fase 1 — Concluída quando:
- [ ] Todos os 10 itens da tabela marcados como concluídos
- [ ] Wireframes aprovados por Reinaldo
- [ ] Banco de dados criado e migrations rodando sem erro
- [ ] Repositório GitHub organizado com branches main/develop

### Fase 2 — Concluída quando:
- [ ] Gestor consegue: cadastrar paciente, criar solicitação, atualizar status, gerenciar medicamentos, enviar comunicado
- [ ] Paciente consegue: fazer login, ver suas solicitações com status, consultar medicamentos, ver comunicados
- [ ] Validação visual em 375px (mobile) aprovada pelo subagente de navegador
- [ ] Nenhuma rota da API retorna dados sem autenticação

### Fase 3 — Concluída quando:
- [ ] Sistema testado com pelo menos 5 usuários reais (gestores ou pacientes de UBS)
- [ ] Documentação técnica revisada e atualizada
- [ ] Apresentação preparada para banca de avaliação

---

## 6. Marcos Acadêmicos

| Marco | Data Prevista | Descrição |
|---|---|---|
| M1 — Entrega Documental | Semana 3 | Documentação completa para validação da coordenação |
| M2 — Demo MVP | Semana 8 | Demonstração do sistema funcional para orientador |
| M3 — Entrega Final | Semana 12 | Sistema completo + documentação + apresentação |

---

*Documento mantido e atualizado pelo time de desenvolvimento a cada fase concluída.*
