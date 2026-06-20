# Início de Sessão — Gestão Saúde UBS+
> Este arquivo é atualizado pelo Arquiteto (Claude) ao final de cada fase ou sessão relevante.
> Todo agente deve ler este arquivo ANTES de qualquer execução.
> **Última atualização:** 2026-06-19 — Claude Sonnet 4.6 (Arquiteto)

---

## ⚠️ LEIA ISTO PRIMEIRO — Contexto Crítico

**Prazo:** Validação com banca acadêmica em **25/06/2026 (6 dias).**
**Natureza da demo:** Dados simulados. A banca avalia interface e fluxo, não backend ao vivo.
**Deploy ativo:**
  - Frontend: https://gestao-saude-ubs.vercel.app
  - Backend: https://gestao-saude-ubs-api.vercel.app
  - Banco: Supabase (`crdtguvjuyfszxbpnwms`) com dados de demo
**✅ SUPABASE_SECRET_KEY rotacionada (Claude Chrome Agent, pós 17/06) — sistema em produção confirmado.**

---

## Time Ativo nesta Fase

| Papel | Quem | Responsabilidade |
|---|---|---|
| **QA / Orquestrador** | Reinaldo | Valida entregas, aprova direções, testa fluxos |
| **Arquiteto** | Claude Sonnet 4.6 | Define o quê e como. Não executa código salvo emergência |
| **Dev Sênior Executor** | Google Antigravity | Executa código, segue briefings do Arquiteto |

---

## Status Real do Projeto — 20/06/2026

**Fase:** 2 — Avançado (módulos principais + hardening implementados)
**Build:** ✅ Passando — 36/36 testes, frontend build ok
**Testes E2E:** ❌ Módulos Regulação e Vigilância nunca testados em produção
**Migrations:** ✅ 018, 019, 020 aplicadas no Supabase e confirmadas
**Deploy:** ✅ Atualizado — commit `fe500f4` em produção (Railway + Vercel)
**Último commit:** `fe500f4` — feat(security): hardening HTTP, token_version, auditoria LGPD e RLS — TASK_24

---

## O que foi feito até agora

### Infraestrutura e Base
- [x] Documentação base em `docs/` (5 documentos acadêmicos)
- [x] Frontend React + Vite + Tailwind — 9 páginas gestor, 7 paciente + cadastro
- [x] Backend Node.js + Express + Knex — auth middleware, gestor.js (1526 linhas), paciente.js, admin.js
- [x] 20 migrations PostgreSQL no Supabase (001–020), todas aplicadas e validadas
- [x] Seeds: UBSs de SJC + gestores de teste + dados de demo
- [x] Autenticação JWT: gestor (e-mail + senha) e paciente (CRA + data nascimento)

### Portal do Gestor
- [x] Dashboard, Pacientes, Perfil/Solicitações, Medicamentos, Comunicados, Agendamentos, Usuários
- [x] Sidebar retrátil com persistência no localStorage (mobile-first)
- [x] Módulo Regulação — encaminhamentos externos com bridge automático para solicitações
- [x] Módulo Vigilância e Surtos — notificações com fluxo para gerar Comunicados urgentes
- [x] Módulos Transporte Sanitário e Serviço Social — REMOVIDOS (sem valor para MVP)

### Portal do Paciente
- [x] Dashboard, Solicitações, Detalhe, Medicamentos, Comunicados, Agendamentos, Cadastro
- [x] FAB "+" como hub de ações: bottom sheet com 4 categorias → pré-preenche agendamento
- [x] PWA básico (manifest + service worker)

### Backend Segurança (TASK_24 — 20/06)
- [x] Multi-tenant isolation via `ubs_id` em todas as rotas novas (encaminhamentos, vigilância)
- [x] Transações Knex para operações atômicas (encaminhamento → status solicitação)
- [x] Helmet + CORS restrito + rate limit global (300 req/15min) + rate limit login (10/15min)
- [x] `token_version` no JWT — revogação de sessão sem blacklist
- [x] `security_audit_logs` — auditoria de logins e operações sensíveis (LGPD)
- [x] RLS habilitado em 12 tabelas no Supabase
- [x] Campos explícitos em todas as respostas (sem `SELECT *`)
- [x] Validação Joi de entrada em rotas sensíveis

---

## Bugs Críticos Abertos (BLOQUEADORES)

| ID | Descrição | Arquivo(s) | Prioridade |
|---|---|---|---|
| **SEC-01** | SUPABASE_SECRET_KEY | ✅ Rotacionada (Claude Chrome, pós 17/06) | — |
| **C-01** | Gestor pode alterar solicitação de outra UBS por ID | `routes/gestor.js:123-146` | 🟡 Antes da banca |
| **C-02** | `observacao_gestor` exposta ao paciente via API | `routes/paciente.js:108-122` | 🟡 Antes da banca |
| **C-03** | Contas com `ativo=false` conseguem login | `routes/auth.js:36-48,80-88` | 🟡 Antes da banca |

> **C-04 (RBAC)**, **C-05 (rate limit)**, **C-06 (dependências)** — pós-25/06.
> **Nota:** C-01 já está resolvido para encaminhamentos (ubs_id) e vigilância (ubs_id) criados em TASK_23. O bug persiste em solicitações gerais do módulo anterior.

