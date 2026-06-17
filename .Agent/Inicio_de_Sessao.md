# Início de Sessão — Gestão Saúde UBS+
> Este arquivo é atualizado pelo Arquiteto (Claude) ao final de cada fase ou sessão relevante.
> Todo agente deve ler este arquivo ANTES de qualquer execução.
> **Última atualização:** 2026-06-17 18:30 — Claude Sonnet 4.6 (Arquiteto)

---

## ⚠️ LEIA ISTO PRIMEIRO — Contexto Crítico

**Prazo:** Validação com banca acadêmica em **25/06/2026 (8 dias).**
**Natureza da demo:** Dados simulados. A banca avalia interface e fluxo, não backend ao vivo.
**Deploy obrigatório:** Frontend no Vercel. Backend em Railway ou Render. SEM deploy, não há demo.
**Banco:** Neon (PostgreSQL serverless) — status a confirmar por Reinaldo.

---

## Time Ativo nesta Fase

| Papel | Quem | Responsabilidade |
|---|---|---|
| **QA / Orquestrador** | Reinaldo | Valida entregas, aprova direções, testa fluxos |
| **Arquiteto** | Claude Sonnet 4.6 | Define o quê e como. Não executa código salvo emergência |
| **Dev Sênior Executor** | Google Antigravity | Executa código, segue briefings do Arquiteto |

---

## Status Real do Projeto — 17/06/2026

**Fase:** 2 — Parcial Avançado *(NÃO "completo" — a auditoria de 11/06 confirmou)*
**Build:** ✅ Passando (111 módulos, ~2.7s)
**Testes automáticos:** 28 contratos passando (cobertura parcial)
**Testes E2E:** ❌ Nunca executados contra banco real
**Validação visual 375px:** ❌ Nunca executada de fato
**Deploy:** ✅ REALIZADO em 17/06/2026
  - Frontend: https://gestao-saude-ubs.vercel.app
  - Backend: https://gestao-saude-ubs-api.vercel.app
  - Banco: Supabase (`crdtguvjuyfszxbpnwms`) com dados de demo

---

## O que foi feito até agora

- [x] Documentação base em `docs/` (5 documentos acadêmicos)
- [x] Repositório e estrutura de pastas
- [x] Frontend React + Vite + Tailwind — 15 páginas JSX (7 gestor, 7 paciente + cadastro)
- [x] Backend Node.js + Express + Knex — server.js, auth middleware, 5 arquivos de rotas
- [x] 12 migrations PostgreSQL (001–012) no Neon via Knex
- [x] Seeds de desenvolvimento (UBSs de SJC + gestores de teste)
- [x] Autenticação JWT: gestor (e-mail + senha) e paciente (CRA + data nascimento)
- [x] Portal do Gestor: Dashboard, Pacientes, Perfil/Solicitações, Medicamentos, Comunicados, Agendamentos, Usuários
- [x] Portal do Paciente: Dashboard, Solicitações, Detalhe, Medicamentos, Comunicados, Agendamentos, Cadastro
- [x] Layouts responsivos: GestorLayout com drawer mobile, PacienteLayout mobile-first
- [x] Módulo admin de gestores (criado 11/06) — CRUD de usuários da UBS
- [x] Sidebar retrátil do gestor com persistência no localStorage (11/06)
- [x] PWA básico: manifest.json + sw.js + ícones

---

## Bugs Críticos Abertos (BLOQUEADORES)

> Devem ser corrigidos ANTES da demo. São simples de resolver — o Antigravity executa.

| ID | Descrição | Arquivo(s) | Esforço |
|---|---|---|---|
| **C-01** | Gestor pode alterar solicitação de outra UBS por ID | `routes/gestor.js:123-146` | Baixo |
| **C-02** | `observacao_gestor` (nota interna) exposta ao paciente via API | `routes/paciente.js:108-122` | Baixo |
| **C-03** | Contas com `ativo=false` conseguem fazer login | `routes/auth.js:36-48,80-88` | Baixo |
| **C-05** | Zero rate limit no login (força bruta possível) | `routes/auth.js` + `server.js` | Baixo |

> **C-04 (RBAC)** e **C-06 (dependências vulneráveis)** ficam para pós-25/06.

---

## Pendências Funcionais Prioritárias para a Demo

