# TASK_17 — Medicamentos: "Como Retirar" + Filtro Disponíveis
## Para o Agente Antigravity

> **Prioridade:** 🟡 Média — agrega valor informacional direto ao paciente
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19
> **Migration já aplicada:** `medicamentos.instrucoes_retirada TEXT` ✅ (Supabase)
>
> **Arquivos alterados:**
> - `app/backend/src/routes/gestor.js` (PUT + POST /medicamento)
> - `app/backend/src/routes/paciente.js` (GET /medicamentos)
> - `app/frontend/src/pages/gestor/MedicamentosGestor.jsx`
> - `app/frontend/src/pages/paciente/Medicamentos.jsx`

---

## CONTEXTO

A tabela `medicamentos` ganhou a coluna `instrucoes_retirada TEXT` (migration 016).
Essa coluna permite ao gestor registrar instruções práticas para o paciente:
horário de funcionamento da farmácia, documentos necessários, guichê, etc.

**Hoje:** o backend não lê/escreve esse campo. O frontend não o exibe.
**Depois desta task:** gestor cadastra e edita as instruções; paciente as vê no card.

---

## ITEM 1 — BACKEND: gestor.js

### 1a. PUT /gestor/medicamento/:id — adicionar instrucoes_retirada ao update

**Localizar** a função do `router.put('/medicamento/:id', ...)` (~linha 619).

Mudar o destructuring do `req.body`:
```js
// ANTES:
const { disponivel, observacao } = req.body;

// DEPOIS:
const { disponivel, observacao, instrucoes_retirada } = req.body;
```

Mudar o `.update(...)`:
```js
// ANTES:
await knex('medicamentos')
  .where({ id: req.params.id })
  .update({
    disponivel,
    observacao:    observacao ?? existente.observacao,
    atualizado_em: knex.fn.now(),
    atualizado_por: req.user.id,
  });

// DEPOIS:
await knex('medicamentos')
  .where({ id: req.params.id })
  .update({
    disponivel,
    observacao:          observacao          ?? existente.observacao,
    instrucoes_retirada: instrucoes_retirada ?? existente.instrucoes_retirada,
    atualizado_em:       knex.fn.now(),
    atualizado_por:      req.user.id,
  });
```

Atualizar o comentário do header da rota:
```js
// ANTES:
// Body: { disponivel: boolean, observacao: string }

// DEPOIS:
// Body: { disponivel: boolean, observacao: string, instrucoes_retirada: string }
```

### 1b. POST /gestor/medicamento — adicionar instrucoes_retirada ao insert

**Localizar** a função do `router.post('/medicamento', ...)` (~linha 653).

Mudar o destructuring:
```js
// ANTES:
const { nome, principio_ativo, disponivel = false, observacao } = req.body;

// DEPOIS:
const { nome, principio_ativo, disponivel = false, observacao, instrucoes_retirada } = req.body;
```

Mudar o `.insert(...)`:
```js
// ANTES:
const [inserido] = await knex('medicamentos')
  .insert({
    ubs_id:         req.user.ubs_id,
    nome,
    principio_ativo: principio_ativo || null,
    disponivel,
    observacao:      observacao || null,
    atualizado_por:  req.user.id,
  })
  .returning('*');

// DEPOIS:
const [inserido] = await knex('medicamentos')
  .insert({
    ubs_id:              req.user.ubs_id,
    nome,
    principio_ativo:     principio_ativo || null,
    disponivel,
    observacao:          observacao          || null,
    instrucoes_retirada: instrucoes_retirada || null,
    atualizado_por:      req.user.id,
  })
  .returning('*');
```

Atualizar o comentário da rota:
```js
// ANTES:
// Body: { nome: string, principio_ativo: string, disponivel: boolean, observacao: string }

// DEPOIS:
// Body: { nome: string, principio_ativo: string, disponivel: boolean, observacao: string, instrucoes_retirada: string }
```

---

