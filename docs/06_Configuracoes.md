# Documento 06 — Arquivos de Configuração

Este documento detalha o propósito e a responsabilidade de cada arquivo de configuração no projeto **Gestão Saúde UBS+**, servindo como guia de onboarding técnico rápido para a equipe e contribuidores.

---

## 💻 1. Frontend (`app/frontend/`)

O frontend é uma SPA (Single Page Application) desenvolvida em **React 18** com empacotamento do **Vite**.

*   **[vite.config.js](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/frontend/vite.config.js):** Arquivo de configuração central do empacotador Vite. Define os plugins do ecossistema React utilizados (`@vitejs/plugin-react`) e gerencia alias de caminhos absolutos, portas locais e proxy reverso para desenvolvimento se necessário.
*   **[tailwind.config.js](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/frontend/tailwind.config.js):** Configurações do framework Tailwind CSS. Define a paleta de cores estendida, fontes customizadas (`Inter`, `Outfit`), e os caminhos de arquivos (`content`) onde o Tailwind deve inspecionar as classes de estilo para otimização em produção (remover estilos não-utilizados).
*   **[postcss.config.js](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/frontend/postcss.config.js):** Configura a engine PostCSS que processa o Tailwind CSS e aplica autoprefixer para maior compatibilidade de regras CSS em navegadores web móveis e antigos.
*   **[.env](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/frontend/.env) / [.env.example](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/frontend/.env.example):** Gerencia as variáveis de ambiente locais do cliente web. Contém a chave pública `VITE_API_URL` que aponta para o endereço da API do Backend.
*   **[vercel.json](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/frontend/vercel.json):** Instruções de deploy do front-end na plataforma Vercel. Garante que todas as rotas da SPA que não sejam arquivos estáticos redirecionem para o `index.html` (necessário para o funcionamento correto do `react-router-dom` em produção).

---

## ⚙️ 2. Backend (`app/backend/`)

O backend é uma API REST desenvolvida em **Node.js** com **Express** e persistência de dados gerenciada pelo **Knex.js**.

*   **[knexfile.js](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/backend/knexfile.js):** Configuração do Knex.js. Mapeia as credenciais de acesso ao banco de dados PostgreSQL (carregadas de variáveis de ambiente), define os diretórios de migração (`migrations/`) e de sementes (`seeds/`), bem como configurações de pool de conexões e SSL obrigatório para ambientes Neon/Supabase.
*   **[.env](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/backend/.env) / [.env.example](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/backend/.env.example):** Variáveis sensíveis e de conexão do servidor. Contém strings secretas de conexão com o banco de dados (`DATABASE_URL`), porta do servidor (`PORT`), e o segredo de criptografia de JWT (`JWT_SECRET`). **Nunca deve ser commitado no repositório público (.env).**
*   **[railway.json](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/backend/railway.json):** Configurações do deploy do backend no Railway. Define o build command e a porta dinâmica do processo de execução web.
*   **[vercel.json](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/app/backend/vercel.json):** Configuração alternativa de deploy serverless na Vercel para rotas de backend.

---

## 📁 3. Raiz do Repositório (`/`)

*   **[package.json](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/package.json):** Arquivo de pacotes do diretório raiz. Serve primariamente para configurar o Vite local que atua como hub interativo de mockups estáticos exportados do Stitch (localizados na pasta `/screens`).
*   **[.gitignore](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/.gitignore):** Determina quais caminhos e arquivos locais devem ser ignorados pelo controle de versão Git (ex: `node_modules`, arquivos `.env`, logs de erro, pasta de builds `dist`).
*   **[.mcp.json](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/.mcp.json):** Define as integrações de ferramentas MCP locais atreladas ao IDE do desenvolvedor.
*   **[skills-lock.json](file:///c:/Users/reina/OneDrive/Desktop/Projetos/Gest%C3%A3o%20Sa%C3%BAde%20UBS+/skills-lock.json):** Arquivo de travamento de plugins de habilidades do assistente virtual (Antigravity).
