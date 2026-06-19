# 🏥 Gestão Saúde UBS+

> **Projeto de Extensão Multidisciplinar**  
> Engenharia de Software — **UFBRA**  
> Foco: Transparência de informação para munícipes de São José dos Campos (SP).

---

## 📋 Sobre o Projeto

O **Gestão Saúde UBS+** é uma plataforma desenvolvida com o objetivo de melhorar a comunicação entre a equipe de gestão das Unidades Básicas de Saúde (UBS) de São José dos Campos (SP) e os cidadãos (pacientes). 

O sistema combate a desinformação sobre filas, andamento de exames, disponibilidade de medicamentos e agendamentos. A aplicação **não substitui** os sistemas oficiais do SUS (como e-SUS, SISREG ou CROSS), mas atua como um facilitador de transparência com alimentação de dados realizada manualmente pelos gestores da unidade.

O ecossistema é composto por dois portais:
1. **Portal do Gestor (Desktop):** Onde a equipe da UBS cadastra pacientes, medicamentos disponíveis, comunicados importantes, agenda atendimentos internos e atualiza a timeline de exames/consultas em linguagem simples.
2. **Portal do Paciente (Mobile-First):** Onde o munícipe acessa com seu número de CRA e data de nascimento para verificar o status de suas solicitações ativas, histórico clínico, comunicados da UBS e agendamento de atendimento com a gestão.

---

## 🛠️ Stack Tecnológica Aprovada

*   **Frontend:** React (SPA), Vite, Tailwind CSS (com padrão de design responsivo 375px mobile-first)
*   **Backend:** Node.js, Express, Knex (Query Builder)
*   **Banco de Dados:** PostgreSQL (hospedado no Supabase para ambiente de testes/produção)
*   **Autenticação:** JWT (JSON Web Tokens) e criptografia com bcrypt
*   **Deploy:** Frontend na Vercel e Backend na Vercel (serviços de serverless e API)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
*   [Node.js](https://nodejs.org/) instalado na máquina (versão LTS recomendada).
*   Um banco de dados PostgreSQL ativo (ou usar o banco de dados remoto Supabase).

### Passo 1: Clonar o Repositório e Configurar Envs
1. No backend (`app/backend/`), duplique o arquivo `.env.example` criando o arquivo `.env` e configure as chaves de acesso:
   ```env
   PORT=3001
   DATABASE_URL=seu_link_de_conexao_postgres
   JWT_SECRET=seu_segredo_jwt_super_seguro
   ```
2. No frontend (`app/frontend/`), configure o arquivo `.env` apontando para a API local:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

### Passo 2: Rodar o Servidor Backend
```bash
cd app/backend
npm install
# Aplicar migrations do banco
npx knex migrate:latest
# Popular banco com dados iniciais (UBSs de SJC e gestores padrão)
npx knex seed:run
# Iniciar servidor em modo de desenvolvimento
npm run dev
# Backend rodará na porta http://localhost:3001
```

### Passo 3: Rodar o Aplicativo Frontend
```bash
cd app/frontend
npm install
# Iniciar o servidor de desenvolvimento
npm run dev
# O aplicativo abrirá em http://localhost:5173
```

---

## 🔑 Credenciais para Testes (Banca Examinadora)

### 💻 1. Acesso ao Portal do Gestor
Acesse a tela de login do gestor e utilize uma das contas pré-configuradas (senha padrão: `senha123`):

| UBS de Referência | E-mail do Gestor | Perfil de Acesso |
|---|---|---|
| **UBS Centro SJC** | `centro@gestaoubs.dev` | Administrador / Gestor |
| **UBS Vila Industrial** | `industrial@gestaoubs.dev` | Administrador / Gestor |
| **UBS Jardim Satélite** | `satelite@gestaoubs.dev` | Administrador / Gestor |

### 📱 2. Acesso ao Portal do Paciente
A autenticação do paciente é feita usando o número do **CRA** (Cadastro de Regulação Ambulatorial) e a sua **Data de Nascimento** (formato livre `DD/MM/AAAA` com teclado numérico nos celulares).

Como testar:
1. Faça login no **Portal do Gestor** com uma das credenciais acima.
2. Vá até a seção **Pacientes** e cadastre um novo paciente manual (anote o CRA e a Data de Nascimento informada) **OU** use a aba "Aguardando Aprovação" para ativar um paciente que utilizou o fluxo de auto-cadastro.
3. No portal do paciente, preencha o **CRA** e a **Data de Nascimento** correspondentes para acessar o painel de atendimento do cidadão.

---

## 📁 Estrutura de Pastas

```
/
├── app/
│   ├── frontend/             ← Aplicação React (Vite + Tailwind)
│   │   ├── src/
│   │   │   ├── components/   ← Componentes separados por gestor/paciente
│   │   │   ├── pages/        ← Páginas de cada um dos portais
│   │   │   └── utils/        ← Helpers de fuso horário, cores e status
│   └── backend/              ← API REST Node.js (Express + Knex)
│       └── src/
│           ├── routes/       ← Definição de rotas públicas e autenticadas
│           └── db/           ← Configurações e migrations de DB
├── docs/                     ← Documentação oficial de Engenharia de Software
├── screens/                  ← Mockups HTML estáticos originais de wireframes
├── scripts/                  ← Scripts utilitários de setup e scaffolding arquivados
├── AGENTS.md                 ← Documento master com regras da equipe de desenvolvimento
└── CLAUDE.md                 ← Convenções adicionais do assistente virtual
```

---

## 📄 Documentos de Referência

A documentação detalhada do projeto de Engenharia de Software está estruturada na pasta `/docs/`:
*   [01. Descrição do Projeto](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/docs/01_Descricao_do_Projeto.md) — Visão geral e escopo acadêmico.
*   [02. Arquitetura Técnica](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/docs/02_Arquitetura_Tecnica.md) — Infraestrutura e padrões técnicos.
*   [03. Modelo de Dados](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/docs/03_Modelo_de_Dados.md) — Esquema de tabelas do PostgreSQL e ER diagram.
*   [04. Requisitos Funcionais](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/docs/04_Requisitos_Funcionais.md) — Detalhamento de casos de uso do sistema.
*   [05. Roadmap de Entregas](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/docs/05_Roadmap.md) — Histórico de fases e plano futuro pós-apresentação.
*   [06. Arquivos de Configuração](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/docs/06_Configuracoes.md) — Guia rápido de dependências e ambientes.
*   [07. Convenções de Código](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/docs/07_Convencoes_Codigo.md) — Estilo de nomenclatura e semântica de commits.