## ITEM 2 — BACKEND: paciente.js

### GET /paciente/medicamentos — adicionar instrucoes_retirada ao select

**Localizar** `router.get('/medicamentos', ...)` (~linha 253).

Mudar o `.select(...)`:
```js
// ANTES:
.select('id', 'nome', 'principio_ativo', 'disponivel', 'observacao', 'atualizado_em')

// DEPOIS:
.select('id', 'nome', 'principio_ativo', 'disponivel', 'observacao', 'instrucoes_retirada', 'atualizado_em')
```

---

## ITEM 3 — FRONTEND GESTOR: MedicamentosGestor.jsx

### 3a. FORM_INICIAL — adicionar campo

```js
// ANTES:
const FORM_INICIAL = {
  nome: '',
  principio_ativo: '',
  disponivel: true,
  observacao: '',
};

// DEPOIS:
const FORM_INICIAL = {
  nome: '',
  principio_ativo: '',
  disponivel: true,
  observacao: '',
  instrucoes_retirada: '',
};
```

### 3b. Estado de edição — adicionar campo

```js
// ANTES:
const [formEdicao, setFormEdicao] = useState({ disponivel: false, observacao: '' });

// DEPOIS:
const [formEdicao, setFormEdicao] = useState({ disponivel: false, observacao: '', instrucoes_retirada: '' });
```

### 3c. abrirEdicao — popular o campo

```js
// ANTES:
const abrirEdicao = (medicamento) => {
  setMedicamentoEdicao(medicamento);
  setFormEdicao({
    disponivel: Boolean(medicamento.disponivel),
    observacao: medicamento.observacao || '',
  });
};

// DEPOIS:
const abrirEdicao = (medicamento) => {
  setMedicamentoEdicao(medicamento);
  setFormEdicao({
    disponivel:          Boolean(medicamento.disponivel),
    observacao:          medicamento.observacao          || '',
    instrucoes_retirada: medicamento.instrucoes_retirada || '',
  });
};
```

### 3d. Modal de cadastro — adicionar textarea de instrucoes_retirada

Adicionar **depois** do textarea de "Observação" (antes dos botões Cancelar/Cadastrar):

```jsx
<label className="block space-y-2">
  <span className="text-sm font-bold text-on-surface-variant">Como retirar</span>
  <textarea
    rows="3"
    value={formCadastro.instrucoes_retirada}
    onChange={(e) => setFormCadastro((prev) => ({ ...prev, instrucoes_retirada: e.target.value }))}
    placeholder="Ex: Retirada Seg–Sex, 8h–17h. Levar RG e cartão SUS. Guichê 3."
    className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none"
  />
</label>
```

### 3e. Modal de edição — adicionar textarea de instrucoes_retirada

Adicionar **depois** do textarea de "Observação" (antes dos botões Cancelar/Salvar):

```jsx
<label className="block space-y-2">
  <span className="text-sm font-bold text-on-surface-variant">Como retirar</span>
  <textarea
    rows="3"
    value={formEdicao.instrucoes_retirada}
    onChange={(e) => setFormEdicao((prev) => ({ ...prev, instrucoes_retirada: e.target.value }))}
    placeholder="Ex: Retirada Seg–Sex, 8h–17h. Levar RG e cartão SUS. Guichê 3."
    className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none"
  />
</label>
```

### 3f. Toggle rápido — preservar instrucoes_retirada no toggle

A função `toggle` chama PUT com `disponivel` e `observacao`. Precisa incluir o terceiro campo
para não sobrescrever com null quando o PUT fizer `?? existente.instrucoes_retirada`:

```js
// ANTES:
const toggle = async (medicamento) => {
  try {
    await api.put(`/gestor/medicamento/${medicamento.id}`, {
      disponivel: !medicamento.disponivel,
      observacao: medicamento.observacao,
    });

// DEPOIS:
const toggle = async (medicamento) => {
  try {
    await api.put(`/gestor/medicamento/${medicamento.id}`, {
      disponivel:          !medicamento.disponivel,
      observacao:          medicamento.observacao,
      instrucoes_retirada: medicamento.instrucoes_retirada,
    });
```

