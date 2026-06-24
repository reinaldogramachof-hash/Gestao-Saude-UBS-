# Documento 02 — Arquitetura Técnica
## Gestão Saúde UBS+ | Projeto de Extensão Multidisciplinar
### Faculdade UFBRA — Engenharia de Software

**Versão:** 2.0
**Data:** 2026-06-24
**Status:** ✅ Implementada e em produção

---

## 1. Visão Geral da Arquitetura

O sistema adota uma arquitetura **cliente-servidor em três camadas** (Three-Tier Architecture), com frontend e backend hospedados na Vercel como funções serverless e banco de dados no Supabase (PostgreSQL gerenciado).

```
┌──────────────────────────────────────────────────────────────┐
│  CAMADA DE APRESENTAÇÃO (Frontend)                           │
│  React 18 + Tailwind CSS — Hospedagem: Vercel (CDN global)  │
│  Portal Gestor │ Portal Paciente │ Portal Externo            │
├──────────────────────────────────────────────────────────────┤
│  CAMADA DE NEGÓCIO (Backend / API REST)                      │
│  Node.js + Express — Hospedagem: Vercel Serverless           │
│  JWT Auth │ RBAC │ Joi Validation │ Audit Log │ Web Push     │
├──────────────────────────────────────────────────────────────┤
│  CAMADA DE DADOS (Banco de Dados)                            │
│  PostgreSQL — Hospedagem: Supabase (crdtguvjuyfszxbpnwms)  │
│  27 tabelas │ Knex.js migrations │ Queries parametrizadas    │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Tecnologias Utilizadas

### 2.1 Frontend — React + Tailwind CSS

| Atributo | Detalhe |
|---|---|
| **Framework** | React 18 |
| **Estilização** | Tailwind CSS (Material Design 3 tokens via CSS variables) |
| **Gerenciamento de Estado** | Context API (AuthContext por portal) |
| **Roteamento** | React Router v6 |
| **Requisições HTTP** | Axios com interceptor de token JWT |
| **Notificações UI** | React Hot Toast |
| **Ícones** | Material Symbols (Google) via CDN |
| **Impressão** | `window.print()` + `@media print` (Painel Médico) |
| **Real-time** | Polling via `setInterval` (20s) em DetalheSolicitacao |

**Portais e isolamento de token:**

| Portal | localStorage key | Rota base |
|---|---|---|
| Gestor | `@UBS_Token_Gestor` | `/gestor/*` |
| Paciente | `@UBS_Token_Paciente` | `/paciente/*` |
| Externo | `@UBS_Token_Externa` | `/externa/*` |

### 2.2 Backend — Node.js + Express

| Atributo | Detalhe |
|---|---|
| **Runtime** | Node.js 20 LTS |
| **Framework** | Express.js |
| **ORM / Query Builder** | Knex.js 3.x |
| **Autenticação** | JWT (jsonwebtoken) + bcrypt (salt: 12) |
| **Validação de Dados** | Joi (schemas em `src/validators/securitySchemas.js`) |
| **Autorização (RBAC)** | `middleware/authorization.js` — `requireTipo`, `requirePerfil`, `soNaoMedico` |
| **Notificações Push** | web-push (VAPID) via `services/pushService.js` |
| **Log de Auditoria** | `services/auditService.js` — registra em `audit_logs` |
| **Variáveis de Ambiente** | dotenv |
| **Rate Limiting** | express-rate-limit |
| **Segurança HTTP** | Helmet.js |

### 2.3 Banco de Dados — PostgreSQL no Supabase

| Atributo | Detalhe |
|---|---|
| **SGBD** | PostgreSQL 15+ |
| **Hospedagem** | Supabase (projeto: crdtguvjuyfszxbpnwms) |
| **Migrações** | Knex migrations — 27 aplicadas em produção |
| **Seeds** | 8 arquivos de seed para dados de demonstração |

### 2.4 Hospedagem (Ambiente Acadêmico)

| Serviço | Uso | Custo |
|---|---|---|
| **Vercel** | Frontend React + Backend serverless | Gratuito (plano Hobby) |
| **Supabase** | Banco de dados PostgreSQL | Gratuito (plano Free) |
| **GitHub** | Versionamento de código | Gratuito |

---

## 3. Diagrama de Componentes

```
USUÁRIO (Smartphone / Computador)
        │
        │ HTTPS
        ▼
┌───────────────────────────────────────────────────┐
│               FRONTEND (Vercel CDN)               │
│                                                   │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐ │
│  │   Portal   │  │   Portal   │  │   Portal    │ │
│  │  do Gestor │  │ do Paciente│  │  Externo    │ │
│  │ 14 páginas │  │  9 páginas │  │  3 páginas  │ │
│  └─────┬──────┘  └─────┬──────┘  └──────┬──────┘ │
│        └───────────────┼────────────────┘         │
└────────────────────────┼─────────────────────────-┘
                         │ REST API (JSON/HTTPS)
                         ▼
┌───────────────────────────────────────────────────┐
│         BACKEND API (Vercel Serverless)            │
│                                                   │
│  /api/auth/*     — Login dos 3 portais            │
│  /api/gestor/*   — 38 rotas (pacientes, sol.,     │
│                    meds, comunicados, agenda,      │
│                    regulação, vigilância,          │
│                    serv.social, transporte,        │
│                    relatorios, encaminhamentos)    │
│  /api/paciente/* — Dashboard, sol., meds,         │
│                    comunicados, agendamentos,      │
│                    push, confirmar presença        │
│  /api/externa/*  — Encaminhamentos + push         │
│                                                   │
│  Middlewares:                                     │
│   • autenticarToken (JWT)                         │
│   • requireTipo (gestor/paciente/externa)         │
│   • requirePerfil (recepcionista/gestor/admin)    │
│   • soNaoMedico (bloqueia escrita para médico)    │
│   • validarCorpo (Joi schemas)                    │
│   • registrarAuditoria (audit_logs)               │
└───────────────────────┬───────────────────────────┘
                        │ SQL (Knex.js)
                        ▼
┌───────────────────────────────────────────────────┐
│         POSTGRESQL — Supabase                     │
│                                                   │
│  ubs │ usuarios_gestores │ pacientes              │
│  solicitacoes │ historico_status                  │
│  medicamentos │ comunicados │ comunicados_leitura │
│  agendamentos_gestao │ atendimentos               │
│  encaminhamentos │ unidades_externas              │
│  notificacoes_vigilancia │ servico_social_casos   │
│  transporte_solicitacoes │ regulacao_solicitacoes │
│  push_subscriptions │ audit_logs                  │
│  catalogo_procedimentos │ bairros_ubs             │
└───────────────────────────────────────────────────┘
```

---

## 4. Fluxo de Autenticação

### Paciente
```
1. Paciente insere CRA + Data de Nascimento
2. Backend valida CRA no banco de dados
3. Backend verifica se a data de nascimento corresponde ao registro
4. Se válido: gera token JWT com { id, tipo: 'paciente', ubs_id } — expira em 8h
5. Frontend armazena token em localStorage com chave @UBS_Token_Paciente
6. Todas as requisições subsequentes incluem token no header Authorization: Bearer <token>
7. Backend valida token e isola dados pelo id do paciente no JWT
```

### Gestor da UBS
```
1. Gestor insere e-mail + senha
2. Backend busca gestor pelo e-mail
3. Backend compara senha com hash bcrypt (salt rounds: 12)
4. Se válido: gera token JWT com { id, tipo: 'gestor', ubs_id, perfil } — expira em 12h
   perfil ∈ { 'recepcionista', 'gestor', 'admin', 'medico' }
5. Frontend armazena token em @UBS_Token_Gestor
6. Middleware soNaoMedico bloqueia POST/PUT de regulação e vigilância para perfil 'medico'
```

### Unidade Externa
```
1. Operador insere credenciais institucionais (email + senha)
2. Backend autentica via tabela unidades_externas
3. Token JWT gerado com { id, tipo: 'externa', unidade_nome } — expira em 8h
4. Acesso restrito apenas às rotas /api/externa/*
```

**Conformidade LGPD:** `ubs_id` e `id` do usuário vêm sempre do JWT — nunca do body da requisição. Nenhuma rota retorna dados de pacientes sem autenticação válida.

---

## 5. RBAC — Controle de Acesso por Perfil

| Perfil | Leitura Geral | Escrita Geral | Regulação (escrita) | Vigilância (escrita) | Painel Médico |
|---|---|---|---|---|---|
| recepcionista | ✅ | ✅ (parcial) | ❌ | ❌ | ❌ |
| gestor | ✅ | ✅ | ✅ | ✅ | ❌ |
| admin | ✅ | ✅ | ✅ | ✅ | ❌ |
| medico | ✅ (read-only) | ❌ | ❌ | ❌ | ✅ |

O middleware `soNaoMedico` retorna HTTP 403 se `req.user.perfil === 'medico'` em rotas de escrita críticas.

---

## 6. Serviços Complementares

### 6.1 Web Push (Notificações ao Paciente)
- Implementado via `web-push` com chaves VAPID
- `pushService.enviar(paciente_id, tipo, { titulo, corpo, url })` busca a subscription do paciente e envia push
- Acionado em: agendamento confirmado pela unidade externa, procedimento concluído, confirmação de presença

### 6.2 Auditoria
- `registrarAuditoria(req, { acao, entidade, entidade_id, escopo_ubs_id, metadata })` — registra em `audit_logs`
- Toda ação crítica (criação, atualização de status, login, encaminhamento, relatório gerado) é logada
- Logs isolados por `ubs_id` — gestor de uma UBS nunca vê logs de outra

### 6.3 Segmentação Clínica de Comunicados
- Campo `segmentacao_clinica` (VARCHAR 100) na tabela `comunicados` — migration 027
- Na leitura pelo paciente: filtro ILIKE em `pacientes.comorbidades` para entregar comunicados relevantes
- Exemplo: comunicado com `segmentacao_clinica = 'Diabetes'` chega apenas a pacientes com "Diabetes" no campo comorbidades

---

## 7. Padrão de API REST

Todas as rotas seguem REST com convenções consistentes:

| Método | Uso | Exemplo real |
|---|---|---|
| GET | Buscar dados | `GET /api/gestor/pacientes` |
| POST | Criar registro | `POST /api/gestor/paciente/:id/solicitacao` |
| PUT | Atualizar | `PUT /api/gestor/solicitacao/:id/status` |
| DELETE | Remover (onde aplicável) | `DELETE /api/gestor/medicamento/:id` |

**Formato de resposta padrão:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Formato de erro padrão:**
```json
{
  "error": "MENSAGEM_DO_ERRO"
}
```

---

## 8. Segurança

| Aspecto | Implementação |
|---|---|
| **Senhas** | Hash com bcrypt (salt rounds: 12) |
| **Tokens** | JWT — expiração 8h (paciente/externa) e 12h (gestor) |
| **HTTPS** | Obrigatório — gerenciado pela Vercel |
| **Validação de entrada** | Joi valida todos os campos recebidos pela API |
| **SQL Injection** | Prevenido pelo uso de Knex.js com queries parametrizadas |
| **CORS** | Configurado para aceitar apenas o domínio do frontend |
| **Headers de segurança** | Helmet.js (X-Frame-Options, CSP, HSTS, etc.) |
| **Rate Limiting** | express-rate-limit em rotas de autenticação |
| **RBAC** | Middleware soNaoMedico + requireTipo + requirePerfil |
| **Auditoria** | Log de ações em audit_logs (imutável por usuário final) |
| **Dados sensíveis** | Nunca retornados em rotas sem autenticação; CPF nunca exposto em relatórios |

---

## 9. Decisões Arquiteturais e Justificativas

| Decisão | Alternativa Considerada | Motivo da Escolha |
|---|---|---|
| React (não Next.js) | Next.js, Vue.js | Curva de aprendizado menor para equipe; SSR desnecessário no MVP |
| Express (não NestJS) | NestJS, Fastify | Simplicidade; código mais legível para membros júniores |
| Knex.js (não Prisma) | Prisma ORM, Sequelize | Knex gera SQL mais transparente, facilitando aprendizado do banco |
| JWT (não Sessions) | Express-session | Stateless; mais simples em arquitetura de API separada do frontend |
| PostgreSQL (não MongoDB) | MongoDB, MySQL | Dados de saúde são relacionais; PostgreSQL é padrão governamental |
| Supabase (não Railway) | Railway, Render | Plano gratuito mais generoso para PostgreSQL; sem risco de cold start no banco |
| Polling (não WebSocket) | Socket.io | Menor complexidade de infra; 20s é suficiente para o caso de uso |
| Sem integração e-SUS no MVP | Integração via LEDI APS | Escopo acadêmico; integração exige credenciais governamentais |

---

*Documento atualizado em 2026-06-24 para refletir o sistema em produção.*
