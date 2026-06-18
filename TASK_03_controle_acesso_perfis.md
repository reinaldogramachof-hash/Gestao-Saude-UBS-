# TASK 03 — Controle de Acesso por Perfil (SideNav)
**Origem:** Claude Cowork (Arquiteto)
**Destino:** Antigravity Agent (Executor)
**Projeto:** Gestão Saúde UBS+
**Tipo:** Implementação cirúrgica — arquivo único
**Prioridade:** 🔴 Alta — sem isso todos os perfis veem o menu completo na demo da banca
**Data:** 2026-06-18

---

## CONTEXTO

O sistema tem 4 perfis de usuário gestor: `recepcionista`, `gestor`, `admin` e `medico`.
Atualmente todos veem o mesmo menu lateral — o único filtro existente é o bloco
`admin` (Usuários/Relatórios) que já usa `user?.perfil === 'admin'`.

A matriz de acesso aprovada pelo Arquiteto é:

| Módulo               | recepcionista | gestor | admin | medico |
|----------------------|:---:|:---:|:---:|:---:|
| Dashboard            | ✅ | ✅ | ✅ | ✅ |
| Pacientes            | ✅ | ✅ | ✅ | ❌ |
| Painel Médico        | ❌ | ❌ | ✅ | ✅ |
| Agendamentos         | ✅ | ✅ | ✅ | ❌ |
| Regulação            | ❌ | ✅ | ✅ | ❌ |
| Transporte Sanitário | ❌ | ✅ | ✅ | ❌ |
| Serviço Social       | ❌ | ✅ | ✅ | ❌ |
| Vigilância e Surtos  | ❌ | ✅ | ✅ | ❌ |
| Medicamentos         | ✅ | ✅ | ✅ | ❌ |
| Comunicados          | ✅ | ✅ | ✅ | ❌ |
| Usuários (admin)     | ❌ | ❌ | ✅ | ❌ |

---

## ARQUIVO A MODIFICAR

```
app/frontend/src/components/gestor/SideNavGestor.jsx
```

Leitura obrigatória antes de qualquer alteração.

---

## IMPLEMENTAÇÃO EXIGIDA

### 1. Adicionar mapa `PERFIS_ACESSO` no topo do arquivo

Logo após os mapas `PERFIL_BADGE` e `PERFIL_LABEL` já existentes, inserir:

```js
// Mapa de controle de acesso por perfil.
// Cada chave representa a "seção" de rota. O valor é o array de perfis
// que têm permissão de ver o item no menu.
const PERFIS_ACESSO = {
  dashboard:         ['recepcionista', 'gestor', 'admin', 'medico'],
  pacientes:         ['recepcionista', 'gestor', 'admin'],
  medico:            ['admin', 'medico'],
  agendamentos:      ['recepcionista', 'gestor', 'admin'],
  regulacao:         ['gestor', 'admin'],
  transporte:        ['gestor', 'admin'],
  'servico-social':  ['gestor', 'admin'],
  vigilancia:        ['gestor', 'admin'],
  medicamentos:      ['recepcionista', 'gestor', 'admin'],
  comunicados:       ['recepcionista', 'gestor', 'admin'],
};
```

### 2. Criar helper `pode(secao)` dentro do componente `SideNavGestor`

Logo após as declarações de `useState`/`useEffect` iniciais, antes do `return`, inserir:

```js
// Helper: retorna true se o perfil do usuário logado tem acesso à seção.
// Fallback para false se o perfil não estiver mapeado (seguro por padrão).
const pode = (secao) =>
  PERFIS_ACESSO[secao]?.includes(user?.perfil) ?? false;
```

### 3. Envolver cada NavItem com renderização condicional

Aplicar `{pode('chave') && (...)}` em cada item e em cada `SectionLabel`
que deve desaparecer junto com seus itens.

**Padrão a seguir:**

