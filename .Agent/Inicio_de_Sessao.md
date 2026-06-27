# Início de Sessão — Gestão Saúde UBS+
> Este arquivo é atualizado pelo Arquiteto (Claude) ao final de cada fase ou sessão relevante.
> Todo agente deve ler este arquivo ANTES de qualquer execução.
> **Última atualização:** 2026-06-27 — Claude Sonnet 4.6 (Arquiteto)

---

## Contexto da Fase Atual

**Fase:** 4 — Produção Real em SJC
**Status geral:** 86/86 testes passando ✅ | Projeto aprovado na banca em 25/06/2026
**Objetivo da semana:** Estabilização — zerar dívida técnica antes de qualquer feature nova
**Prazo total da Fase 4:** 26/07/2026

Leia o relatório completo da sessão anterior:
`.Agent/reports/TASK_32_33_Perfil_Medico_Validacao.md`

Leia o Roadmap atualizado para entender o escopo completo da Fase 4:
`docs/05_Roadmap.md` — Seção 8 (Fase 4)

---

## Estado do Repositório ao Iniciar

- **index.lock:** ⚠️ EXISTE — impede commits. Reinaldo deve remover manualmente antes de qualquer git command:
  ```powershell
  Remove-Item "C:\Users\reina\OneDrive\Desktop\Projetos\Gestão Saúde UBS+\.git\index.lock" -Force
  ```
- **Working tree:** ~50 arquivos modificados sem commit (mudanças da banca)
- **Branch:** `main`
- **Migration 027:** aplicada em dev, **NÃO aplicada em produção**

---

## Tarefas da Semana 1 — Estabilização

Execute as tarefas na ordem abaixo. Tasks 4.3 a 4.7 podem ser executadas em paralelo após 4.1 e 4.2.

---

### TASK 4.1 — Commit e Push de Todo o Working Tree

```
📋 TAREFA: Commit de todos os arquivos pendentes pós-banca
🤖 AGENTE: Fast Mode
📁 ARQUIVOS ALVO: working tree completo (git add -u + novos arquivos)
💡 MOTIVO DA ESCOLHA: Script de terminal pontual, sem lógica de negócio
```

**PRÉ-REQUISITO (ação manual do Reinaldo):**
```powershell
Remove-Item "C:\Users\reina\OneDrive\Desktop\Projetos\Gestão Saúde UBS+\.git\index.lock" -Force
```

**Diretiva:**
```bash
cd "C:\Users\reina\OneDrive\Desktop\Projetos\Gestão Saúde UBS+"

# Adicionar todos os modificados rastreados
git add -u

# Adicionar novos arquivos que não estão rastreados ainda
git add app/backend/src/middleware/authorization.js
git add app/backend/src/db/migrations/027_add_segmentacao_clinica_comunicados.js
git add app/backend/src/db/seeds/008_slots_banca.js
git add app/backend/test_contrato_rbac.js
git add app/frontend/src/pages/gestor/RelatoriosGestor.jsx
git add app/frontend/src/pages/gestor/PainelMedico.jsx
git add tests/task33-relatorios.test.mjs

# Confirmar o que vai no commit
git status

# Commitar
git commit -m "feat: FASE4 — commit pós-banca (TASK_32/33, perfil médico RBAC, relatórios, portal externo)"

# Push
git push origin main
```

**Verificação:**
- `git log --oneline -1` deve mostrar o commit novo
- `git status` deve retornar working tree limpo
- Push deve completar sem erro

---

### TASK 4.2 — Aplicar Migration 027 em Produção

```
📋 TAREFA: Executar migration 027 no banco de produção (Supabase)
🤖 AGENTE: Fast Mode
📁 ARQUIVOS ALVO: app/backend/src/db/migrations/027_add_segmentacao_clinica_comunicados.js
💡 MOTIVO DA ESCOLHA: Comando de terminal único, sem código novo
```

**Diretiva:**
```bash
cd "C:\Users\reina\OneDrive\Desktop\Projetos\Gestão Saúde UBS+\app\backend"
NODE_ENV=production npx knex migrate:latest
```