---

## ITEM 4 — FRONTEND PACIENTE: Medicamentos.jsx

### 4a. Exibir bloco "Como retirar" quando instrucoes_retirada for não-nulo

Dentro do map de medicamentos, **depois** do bloco `{m.observacao && ...}`, adicionar:

```jsx
{/* Bloco "Como retirar": visível apenas quando o gestor preencheu as instruções */}
{m.instrucoes_retirada && (
  <div className="mt-3 flex items-start gap-2 bg-blue-50 rounded-xl p-3 border border-blue-100">
    <span className="material-symbols-outlined text-blue-600 text-sm flex-shrink-0 mt-0.5">info</span>
    <div>
      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-0.5">Como retirar</p>
      <p className="text-xs text-blue-800 leading-relaxed">{m.instrucoes_retirada}</p>
    </div>
  </div>
)}
```

### 4b. Adicionar toggle "Mostrar apenas disponíveis"

**Adicionar estado** no topo do componente (após `const [erro, setErro] = useState(false);`):
```jsx
// Controla se lista apenas medicamentos disponíveis
const [soDisponiveis, setSoDisponiveis] = useState(false);
```

**Filtrar a lista** antes do map (derivar em render):
```jsx
// Aplica filtro local de disponibilidade (rápido, sem nova chamada de API)
const medsFiltrados = soDisponiveis ? meds.filter(m => m.disponivel) : meds;
```

**Adicionar o toggle** dentro do `<header>`, após o campo de busca (antes do fechamento da tag `</header>`):
```jsx
{/* Toggle: filtrar apenas disponíveis */}
<button
  onClick={() => setSoDisponiveis(v => !v)}
  className={`mt-3 flex items-center gap-2 text-sm font-bold transition-colors ${soDisponiveis ? 'text-white' : 'text-white/60'}`}
>
  <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${soDisponiveis ? 'bg-white border-white' : 'border-white/50'}`}>
    {soDisponiveis && <span className="material-symbols-outlined text-primary text-sm">check</span>}
  </span>
  Mostrar apenas disponíveis
</button>
```

**Substituir** `meds.map(m => ...)` por `medsFiltrados.map(m => ...)` no JSX.

**Atualizar** o estado vazio para considerar o filtro:
```jsx
// ANTES:
{!loading && !erro && meds.length === 0 && (
  <div className="py-16 text-center text-on-surface-variant font-medium">
    <span className="material-symbols-outlined text-5xl block mb-4 opacity-30">medication</span>
    {busca ? `Nenhum resultado para "${busca}".` : 'Nenhum medicamento cadastrado.'}
  </div>
)}

// DEPOIS:
{!loading && !erro && medsFiltrados.length === 0 && (
  <div className="py-16 text-center text-on-surface-variant font-medium">
    <span className="material-symbols-outlined text-5xl block mb-4 opacity-30">medication</span>
    {busca
      ? `Nenhum resultado para "${busca}".`
      : soDisponiveis
      ? 'Nenhum medicamento disponível no momento.'
      : 'Nenhum medicamento cadastrado.'}
  </div>
)}
```

---

## VALIDAÇÃO

1. Gestor cadastra medicamento com "Como retirar" → aparece no card do paciente ✓
2. Gestor edita medicamento e atualiza "Como retirar" → atualização persiste ✓
3. Toggle rápido de disponibilidade NÃO apaga instrucoes_retirada ✓
4. Bloco azul "Como retirar" só aparece quando o campo tem valor ✓
5. Toggle "Mostrar apenas disponíveis" funciona — lista filtra localmente ✓
6. Estado vazio adapta a mensagem ao filtro ativo ✓
7. Build limpo, sem erros de console, git commit + push ✓

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
