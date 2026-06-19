# TASK 01 — Painel do Médico (módulo completo)
**Origem:** Claude Cowork (Arquiteto)
**Destino:** Antigravity Agent (Executor)
**Projeto:** Gestão Saúde UBS+
**Tipo:** Leitura+Proposta (código completo para revisão do Arquiteto)
**Prioridade:** 🔴 Alta — demanda direta de avaliador da banca
**Data:** 2026-06-18

---

## CONTEXTO

Um avaliador da banca (médico) solicitou um painel exclusivo para médicos onde
podem buscar qualquer paciente por CRA e visualizar todas as informações e
histórico de solicitações.

### Decisões arquiteturais já tomadas pelo Arquiteto:

1. **Sem nova migration** — o campo `perfil` em `usuarios_gestores` é
   `string(30)` sem constraint. Adicionar perfil `'medico'` é inserção de dado,
   não alteração de schema. Um usuário médico pode ser cadastrado direto via SQL
   na demo.

2. **Sem nova rota backend** — os endpoints já existentes cobrem tudo:
   - `GET /api/gestor/pacientes?busca=TEXTO` — busca por nome ou CRA
   - `GET /api/gestor/paciente/:id` — perfil completo + todas solicitações

3. **Auth reutilizada** — o médico faz login na mesma tela que o gestor
   (`/login-gestor`). O `authMiddleware` e `soGestor` já cobrem. O middleware
   `soGestor` valida `usuario.tipo === 'gestor'` (tabela `usuarios_gestores`),
   que inclui qualquer perfil da tabela — inclusive `'medico'`.

4. **Perfil read-only** — o médico visualiza, não edita. Nenhum botão de
   "Atualizar Status", "Escalar", "Editar Dados" deve aparecer.

5. **Rota:** `/gestor/medico` — reusa o ProtectedRoute `tipo="gestor"` já
   existente em App.jsx.

---

## ESCOPO OBRIGATÓRIO — arquivos de referência (leitura integral)

| Arquivo | Por quê ler |
|---|---|
| `app/frontend/src/pages/gestor/GestorPacientes.jsx` | Padrão de busca + listagem de pacientes |
| `app/frontend/src/pages/gestor/PerfilPaciente.jsx` | Estrutura de exibição de solicitações e histórico — base para a view readonly |
| `app/frontend/src/components/gestor/GestorLayout.jsx` | Layout wrapper a reutilizar |
| `app/frontend/src/App.jsx` | Para saber exatamente onde inserir a nova rota |
| `app/frontend/src/components/gestor/SideNavGestor.jsx` | Para saber onde inserir o novo item de menu |

---

## O QUE DEVE SER PROPOSTO (código completo)

### 1. Novo arquivo: `app/frontend/src/pages/gestor/PainelMedico.jsx`

Comportamento esperado:

**Estado inicial (sem busca):**
- Cabeçalho: "Painel Médico" + subtítulo "Busca e consulta de histórico clínico"
- Campo de busca centralizado: placeholder "Digite o CRA do paciente..."
- Botão "Buscar" ou Enter dispara a busca
- Estado vazio com ícone e texto "Informe o CRA para consultar o paciente"

**Após buscar (busca por CRA exato ou parcial):**
- Chama `GET /api/gestor/pacientes?busca={cra}` (usa axios via `import api`)
- Se retornar 1 resultado: carrega automaticamente `GET /api/gestor/paciente/:id`
  e exibe o perfil completo
- Se retornar 0 resultados: mensagem "Paciente não encontrado com o CRA informado"
- Se retornar múltiplos: lista com nome + CRA para o médico selecionar

**Perfil do paciente (view readonly):**
- Card de dados pessoais: nome, CRA, data nascimento, telefone, UBS de origem
  (mesma estrutura de PerfilPaciente.jsx, mas SEM botões de edição)
- Seção de solicitações: cards com tipo, status badge, data prevista, observação
  (mesma estrutura, mas SEM botões "Escalar" e "Atualizar Status")
- Histórico expansível por solicitação (MANTER — é leitura, não edição)
- Badge de prioridade urgente visível quando aplicável

**Regras visuais:**
- Usar `GestorLayout` como wrapper
- Seguir padrões de cores e classes do projeto (`STATUS_BADGE`, `STATUS_LABEL`
  podem ser copiados localmente)
- Mobile-first: funcionar em 375px
- Comentários obrigatórios em todos os blocos (regra do CLAUDE.md)

---

### 2. Modificação: `app/frontend/src/App.jsx`

Adicionar o import e a rota do PainelMedico. Propor o diff exato.

```
// Import a adicionar (junto com os outros imports de páginas do gestor):
import PainelMedico from './pages/gestor/PainelMedico';

// Rota a adicionar (dentro do bloco Portal do Gestor):
<Route path="/gestor/medico" element={<ProtectedRoute tipo="gestor"><PainelMedico /></ProtectedRoute>} />
```

---

### 3. Modificação: `app/frontend/src/components/gestor/SideNavGestor.jsx`

Adicionar NavItem para o Painel Médico. Propor o diff exato.

Inserir após o item "Pacientes" (antes de "Agendamentos"), na seção ATENDIMENTO:

```jsx
<NavItem
  to="/gestor/medico"
  icon="stethoscope"
  label="Painel Médico"
  retraida={retraida}
  activeClass={isActive('medico')}
  onClick={handleNavegar}
/>
```

---

## RESTRIÇÕES

- NÃO modificar arquivos (apenas propor o código completo)
- NÃO executar comandos
- Ler os 5 arquivos de referência na íntegra antes de propor
- Todo código proposto deve ter comentários conforme padrão CLAUDE.md
- O `PainelMedico.jsx` deve ter o bloco de cabeçalho de componente padrão do projeto

---

## STATUS DE RETORNO

Gerar arquivo `REPORT_01_painel_medico.md` na raiz com:

```
# REPORT 01 — Painel Médico
**De:** Antigravity Agent
**Para:** Claude Cowork (Arquiteto)
**Data:** [data]

## Sumário
[Confirmação de leitura dos 5 arquivos + breve descrição do que foi proposto]

## PROPOSTA: PainelMedico.jsx
[Código completo com comentários]

## PROPOSTA: diff App.jsx
[Diff exato — apenas as linhas a inserir e contexto de 2 linhas ao redor]

## PROPOSTA: diff SideNavGestor.jsx
[Diff exato — apenas as linhas a inserir e contexto de 2 linhas ao redor]

## Notas para o Arquiteto
[Decisões de implementação, dúvidas, pontos de atenção]
```