**Verificação:**
```bash
NODE_ENV=production npx knex migrate:list
```
A migration `027_add_segmentacao_clinica_comunicados` deve aparecer em "Ran migrations".

**Restrições:**
- NÃO execute `migrate:rollback` em produção sem aprovação do Arquiteto
- NÃO altere o arquivo de migration — ele já está correto em dev

---

### TASK 4.3 — Configurar Sentry (Frontend + Backend)

```
📋 TAREFA: Integrar Sentry para captura de erros em tempo real
🤖 AGENTE: Deep Think
📁 ARQUIVOS ALVO:
  - app/frontend/src/main.jsx (ou index.jsx — ponto de entrada React)
  - app/backend/src/index.js (ou server.js — ponto de entrada Express)
  - app/frontend/.env / app/backend/.env (variáveis SENTRY_DSN)
  - app/frontend/vite.config.js (se houver plugin Sentry)
💡 MOTIVO DA ESCOLHA: Integração multi-arquivo, frontend + backend, configuração condicional por ambiente
```

**Contexto:**
- Frontend: React + Vite
- Backend: Node.js + Express
- Reinaldo deve criar conta gratuita em https://sentry.io e criar dois projetos:
  - `ubsmais-frontend` (plataforma: JavaScript/React)
  - `ubsmais-backend` (plataforma: Node.js)
- Cada projeto gera um DSN — fornecer ao agente como variáveis de ambiente

**Diretiva:**

**Backend:**
```bash
cd app/backend
npm install @sentry/node @sentry/profiling-node
```

Em `app/backend/src/index.js`, antes de qualquer outra importação:
```js
// ─────────────────────────────────────────────────────────────────────────────
// SENTRY — Monitoramento de erros em produção
// Inicializado antes de qualquer outro módulo para capturar todos os erros.
// DSN vem da variável de ambiente SENTRY_DSN (nunca hardcoded).
// Em desenvolvimento, Sentry é desabilitado (NODE_ENV !== 'production').
// ─────────────────────────────────────────────────────────────────────────────
const Sentry = require("@sentry/node");
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN_BACKEND,
    tracesSampleRate: 0.2, // 20% das transações para Performance
  });
}
```

Adicionar handler de erro do Sentry APÓS todas as rotas Express, ANTES do handler de erro customizado:
```js
// Captura exceções não tratadas pelas rotas — deve vir antes do errorHandler customizado
if (process.env.NODE_ENV === "production") {
  app.use(Sentry.Handlers.errorHandler());
}
```

**Frontend:**
```bash
cd app/frontend
npm install @sentry/react
```

Em `app/frontend/src/main.jsx`:
```jsx
// ─────────────────────────────────────────────────────────────────────────────
// SENTRY — Monitoramento de erros React em produção
// Ativo apenas em produção. Captura erros de componentes e erros JS não tratados.
// ─────────────────────────────────────────────────────────────────────────────
import * as Sentry from "@sentry/react";
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}
```

**Variáveis de ambiente a adicionar:**
- `app/backend/.env`: `SENTRY_DSN_BACKEND=<dsn-do-projeto-backend>`
- `app/frontend/.env`: `VITE_SENTRY_DSN=<dsn-do-projeto-frontend>`
- Adicionar as mesmas variáveis no painel da Railway (backend) e Vercel (frontend)

**Restrições:**
- Sentry deve ser COMPLETAMENTE desabilitado em `NODE_ENV=development` — não queremos ruído de dev nos alertas
- Não alterar nenhuma rota de negócio existente
- Comentários obrigatórios conforme CLAUDE.md

**Verificação:**
- Testar em produção: provocar um erro 500 intencional → deve aparecer no painel Sentry em < 30s
- Build do frontend deve passar sem erro

---

### TASK 4.4 — Configurar UptimeRobot

```
📋 TAREFA: Configurar monitoramento de disponibilidade externo
🤖 AGENTE: N/A — Configuração manual (sem código)
💡 MOTIVO: Serviço externo SaaS — não há código a escrever
```

**Ação manual do Reinaldo:**

