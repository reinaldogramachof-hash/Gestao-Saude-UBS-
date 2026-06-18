# Gerenciamento de Usuarios Gestores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o modulo administrativo para listar, cadastrar, editar, redefinir senha, desativar e reativar usuarios gestores da mesma UBS.

**Architecture:** Um router CommonJS dedicado aplica autorizacao de perfil admin a todas as rotas e limita cada consulta ao `ubs_id` do JWT. A pagina React usa o contexto de autenticacao para bloquear a interface, mantem modais inline e consome somente endpoints `/admin`.

**Tech Stack:** Node.js, Express, Knex, PostgreSQL, bcrypt, React 18, React Router, Axios, Tailwind CSS, react-hot-toast e Node Test Runner.

---

### Task 1: Testes de contrato

**Files:**
- Create: `tests/admin-usuarios-contracts.test.mjs`

- [ ] Criar 14 testes para autorizacao, isolamento, hash, duplicidade, auto-protecao, desativacao, ausencia de senha e integracao frontend.
- [ ] Executar `node --test tests\admin-usuarios-contracts.test.mjs`.
- [ ] Confirmar que os testes falham porque os arquivos e rotas ainda nao existem.

### Task 2: Router administrativo

**Files:**
- Create: `app/backend/src/routes/admin.js`
- Modify: `app/backend/server.js`

- [ ] Criar middleware local que exige `req.user.perfil === 'admin'`.
- [ ] Implementar listagem com selecao explicita sem `senha_hash`.
- [ ] Implementar cadastro com validacao, perfil valido, email duplicado e bcrypt 12.
- [ ] Implementar edicao limitada a mesma UBS, protegendo o proprio perfil.
- [ ] Implementar redefinicao de senha de outro usuario com minimo de seis caracteres.
- [ ] Implementar desativacao logica e reativacao via PATCH.
- [ ] Registrar o router depois do middleware JWT.

### Task 3: Pagina administrativa

**Files:**
- Create: `app/frontend/src/pages/gestor/GestorUsuarios.jsx`

- [ ] Bloquear conteudo para perfis diferentes de admin.
- [ ] Criar tabela responsiva com badges, skeletons, erro e retry.
- [ ] Criar modal de cadastro com confirmacao de senha.
- [ ] Criar modal de edicao e submodal de senha.
- [ ] Criar acoes de desativacao e reativacao, sem acao sobre o proprio usuario.

### Task 4: Rota e navegacao

**Files:**
- Modify: `app/frontend/src/App.jsx`
- Modify: `app/frontend/src/components/gestor/SideNavGestor.jsx`

- [ ] Registrar `/gestor/usuarios` dentro de `ProtectedRoute tipo="gestor"`.
- [ ] Ler `user` no menu e exibir `Usuários` somente para admin, depois de Medicamentos.

### Task 5: Verificacao e relatorio

**Files:**
- Create: `.Agent/reports/2026-06-11_gerenciamento-usuarios-gestores.md`

- [ ] Executar os testes novos e regressivos.
- [ ] Verificar sintaxe CommonJS de `admin.js` e `server.js`.
- [ ] Executar o build do frontend.
- [ ] Revisar hooks, acessibilidade e chaves dos JSX alterados.
- [ ] Documentar arquivos, decisoes, problemas, pendencias e resultados.
