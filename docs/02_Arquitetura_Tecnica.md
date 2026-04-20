# Documento 02 — Arquitetura Técnica
## Gestão Saúde UBS+ | Projeto de Extensão Multidisciplinar
### Faculdade UFBRA — Engenharia de Software

**Versão:** 1.0
**Data:** 2026-04-20
**Status:** Definida — aguardando implementação

---

## 1. Visão Geral da Arquitetura

O sistema adota uma arquitetura **cliente-servidor em três camadas** (Three-Tier Architecture), separando responsabilidades entre interface de usuário, lógica de negócio e persistência de dados.

```
┌────────────────────────────────────────────────────────────┐
│  CAMADA DE APRESENTAÇÃO (Frontend)                         │
│  React + Tailwind CSS — Hospedagem: Vercel                 │
│  Portal do Gestor  │  Portal do Paciente                   │
├────────────────────────────────────────────────────────────┤
│  CAMADA DE NEGÓCIO (Backend / API REST)                    │
│  Node.js + Express — Hospedagem: Railway                   │
│  Autenticação JWT │ Rotas da API │ Regras de Negócio       │
├────────────────────────────────────────────────────────────┤
│  CAMADA DE DADOS (Banco de Dados)                          │
│  PostgreSQL — Hospedagem: Railway                          │
│  Pacientes │ Solicitações │ Medicamentos │ Comunicados     │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Tecnologias Selecionadas

### 2.1 Frontend — React + Tailwind CSS

| Atributo | Detalhe |
|---|---|
| **Framework** | React 18+ |
| **Estilização** | Tailwind CSS |
| **Gerenciamento de Estado** | Context API (fase 1) → Redux Toolkit (se necessário na fase 3) |
| **Roteamento** | React Router v6 |
| **Requisições HTTP** | Axios |
| **Notificações UI** | React Hot Toast |

**Justificativa:** React é a biblioteca frontend mais utilizada no mercado brasileiro, com ampla documentação e comunidade. Tailwind CSS acelera o desenvolvimento de interfaces responsivas sem CSS customizado excessivo. A escolha foi aprovada pelo desenvolvedor líder Reinaldo.

### 2.2 Backend — Node.js + Express

| Atributo | Detalhe |
|---|---|
| **Runtime** | Node.js 20 LTS |
| **Framework** | Express.js |
| **ORM / Query Builder** | Knex.js |
| **Autenticação** | JWT (jsonwebtoken) + bcrypt |
| **Validação de Dados** | Joi |
| **Variáveis de Ambiente** | dotenv |

**Justificativa:** Node.js com Express é amplamente ensinado em cursos de Engenharia de Software, permitindo que a equipe compreenda e contribua com o código do backend. O uso de JavaScript no frontend e backend reduz a fricção cognitiva para membros júniores.

### 2.3 Banco de Dados — PostgreSQL

| Atributo | Detalhe |
|---|---|
| **SGBD** | PostgreSQL 15+ |
| **Hospedagem dev** | Railway (instância gratuita) |
| **Migrações** | Knex migrations |

**Justificativa:** PostgreSQL é robusto, gratuito, amplamente usado em sistemas de saúde e governamentais. Suporta dados relacionais complexos necessários para vincular pacientes, solicitações e UBSs. Compatível com LGPD pela granularidade de permissões por tabela/coluna.

### 2.4 Hospedagem (Ambiente Acadêmico)

| Serviço | Uso | Custo |
|---|---|---|
| **Vercel** | Deploy do frontend React | Gratuito (plano Hobby) |
| **Railway** | Deploy do backend + banco | Gratuito (plano Trial / $5 crédito mensal) |
| **GitHub** | Versionamento de código | Gratuito |

---

## 3. Diagrama de Componentes

```
USUÁRIO (Smartphone / Computador)
        │
        │ HTTPS
        ▼
┌─────────────────────────────────┐
│         FRONTEND (Vercel)       │
│                                 │
│  ┌──────────────┐  ┌──────────┐ │
│  │ Portal Gestor│  │ Portal   │ │
│  │  (Manager)   │  │ Paciente │ │
│  └──────┬───────┘  └────┬─────┘ │
│         └──────┬─────────┘      │
└────────────────┼────────────────┘
                 │ REST API (JSON)
                 │ HTTPS
                 ▼