1. Criar conta gratuita em https://uptimerobot.com
2. Adicionar 3 monitores (plano free suporta 50):
   - **Monitor 1:** `UBS+ Frontend` → URL do deploy Vercel → tipo HTTP → check a cada 5 min
   - **Monitor 2:** `UBS+ Backend API` → `<url-railway>/health` → tipo HTTP → check a cada 5 min
   - **Monitor 3:** `UBS+ Backend Auth` → `<url-railway>/auth/status` (ou rota pública qualquer) → tipo HTTP
3. Configurar alerta por e-mail para `reinaldogramachof@gmail.com`
4. Opcional: integrar com WhatsApp ou Telegram para alertas instantâneos

**Dependência de código (Fast Mode):**
Se ainda não existir rota `/health` no backend:

```
📋 TAREFA: Criar rota /health no backend
🤖 AGENTE: Fast Mode
📁 ARQUIVOS ALVO: app/backend/src/index.js (ou routes/index.js)
```

```js
// ─────────────────────────────────────────────────────────────────────────────
// ROTA: GET /health
// FUNÇÃO: Endpoint público para monitoramento externo (UptimeRobot, etc.)
// Retorna 200 se o servidor está respondendo.
// Não expõe dados internos — apenas confirma que o processo está vivo.
// ─────────────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

---

### TASK 4.5 — Rate Limiting nas Rotas de Autenticação

```
📋 TAREFA: Adicionar rate limiting em /auth/login e /auth/paciente
🤖 AGENTE: Fast Mode
📁 ARQUIVOS ALVO:
  - app/backend/src/index.js (configuração global do limiter)
  - app/backend/src/routes/auth.js (aplicar limiter nas rotas)
💡 MOTIVO: Segurança localizada em arquivo conhecido, padrão express-rate-limit
```

**Contexto:**
Com dados reais de saúde, um ataque de força bruta no CRA pode expor dados sensíveis de pacientes. Pacientes têm apenas CRA + data de nascimento como autenticação — baixa entropia, fácil de enumerar.

**Diretiva:**
```bash
cd app/backend
npm install express-rate-limit
```

Em `app/backend/src/routes/auth.js` (ou onde estão as rotas de login):

```js
// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITING — Proteção contra força bruta em autenticação
// Limita cada IP a 10 tentativas de login por janela de 15 minutos.
// Após o limite, retorna 429 com mensagem em PT-BR.
// Aplicado especificamente nas rotas de login — não afeta outras rotas.
// ─────────────────────────────────────────────────────────────────────────────
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                   // 10 tentativas por IP por janela
  standardHeaders: true,     // inclui headers RateLimit-* na resposta
  legacyHeaders: false,
  message: {
    erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  }
});

// Aplicar antes das rotas de login
router.post('/login', loginLimiter, loginGestorController);
router.post('/paciente', loginLimiter, loginPacienteController);
```

**Restrições:**
- NÃO aplicar rate limit global — apenas nas rotas de auth
- NÃO alterar a lógica de login existente
- Testar que 401 (credencial errada) continua funcionando normalmente nas primeiras 10 tentativas
- Comentários obrigatórios conforme CLAUDE.md

**Verificação:**
```bash
# Testar 11 requests seguidos na rota de login
for i in $(seq 1 11); do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"email":"x","senha":"y"}'; done
# As primeiras 10 devem retornar 401, a 11ª deve retornar 429
```

---

### TASK 4.6 — Remover Seeds Acadêmicos e Inserir UBSs Reais de SJC

```
📋 TAREFA: Substituir dados de seed acadêmicos pelos dados reais das UBSs de SJC
🤖 AGENTE: Fast Mode
📁 ARQUIVOS ALVO:
  - app/backend/src/db/seeds/ (identificar seeds com dados fictícios)
  - Novo arquivo: app/backend/src/db/seeds/009_ubs_reais_sjc.js
