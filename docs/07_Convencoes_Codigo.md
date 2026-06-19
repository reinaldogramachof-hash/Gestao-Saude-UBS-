# Documento 07 — Convenções de Código

Este documento reúne e formaliza as diretrizes de desenvolvimento do repositório **Gestão Saúde UBS+**, estabelecendo regras para organização de arquivos, estilo de código, mensagens de commit e documentação técnica inline.

---

## 📁 1. Nomenclatura de Arquivos e Pastas

Adotamos regras claras de nomenclatura para manter a consistência entre o frontend (React) e backend (Node.js):

### Frontend (React)
*   **Componentes React:** Adotam **PascalCase** e a extensão `.jsx` ou `.tsx`.
    *   *Exemplo:* `BottomNavPaciente.jsx`, `GestorLayout.jsx`, `SideNavGestor.jsx`.
*   **Páginas (Pages):** Adotam **PascalCase** e a extensão `.jsx` ou `.tsx`.
    *   *Exemplo:* `DashboardPaciente.jsx`, `PerfilPaciente.jsx`, `LoginPaciente.jsx`.
*   **Custom Hooks:** Adotam **camelCase** com o prefixo `use` e a extensão `.js` ou `.ts`.
    *   *Exemplo:* `useAuth.js`, `usePacientes.js`.
*   **Utilitários e Serviços:** Adotam **camelCase** com extensão `.js` ou `.ts`.
    *   *Exemplo:* `api.js`, `statusHelper.js`.
*   **Pastas de Componentes:** Separadas por contexto e escritas em **camelCase**.
    *   *Exemplo:* `/components/gestor/`, `/components/paciente/`.

### Backend (Node.js)
*   **Rotas e Controladores:** Adotam **camelCase** com a extensão `.js`.
    *   *Exemplo:* `auth.js`, `gestor.js`, `paciente.js`.
*   **Middlewares:** Adotam **camelCase** com a extensão `.js`.
    *   *Exemplo:* `auth.js`.
*   **Migrations e Seeds (Banco):** Usam número de ordem de lote ou data como prefixo e nomenclatura em **snake_case**.
    *   *Exemplo:* `003_create_pacientes.js`, `20260618030419_create_encaminhamentos_table.js`.

---

## 📝 2. Comentários Obrigatórios em Código

Conforme estabelecido nas regras master do **AGENTS.md**, **todos os arquivos de código (.js, .jsx, .ts, .tsx, .sql, .css, arquivos de configuração) devem conter comentários explicativos.**

Os comentários devem ser de alto nível, explicando a intenção da lógica, e não redundâncias como "incrementa a variável i".

### Padrão de Cabeçalho de Módulos / Componentes:
```javascript
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

### Padrão de Comentários Inline de Funções:
```javascript
// Verifica se o token JWT ainda é válido comparando a data de expiração
// com o horário atual. Retorna true se válido, false se expirado.
function isTokenValid(token) { ... }
```

---

## 💬 3. Convenção de Commits (Padrão Semântico)

Utilizamos a convenção do **Conventional Commits** para manter o histórico do Git limpo e compreensível, facilitando auditorias e integração contínua:

### Estrutura do Commit:
```
tipo: descrição curta em português do Brasil
```

### Principais Tipos Aprovados:
*   **`feat`:** Implementação de uma nova funcionalidade no sistema.
    *   *Exemplo:* `feat: adicionar aba de timeline clínica no perfil do paciente`
*   **`fix`:** Correção de um bug ou comportamento inesperado.
    *   *Exemplo:* `fix: ajustar fuso horário que exibia a data de nascimento incorreta`
*   **`docs`:** Alterações puramente em documentação (arquivos `.md`, README, etc.).
    *   *Exemplo:* `docs: criar guia de convenções de código e commits`
*   **`refactor`:** Modificações de código que não alteram o comportamento final da aplicação (ex: limpeza de código, melhoria estrutural).
    *   *Exemplo:* `refactor: mover scripts geradores antigos para a pasta /scripts`
*   **`style`:** Alterações estéticas ou de estilo visual (espaçamento, formatação, CSS, Tailwind) que não mexem na lógica.
    *   *Exemplo:* `style: alinhar botões do formulário na tela de login`
*   **`test`:** Adição de novos testes unitários ou de integração ou correções de testes.
    *   *Exemplo:* `test: adicionar contrato de teste de autenticação do gestor`