┌─────────────────────────────────┐
│       BACKEND API (Railway)     │
│                                 │
│  POST /auth/login               │
│  GET  /paciente/:id/solicitacoes│
│  PUT  /solicitacao/:id/status   │
│  GET  /medicamentos/:ubs        │
│  POST /comunicados              │
│  ...                            │
│                                 │
│  Middleware de autenticação JWT │
│  Middleware de validação de     │
│  dados (Joi)                    │
└───────────────┬─────────────────┘
                │ SQL
                ▼
┌─────────────────────────────────┐
│       POSTGRESQL (Railway)      │
│                                 │
│  tabela: pacientes              │
│  tabela: solicitacoes           │
│  tabela: medicamentos           │
│  tabela: comunicados            │
│  tabela: agendamentos_gestao    │
│  tabela: usuarios_gestores      │
│  tabela: ubs                    │
└─────────────────────────────────┘
```

---

## 4. Fluxo de Autenticação

### Paciente
```
1. Paciente insere CRA + Data de Nascimento
2. Backend valida CRA no banco de dados
3. Backend verifica se a data de nascimento corresponde ao registro
4. Se válido: gera token JWT com prazo de 8 horas
5. Frontend armazena token no localStorage
6. Todas as requisições subsequentes incluem o token no header Authorization
7. Backend valida o token em cada requisição protegida
```

### Gestor da UBS
```
1. Gestor insere e-mail + senha
2. Backend busca gestor pelo e-mail
3. Backend compara senha com hash bcrypt armazenado
4. Se válido: gera token JWT com identificação de perfil (recepcionista/gestor/admin)
5. Token controla quais funcionalidades o gestor pode acessar
```

**Conformidade LGPD:** Nenhuma rota da API retorna dados de outros pacientes. Cada token JWT carrega o ID do paciente, e o backend valida que o recurso solicitado pertence ao usuário autenticado.

---

## 5. Padrão de API REST

Todas as rotas seguem o padrão REST com as seguintes convenções:

| Método | Uso | Exemplo |
|---|---|---|
| GET | Buscar dados | `GET /api/solicitacoes/paciente/123` |
| POST | Criar registro | `POST /api/solicitacoes` |
| PUT | Atualizar registro completo | `PUT /api/solicitacoes/45` |
| PATCH | Atualizar campo específico | `PATCH /api/solicitacoes/45/status` |
| DELETE | Remover registro | `DELETE /api/comunicados/7` |

**Formato de resposta padrão:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}
```

**Formato de erro padrão:**
```json
{
  "success": false,
  "error": "SOLICITACAO_NAO_ENCONTRADA",
  "message": "Nenhuma solicitação encontrada para este paciente"
}
```

---

## 6. Segurança

| Aspecto | Implementação |
|---|---|
| **Senhas** | Hash com bcrypt (salt rounds: 12) |
| **Tokens** | JWT com expiração de 8h (paciente) e 12h (gestor) |
| **HTTPS** | Obrigatório em produção (gerenciado pela Vercel/Railway) |
| **Validação de entrada** | Joi valida todos os campos recebidos pela API |
| **SQL Injection** | Prevenido pelo uso de Knex.js com queries parametrizadas |
| **CORS** | Configurado para aceitar apenas o domínio do frontend |
| **Dados sensíveis** | Nunca retornados em rotas sem autenticação |

---

## 7. Decisões Arquiteturais e Justificativas

| Decisão | Alternativa Considerada | Motivo da Escolha |
|---|---|---|
| React (não Next.js) | Next.js, Vue.js | Curva de aprendizado menor para equipe; SSR não é necessário no MVP |
| Express (não Fastify/NestJS) | NestJS, Fastify | Simplicidade; código mais legível para membros júniores |
| Knex.js (não Prisma) | Prisma ORM, Sequelize | Knex gera SQL mais transparente, facilitando o aprendizado do banco |
| JWT (não Sessions) | Express-session | Stateless; mais simples em arquitetura de API separada do frontend |
| PostgreSQL (não MongoDB) | MongoDB, MySQL | Dados de saúde são relacionais por natureza; PostgreSQL é padrão governamental |
| Sem integração e-SUS no MVP | Integração via LEDI APS | Escopo acadêmico; integração exige credenciais governamentais e aumenta complexidade |

---

*Documento mantido e atualizado pelo time de desenvolvimento a cada fase concluída.*
