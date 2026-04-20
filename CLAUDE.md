# CLAUDE.md — Gestão Saúde UBS+
> Arquivo de instrução master do projeto. Leitura obrigatória para qualquer agente antes de executar qualquer tarefa.
> Última atualização: 2026-04-20

---

## O que é este projeto

**Gestão Saúde UBS+** é um projeto de Extensão Multidisciplinar da Graduação de Engenharia de Software da **UFBRA**.

Trata-se de uma aplicação web que melhora a comunicação entre a equipe gestora das UBSs (Unidades Básicas de Saúde) de **São José dos Campos (SP)** e os pacientes, eliminando a desinformação sobre filas, exames, consultas e medicamentos.

**Foco:** Transparência de informação — não substituir sistemas existentes do SUS (e-SUS, SISREG, CROSS).

---

## Dois Portais, Uma Missão

| Portal | Usuário | Função Principal |
|---|---|---|
| **Portal do Gestor** | Equipe da UBS | Cadastrar e atualizar status de pacientes, exames, consultas, medicamentos e comunicados |
| **Portal do Paciente** | Munícipe de SJC | Visualizar suas solicitações ativas, status em linguagem simples, disponibilidade de medicamentos e agendar atendimento com a gestão |

---

## Stack Tecnológica Aprovada

| Camada | Tecnologia |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend | Node.js + Express |
| Banco de Dados | PostgreSQL |
| Autenticação | JWT + bcrypt |
| Hosting (dev/produção acadêmica) | Vercel (frontend) + Railway (backend) |
| Notificações (Fase 2) | WhatsApp Business API |

---

## Estrutura de Pastas do Projeto

```
/
├── CLAUDE.md                        ← Este arquivo
├── .Agent/
│   ├── Agentes_Routing              ← Regras de roteamento de agentes
│   ├── Session-Report               ← Template de relatório de sessão
│   ├── Inicio_de_Sessao.md          ← Briefing obrigatório para início de sessão
│   └── reports/                     ← Relatórios de sessão gerados
├── docs/
│   ├── 01_Descricao_do_Projeto.md   ← Documento para coordenadores da faculdade
│   ├── 02_Arquitetura_Tecnica.md    ← Arquitetura técnica do sistema
│   ├── 03_Modelo_de_Dados.md        ← Esquema do banco de dados
│   ├── 04_Requisitos_Funcionais.md  ← Requisitos funcionais e casos de uso
│   └── 05_Roadmap.md                ← Fases e cronograma do projeto
├── app/
│   ├── frontend/                    ← Aplicação React
│   └── backend/                     ← API Node.js + Express
└── database/
    └── migrations/                  ← Scripts SQL de criação e migração
```

---

## Regra Absoluta — Comentários em Código

> **TODOS os arquivos de código (.js, .jsx, .ts, .tsx, .sql, .css, configurações) DEVEM ter comentários explicativos.**

A equipe possui membros com menor experiência técnica. Os comentários são a documentação inline do projeto. Siga este padrão:

```jsx
// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: StatusCard
// FUNÇÃO: Exibe o status atual de uma solicitação (exame, consulta, procedimento)
//         do paciente em formato de card visual com cor indicativa.
// PROPS:
//   - tipo: string — tipo da solicitação ("exame", "consulta", "procedimento")
//   - status: string — fase atual ("em_analise", "autorizado", "data_marcada", etc.)
//   - descricao: string — texto em linguagem simples exibido ao paciente
// ─────────────────────────────────────────────────────────────────────────────
```

Para funções e blocos de lógica:

```js
// Verifica se o token JWT ainda é válido comparando a data de expiração
// com o horário atual. Retorna true se válido, false se expirado.
function isTokenValid(token) { ... }
```

**Não comentar o óbvio** (`// incrementa i`), mas comentar qualquer lógica, decisão técnica ou integração que um desenvolvedor júnior não entenderia sem contexto.

---

## Autenticação dos Usuários

| Perfil | Método de Login |
|---|---|
| Paciente | CRA (Cadastro de Regulação Ambulatorial) + Data de Nascimento |
| Gestor da UBS | E-mail institucional + Senha |

> **LGPD:** O sistema nunca exibe listas públicas de pacientes. Cada paciente acessa apenas seus próprios dados. Conforme Decreto Municipal 18.855/2021 de SJC.

---

## Entidades do Sistema

| Entidade | Descrição |
|---|---|
| `paciente` | CRA, nome, CPF, data de nascimento, telefone, UBS de referência |
| `solicitacao` | Exame / Consulta / Procedimento — tipo, status atual, data prevista, observações |
| `medicamento` | Nome, disponível (sim/não), UBS, data de atualização |
| `comunicado` | Mensagens da gestão — geral ou individual |
| `agendamento_gestao` | Horários para atendimento presencial com a equipe gestora |
| `usuario_gestor` | Staff da UBS com nível de acesso (recepcionista / gestor / admin) |

---

## Status de Solicitação (Fluxo)

```
Em análise → Aguardando regulação → Autorizado → Data marcada → Concluído
```

Cada status tem uma descrição em **linguagem simples** para exibição ao paciente (sem jargão clínico ou burocrático).

---

## Time do Projeto

**Desenvolvedor Líder / Arquiteto Humano:** Reinaldo — único membro com conhecimento técnico avançado. Todas as decisões arquiteturais passam por ele.

**Agentes de IA (ver `.Agent/Agentes_Routing` para detalhes completos):**
- **Claude Sonnet 4.6** — Arquiteto, planejamento, briefing, validação final
- **Antigravity Fast Mode** — Ajustes cirúrgicos, CSS, boilerplate, scripts
- **Antigravity Deep Think** — Módulos complexos, refatoração multi-arquivo, lógica de negócio
- **Subagente de Navegador** — Validação visual de UI (invocação explícita obrigatória)
- **Agente Stitch MCP** — Geração de telas frontend e design systems

---

## Regras Gerais de Desenvolvimento

1. **Escopo restrito:** Não integrar com e-SUS, SISREG ou CROSS no MVP. O gestor alimenta o sistema manualmente.
2. **Mobile-first:** Todas as telas devem funcionar em 375px (celular) antes de desktop.
3. **Linguagem simples:** Textos exibidos ao paciente nunca usam jargão médico ou burocrático.
4. **LGPD first:** Nenhuma rota expõe dados de pacientes sem autenticação.
5. **Comentários obrigatórios:** Ver seção "Regra Absoluta — Comentários em Código" acima.
6. **Relatório de sessão:** Toda sessão que altere arquivos gera um relatório em `.Agent/reports/` (ver `.Agent/Session-Report`).
7. **Documentação viva:** Os arquivos em `docs/` devem ser atualizados a cada fase concluída.

---

## Início de Sessão

Antes de qualquer tarefa, o agente deve:
1. Ler `.Agent/Inicio_de_Sessao.md` para contexto da sessão atual
2. Ler o relatório mais recente em `.Agent/reports/` para retomar contexto
3. Confirmar entendimento antes de executar qualquer código