💡 MOTIVO: Criação de seed baseada em padrão existente, dados já definidos abaixo
```

**Contexto:**
O sistema está populado com UBSs e gestores fictícios da banca. Em produção real, esses dados devem refletir as UBSs reais de São José dos Campos.

**Ação prévia do Reinaldo:**
Confirmar com a Secretaria de Saúde de SJC quais UBSs farão parte do piloto e fornecer:
- Nome oficial da UBS
- Endereço
- Bairro
- E-mail do gestor responsável

**Diretiva para o agente:**
1. Ler todos os arquivos em `app/backend/src/db/seeds/` e identificar quais contêm dados fictícios de UBSs (nomes como "Vila Maria Teste", "UBS Fictícia", etc.)
2. Criar `009_ubs_reais_sjc.js` com as UBSs reais fornecidas pelo Reinaldo — seguindo exatamente o padrão dos seeds anteriores
3. **NÃO deletar** seeds de estrutura de tabelas — apenas seeds de dados fictícios
4. Adicionar comentário no topo de cada seed antigo marcando como `// SEED ACADÊMICO — desativado em produção`

**Restrições:**
- NÃO executar `knex seed:run` em produção sem aprovação do Arquiteto e do Reinaldo
- NÃO alterar a estrutura das tabelas
- Os seeds de produção NUNCA devem ter senhas em texto claro — usar bcrypt hash

---

### TASK 4.7 — Auditoria de Variáveis de Ambiente

```
📋 TAREFA: Auditar .env e garantir que nenhum segredo está no repositório
🤖 AGENTE: Fast Mode
📁 ARQUIVOS ALVO:
  - .gitignore (raiz)
  - app/backend/.env e app/frontend/.env (NÃO commitar — apenas auditar)
  - app/backend/.env.example e app/frontend/.env.example (criar se não existir)
💡 MOTIVO: Verificação de arquivos existentes + criação de .env.example
```

**Diretiva:**

1. Verificar que `.gitignore` contém:
   ```
   .env
   .env.local
   .env.production
   .env*.local
   ```

2. Rodar verificação de segurança:
   ```bash
   # Buscar arquivos .env que possam ter sido commitados acidentalmente
   git log --all --full-history -- "**/.env"
   git log --all --full-history -- ".env"
   ```
   Se retornar commits, escalar imediatamente ao Arquiteto — há segredos no histórico git.

3. Criar `app/backend/.env.example` e `app/frontend/.env.example` com todas as variáveis necessárias **sem valores reais**:

`app/backend/.env.example`:
```
# Banco de dados
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
JWT_SECRET=sua_chave_secreta_aqui

# Ambiente
NODE_ENV=development

# VAPID (Web Push)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:contato@ubsmais.com.br

# Sentry (produção)
SENTRY_DSN_BACKEND=

# PORT
PORT=3001
```

`app/frontend/.env.example`:
```
# URL do backend
VITE_API_URL=http://localhost:3001

# Sentry (produção)
VITE_SENTRY_DSN=

# VAPID Public Key
VITE_VAPID_PUBLIC_KEY=
```

4. Confirmar que `.env.example` está commitado (sem valores reais) e `.env` está ignorado.

**Restrições:**
- NÃO commitar nenhum arquivo `.env` com valores reais
- Se encontrar segredo no histórico git, NÃO tentar resolver sozinho — escalar ao Arquiteto

---

## Regras Invioláveis desta Sessão

- `ubs_id` e `gestor_id` vêm sempre do JWT — nunca do body
- Nenhuma rota expõe pacientes sem autenticação (LGPD)
- Todos os arquivos modificados precisam de comentários explicativos (ver CLAUDE.md)
- Build deve passar após cada task — se quebrar, corrigir antes de reportar
- Gerar relatório de sessão em `.Agent/reports/TASK_Semana1_Estabilizacao.md` ao concluir

---

## Aviso — Sync do Linux Mount

O sandbox Linux pode mostrar versões stale de arquivos modificados via Windows.
Para validar o estado real de um arquivo:

```bash
node -e "const s=require('fs').readFileSync('arquivo','utf8'); console.log('lines:',s.split('\n').length,'last:',JSON.stringify(s.split('\n').slice(-2)))"
```

Nunca confie no output do Read tool como prova do estado real do disco.