---

## Próximas Ações Imediatas (Ordem Obrigatória)

### 🟡 TESTE FUNCIONAL (nunca testado em produção)

1. **Reinaldo** — Testar fluxo completo de **Regulação**:
   - Gestor seleciona paciente → vê solicitações ativas → cria encaminhamento
   - Status da solicitação muda para `aguardando_regulacao` no portal do paciente
   - Marcar como Agendado (`window.prompt()` para data) → Realizado → solicitação fecha como `concluido`

2. **Reinaldo** — Testar fluxo completo de **Vigilância**:
   - Criar notificação de surto (sem paciente — surto territorial)
   - Confirmar → clicar "Gerar Alerta" → Comunicados abre pré-preenchido
   - Publicar comunicado → verificar no portal do paciente

3. **Antigravity** — Validar `window.prompt()` no mobile (Chrome Android/iOS). Se não funcionar, implementar input `type="date"` inline no modal como alternativa.

### 🟡 DADOS DE DEMO PARA A BANCA

4. **Antigravity** — Gerar seed de demo para 25/06:
   - 3–4 pacientes com nomes fictícios e CRAs de fácil memorização
   - 2–3 solicitações por paciente em status diferentes
   - 1–2 encaminhamentos ativos (1 AGUARDANDO_VAGA, 1 AGENDADO)
   - 1 notificação de vigilância confirmada (ex: Dengue em Jardim das Indústrias)
   - 3–4 slots de agendamento disponíveis para 25/06 manhã

### 🟡 ENSAIO FINAL

5. **Reinaldo** — Ensaio completo em produção 24/06 (véspera da banca):
   - Fluxo 1: Auto-cadastro paciente → aprovação gestor → visualização de status
   - Fluxo 2: Gestor atualiza medicamento → paciente vê disponibilidade
   - Fluxo 3: Gestor cria comunicado urgente → paciente vê na home
   - Fluxo 4: Paciente usa FAB "+" → seleciona consulta → agendamento pré-preenchido

---

## O que está pendente (pós-25/06)

- Substituir `window.prompt()` por DatePicker real no RegulacaoGestor
- C-01 completo: gestor cross-UBS em solicitações gerais do módulo anterior
- RBAC completo (C-04) — perfis recepcionista/gestor/admin
- Suite de testes automatizados E2E
- Atualização de dependências vulneráveis (C-06)
- Download de comprovante de agendamento (PDF)
- Push notifications frontend
- HL7 FHIR / RNDS
- WhatsApp Business API (Fase 2)
- Domínio Hostgator (pós-validação)
- Dashboard analítico completo (RF-G09)

---

## Como rodar o projeto localmente

```bash
# Terminal 1 — Backend
cd app/backend
npm run dev
# Sobe em http://localhost:3001

# Terminal 2 — Frontend
cd app/frontend
npm run dev
# Abre em http://localhost:5173
```

**Credenciais de teste (gestor):**
- centro@gestaoubs.dev / senha123
- industrial@gestaoubs.dev / senha123
- satelite@gestaoubs.dev / senha123

**Credencial paciente:** CRA + data de nascimento (cadastrar via Portal do Gestor).

---

## Banco de Dados

- **Plataforma:** Supabase (PostgreSQL) — projeto `crdtguvjuyfszxbpnwms`, região us-east-1
- **Pooler:** PgBouncer porta 6543 (transaction mode) — usar em produção
- **SSL:** obrigatório — `knexfile.js` configurado com `ssl: { rejectUnauthorized: false }`
- **Migrations aplicadas:** 001–017 + 2 migrations com timestamp (Antigravity TASK_23)
- **Migrations PENDENTES:** 018 (ubs_id em encaminhamentos), 019 (ubs_id em vigilância)
- **✅ SUPABASE_SECRET_KEY:** Rotacionada pós 17/06 — sistema em produção confirmado

---

## Arquitetura de Layout (não alterar sem autorização)

### Portal do Gestor
- Todas as páginas usam `<GestorLayout>` — gerencia `sidebarAberta` (drawer animado mobile)
- Padding: `p-4 md:p-6 lg:p-10`

### Portal do Paciente
- Todas as páginas usam `<PacienteLayout>` — `max-w-md`, `position: relative`
- `BottomNavSimples` usa `absolute` (não `fixed`) ancorado ao container do PacienteLayout
- FAB "+" abre bottom sheet com overlay — z-index 50, renderizado fora do `<nav>`

---

## Relatório Mais Recente

`.Agent/reports/2026-06-19_TASK22-TASK23_FAB_Regulacao_Vigilancia.md`

---

## Padrões de Código Obrigatórios

1. **Comentários** — Todo arquivo .js/.jsx/.sql deve ter cabeçalho explicativo (ver CLAUDE.md)
2. **Mobile-first** — Todas as telas devem funcionar em 375px antes de desktop
3. **Linguagem simples** — Textos ao paciente nunca usam jargão médico/burocrático
4. **LGPD** — Nenhuma rota expõe dados de pacientes sem autenticação
5. **Multi-tenant** — Toda query nova filtra por `ubs_id` do token JWT (`req.user.ubs_id`)
6. **Relatório de sessão** — Sessões que alteram arquivos geram relatório em `.Agent/reports/`