```jsx
{/* Sempre visível */}
<NavItem to="/gestor/dashboard" icon="dashboard" label="Painel Principal" ... />

{/* Seção ATENDIMENTO — só exibe se ao menos um item for visível */}
{(pode('pacientes') || pode('medico') || pode('agendamentos')) && (
  <SectionLabel label="ATENDIMENTO" retraida={retraida} />
)}
{pode('pacientes') && (
  <NavItem to="/gestor/pacientes" icon="people" label="Pacientes" ... badgeCount={pendentes} />
)}
{pode('medico') && (
  <NavItem to="/gestor/medico" icon="stethoscope" label="Painel Médico" ... />
)}
{pode('agendamentos') && (
  <NavItem to="/gestor/agendamentos" icon="calendar_month" label="Agendamentos" ... />
)}

{/* Seção REDE EXTERNA E APOIO */}
{(pode('regulacao') || pode('transporte') || pode('servico-social') || pode('vigilancia')) && (
  <SectionLabel label="REDE EXTERNA E APOIO" retraida={retraida} />
)}
{pode('regulacao') && (
  <NavItem to="/gestor/regulacao" icon="account_tree" label="Regulação" ... />
)}
{pode('transporte') && (
  <NavItem to="/gestor/transporte" icon="directions_bus" label="Transporte Sanitário" ... />
)}
{pode('servico-social') && (
  <NavItem to="/gestor/servico-social" icon="diversity_1" label="Serviço Social" ... />
)}
{pode('vigilancia') && (
  <NavItem to="/gestor/vigilancia" icon="coronavirus" label="Vigilância e Surtos" ... />
)}

{/* Seção FARMÁCIA */}
{pode('medicamentos') && (
  <>
    <SectionLabel label="FARMÁCIA" retraida={retraida} />
    <NavItem to="/gestor/medicamentos" icon="medication" label="Medicamentos" ... />
  </>
)}

{/* Seção COMUNICAÇÃO */}
{pode('comunicados') && (
  <>
    <SectionLabel label="COMUNICAÇÃO" retraida={retraida} />
    <NavItem to="/gestor/comunicados" icon="campaign" label="Comunicados" ... />
  </>
)}

{/* Seção ADMINISTRAÇÃO — lógica existente, manter intacta */}
{user?.perfil === 'admin' && (
  <>
    <SectionLabel label="ADMINISTRAÇÃO" retraida={retraida} />
    <NavItem to="/gestor/usuarios" ... />
    {/* bloco "Relatórios" desabilitado, manter como está */}
  </>
)}
```

> **Atenção:** o bloco ADMINISTRAÇÃO já usa `user?.perfil === 'admin'` — NÃO
> migrar para `pode()`. Manter a lógica existente intacta para não quebrar o
> item "Relatórios em breve" que tem markup customizado.

---

## RESTRIÇÕES

- Modificar **apenas** `SideNavGestor.jsx`
- NÃO alterar props, assinatura ou lógica dos componentes `NavItem` e `SectionLabel`
- NÃO alterar rotas em `App.jsx` (proteção de rotas é escopo futuro; nav-level é suficiente para o MVP)
- NÃO alterar nenhum outro arquivo
- Preservar todos os atributos existentes de cada `NavItem` (`retraida`, `activeClass`, `onClick`, `badgeCount` onde aplicável)
- Comentários obrigatórios em cada seção condicional (padrão CLAUDE.md)

---

## STATUS DE RETORNO

Gerar arquivo `REPORT_03_controle_acesso.md` na raiz com:

```
# REPORT 03 — Controle de Acesso por Perfil
**De:** Antigravity Agent
**Para:** Claude Cowork (Arquiteto)
**Data:** [data]

## Sumário
[Confirmação de que apenas SideNavGestor.jsx foi modificado]

## Diff aplicado
[Diff completo do arquivo]

## Verificação por perfil
[Para cada perfil (recepcionista, gestor, admin, medico): lista dos itens
 que aparecem no menu conforme o mapa PERFIS_ACESSO]

## Pendências
[Qualquer desvio do escopo ou ponto de atenção]
```
