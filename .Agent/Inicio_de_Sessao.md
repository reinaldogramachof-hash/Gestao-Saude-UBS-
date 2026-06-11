# Início de Sessão — Gestão Saúde UBS+
> Este arquivo é atualizado pelo Arquiteto (Claude) ao final de cada fase ou sessão relevante.
> Todo agente deve ler este arquivo ANTES de qualquer execução.

---

## Status Atual do Projeto

**Fase:** 2 — MVP completo (todos os módulos implementados + responsividade aplicada)
**Data da última atualização:** 2026-04-20
**Próxima etapa:** Testes end-to-end completos de ambos os portais

---

## O que foi feito até agora

- [x] Análise completa do ecossistema de saúde de SJC
- [x] Definição de escopo, stack e entidades core
- [x] Criação do `CLAUDE.md`, documentação acadêmica em `docs/` (5 documentos)
- [x] Repositório GitHub inicializado e sincronizado
- [x] `app/frontend/` — React + Vite + Tailwind, AuthContext, roteamento, axios
- [x] `app/backend/` — Node.js + Express + Knex, server.js, auth middleware, rotas
- [x] `app/backend/src/db/migrations/` — 8 migrations PostgreSQL (001–008) com comentários
- [x] `app/backend/src/db/seeds/` — seed de desenvolvimento com 3 UBSs e gestores de teste
- [x] Banco PostgreSQL no **Neon** (migrado do Railway — Railway gratuito expirou)
- [x] `app/backend/src/routes/auth.js` — POST /login-gestor e /login-paciente com JWT
- [x] `app/backend/src/routes/gestor.js` — CRUD completo de pacientes + solicitações + dashboard/stats + comunicados + agendamentos
- [x] `app/backend/src/routes/paciente.js` — meus-dados, solicitações, medicamentos, comunicados, agendamentos (reservar/meus/disponíveis)
- [x] `app/frontend/src/pages/` — 12 páginas JSX completas (6 paciente + 6 gestor)
- [x] **Épico 1:** DashboardGestor com métricas reais (Promise.all, 4 cards, tabela atividade recente)
- [x] **Épico 2:** PerfilPaciente com modal de nova solicitação + modal de atualizar status (sem prompt())
- [x] **Épico 3:** ComunicadosGestor (CRUD) + ComunicadosPaciente (leitura) — backend + frontend
- [x] **Épico 4:** AgendamentosGestor (criação/gestão de slots) + AgendamentosPaciente (reserva) — backend + frontend
- [x] `<Toaster />` adicionado ao `App.jsx` — toasts funcionais em todas as páginas
- [x] **Responsividade completa:**
  - `GestorLayout.jsx` — sidebar drawer no mobile, fixo no desktop (lg+)
  - `SideNavGestor.jsx` — prop `onFechar` + botão × + logout no rodapé
  - `TopBarGestor.jsx` — hamburger mobile + padding responsivo
  - `PacienteLayout.jsx` — container max-w-md centralizado no desktop
  - `BottomNavPaciente.jsx` — `absolute` ao container do PacienteLayout
  - Todas as 6 páginas do gestor → `GestorLayout`
  - Todas as 5 páginas do paciente → `PacienteLayout`
  - Tabelas com `overflow-x-auto` + `min-w-[640px]` para scroll horizontal no mobile
  - Grid de métricas: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

---

## O que está pendente

- [ ] Testes end-to-end completos dos dois portais
  - [ ] Login gestor → dashboard → cadastrar paciente → abrir perfil → criar solicitação → atualizar status
  - [ ] Login paciente → dashboard → ver solicitações → medicamentos → comunicados → agendamentos
  - [ ] Gestor cria comunicado → paciente visualiza
  - [ ] Gestor cria slot → paciente reserva → gestor conclui
- [ ] Deploy no Vercel (frontend) + Railway/Render (backend) — Fase 3
- [ ] Documentação acadêmica (docs/) atualizada para Fase 2 concluída

---

## Contexto Essencial para o Agente

**Projeto:** Aplicação web acadêmica (UFBRA) para UBSs de São José dos Campos (SP).

**Dois portais:**
- **Gestor da UBS:** cadastra e atualiza status de pacientes, exames, consultas, medicamentos, comunicados e gerencia slots de agendamento
- **Paciente:** visualiza suas informações, status de solicitações, disponibilidade de medicamentos, comunicados e reserva atendimento com a gestão

**NÃO faz:** Integração com e-SUS, SISREG, CROSS ou qualquer sistema do SUS. O gestor alimenta manualmente.

**Autenticação:** Paciente usa CRA + Data de Nascimento. Gestor usa e-mail + senha.

**Regra crítica:** TODO arquivo de código deve ter comentários explicativos (equipe tem membros júniores).

**Desenvolvedor líder:** Reinaldo — toda decisão arquitetural passa por ele.

**Leia também:** `CLAUDE.md` na raiz do projeto para regras completas.

---

## Arquitetura de Layout (IMPORTANTE)

### Portal do Gestor
- Todas as páginas usam `<GestorLayout>` em vez de importar `SideNavGestor` + `TopBarGestor` diretamente
- `GestorLayout` gerencia o estado `sidebarAberta` — drawer animado no mobile
- Padding do `<main>` é gerenciado pelo GestorLayout: `p-4 md:p-6 lg:p-10`

### Portal do Paciente
- Todas as páginas usam `<PacienteLayout>` em vez de importar `BottomNavPaciente` diretamente
- `PacienteLayout` tem `position: relative` e `max-w-md` — necessário para o `BottomNavPaciente` (absolute) funcionar corretamente
- `BottomNavPaciente` usa `absolute` (não `fixed`) para ancorar ao container do PacienteLayout

---

## Como rodar o projeto localmente

```bash
# Terminal 1 — Backend
cd app/backend
npm run dev
# Servidor sobe em http://localhost:3001

# Terminal 2 — Frontend
cd app/frontend
npm run dev
# Aplicação abre em http://localhost:5173
```

**Credenciais de teste (gestor):**
- centro@gestaoubs.dev / senha123
- industrial@gestaoubs.dev / senha123
- satelite@gestaoubs.dev / senha123

**Credenciais de teste (paciente):** cadastrar via Portal do Gestor e usar o CRA + data_nascimento registrados.

---

## Banco de Dados

- **Plataforma:** Neon (PostgreSQL serverless)
- **SSL:** obrigatório — `knexfile.js` configurado com `ssl: { rejectUnauthorized: false }`
- `DATABASE_URL` no arquivo `app/backend/.env` (não commitado — ver `.env.example`)

---

## Último Relatório de Sessão

`.Agent/reports/Relatorio_Fase2_Modulos_Funcionais.md` — Fase 2 executada (Épicos 1–4 + Responsividade).

---

## Próximas Ações (próxima sessão)

1. Subir ambos os servidores (`npm run dev` em backend e frontend)
2. Executar roteiro de testes end-to-end nos dois portais
3. Identificar e corrigir qualquer bug encontrado durante os testes
4. Após testes aprovados: iniciar planejamento do deploy (Fase 3)