### Portal do Paciente (prioridade máxima — banca vai testar como usuário)
- [ ] Linguagem simples: remover status bruto e texto técnico das telas
- [ ] Separar solicitações ativas do histórico
- [ ] Logout visível
- [ ] Estado de erro com mensagem amigável (não skeleton infinito)
- [ ] `observacao_gestor` invisível ao paciente (C-02)

### Portal do Gestor
- [ ] Histórico inicial gravado ao criar solicitação (timeline nasce vazia — M-02)
- [ ] Data de atualização nos medicamentos (paciente vê "atualizado em X")
- [ ] Correção de datas: `new Date('YYYY-MM-DD')` exibe dia anterior em SJC (M-17)

### Deploy — ✅ CONCLUÍDO em 17/06
- [x] Frontend no Vercel: `gestao-saude-ubs.vercel.app`
- [x] Backend no Vercel (serverless): `gestao-saude-ubs-api.vercel.app`
- [x] Variáveis de ambiente configuradas (DATABASE_URL, JWT_SECRET, VAPID_*)
- [x] VITE_API_URL corrigida no projeto frontend
- [x] Banco populado com dados de demo (003_demo_data.js)

### Pendentes para Demo (próxima sessão)
- [ ] Auto-refresh dashboard gestor (polling 30s + badge de novos cadastros)
- [ ] Seção "Encaminhamentos" simulada no DashboardGestor.jsx
- [ ] Rotacionar SUPABASE_SECRET_KEY no Supabase dashboard
- [ ] Testar fluxo completo pré-cadastro → aprovação (usar UBS Alto da Ponte)
- [ ] Painel do paciente: linguagem simples, logout visível, erro amigável

---

## O que está pendente (pós-25/06)

- RBAC completo (C-04) — perfis recepcionista/gestor/admin com permissões distintas
- Suite de testes automatizados E2E
- Atualização de dependências vulneráveis (C-06)
- Filtros avançados na lista de pacientes (RF-G02)
- Lido/não lido em comunicados (RF-P04)
- Dashboard analítico completo (RF-G09)
- Notificações WhatsApp Business API (Fase 2 original)
- Domínio Hostgator (pós-validação)

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

**Credencial paciente:** cadastrar via Portal do Gestor, usar CRA + data_nascimento.

---

## Banco de Dados

- **Plataforma:** Supabase (PostgreSQL) — projeto `crdtguvjuyfszxbpnwms`, região us-east-1
- **Pooler:** PgBouncer porta 6543 (transaction mode) — usar este em produção
- **SSL:** obrigatório — `knexfile.js` configurado com `ssl: { rejectUnauthorized: false }`
- **Variável:** `DATABASE_URL` em `app/backend/.env` (não commitado) e nas env vars da Vercel
- **Migrations:** 12 arquivos JS em `app/backend/src/db/migrations/` via Knex — todas aplicadas
- **Seeds:** `001_ubs_sjc.js` (47 UBSs + gestores), `002_bairros_ubs.js`, `003_demo_data.js` (dados de demo)
- **⚠️ SEGURANÇA:** `SUPABASE_SECRET_KEY` foi exposta em sessão de 17/06 — ROTACIONAR no dashboard do Supabase

---

## Arquitetura de Layout (não alterar sem autorização)

### Portal do Gestor
- Todas as páginas usam `<GestorLayout>` — gerencia estado `sidebarAberta` (drawer animado mobile)
- `GestorLayout` aplica padding: `p-4 md:p-6 lg:p-10`

### Portal do Paciente
- Todas as páginas usam `<PacienteLayout>` — `max-w-md`, `position: relative`
- `BottomNavPaciente` usa `absolute` (não `fixed`) ancorado ao container do PacienteLayout

---

## Relatório Mais Recente

`.Agent/reports/2026-06-17_deploy-vercel-seed-demo.md`

---

## Próximas Ações Imediatas

1. **Reinaldo** — rotacionar SUPABASE_SECRET_KEY no dashboard do Supabase (exposta em sessão 17/06)
2. **Reinaldo** — testar fluxo completo: auto-cadastro no portal do paciente (usar bairro do Alto da Ponte) → aprovar no painel do gestor
3. **Antigravity** — implementar auto-refresh no DashboardGestor.jsx (polling 30s + badge de novos cadastros)
4. **Antigravity** — adicionar card "Encaminhamentos" simulado no DashboardGestor.jsx
5. **Arquiteto** — briefing do painel do paciente para otimização mobile (próxima sessão)
