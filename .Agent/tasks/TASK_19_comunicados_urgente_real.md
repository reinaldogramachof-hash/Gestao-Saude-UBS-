# TASK_19 — Comunicados: Campo `urgente` Real (substituir heurística)
## Para o Agente Antigravity

> **Prioridade:** 🟡 Média — elimina falsos positivos/negativos na detecção de urgência
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19
> **Migration já aplicada:** `comunicados.urgente BOOLEAN DEFAULT FALSE` ✅ (Supabase)
>
> **Arquivos alterados:**
> - `app/backend/src/routes/gestor.js` (POST /comunicado — incluir campo urgente)
> - `app/backend/src/routes/paciente.js` (GET /comunicados — retornar campo urgente)
> - `app/frontend/src/pages/gestor/ComunicadosGestor.jsx` (toggle no form)
> - `app/frontend/src/pages/paciente/ComunicadosPaciente.jsx` (usar c.urgente)

---

## CONTEXTO

Na TASK_15, `ComunicadosPaciente.jsx` implementou detecção de urgência por palavras-chave no título:
```js
const isUrgente = (titulo) => {
  const palavras = ['urgente', 'urgência', 'amanhã', 'hoje', 'prazo', 'imediato', 'alerta', 'atenção'];
  return palavras.some(p => titulo.toLowerCase().includes(p));
};
```

Isso gera falsos positivos (ex: "Atenção: novos horários de atendimento" = urgente indevido)
e falsos negativos (gestor marca mentalmente como urgente mas não usa as palavras-chave).

**Agora que o campo `urgente BOOLEAN` existe no banco**, o gestor controla explicitamente.
A heurística pode ser removida.

---

## ITEM 1 — BACKEND: gestor.js — POST /comunicado

**Localizar** `router.post('/comunicado', ...)` (~linha 996).

Mudar o destructuring:
```js
// ANTES:
const { titulo, mensagem, tipo = 'geral', paciente_id } = req.body;

// DEPOIS:
// urgente: flag booleana que o gestor define explicitamente ao criar o comunicado
const { titulo, mensagem, tipo = 'geral', paciente_id, urgente = false } = req.body;
```

Mudar o `.insert(...)`:
```js
// ANTES:
const [comunicado] = await knex('comunicados')
  .insert({
    ubs_id:     req.user.ubs_id,
    gestor_id:  req.user.id,
    paciente_id: tipo === 'individual' ? (paciente_id || null) : null,
    titulo,
    mensagem,
    tipo,
  })
  .returning('*');

// DEPOIS:
const [comunicado] = await knex('comunicados')
  .insert({
    ubs_id:     req.user.ubs_id,
    gestor_id:  req.user.id,
    paciente_id: tipo === 'individual' ? (paciente_id || null) : null,
    titulo,
    mensagem,
    tipo,
    urgente: Boolean(urgente), // garante tipo booleano mesmo se vier como string do form
  })
  .returning('*');
```

Atualizar o comentário da rota:
```js
// ANTES:
// Body: { titulo, mensagem, tipo, paciente_id }

// DEPOIS:
// Body: { titulo, mensagem, tipo, paciente_id, urgente }
```

---

## ITEM 2 — BACKEND: paciente.js — GET /comunicados

**Localizar** `router.get('/comunicados', ...)` (~linha 281).

Adicionar `'comunicados.urgente'` no `.select(...)`:

```js
// ANTES:
.select(
  'comunicados.id', 
  'comunicados.titulo', 
  'comunicados.mensagem', 
  'comunicados.tipo', 
  'comunicados.criado_em', 
  'comunicados.paciente_id',
  knex.raw('CASE WHEN comunicados_leitura.id IS NOT NULL THEN true ELSE false END as lido')
)

// DEPOIS:
.select(
  'comunicados.id', 
  'comunicados.titulo', 
  'comunicados.mensagem', 
  'comunicados.tipo',
  'comunicados.urgente',   // campo explícito — substituiu a heurística de palavras-chave
  'comunicados.criado_em', 
  'comunicados.paciente_id',
  knex.raw('CASE WHEN comunicados_leitura.id IS NOT NULL THEN true ELSE false END as lido')
)
```

---

## ITEM 3 — FRONTEND GESTOR: ComunicadosGestor.jsx

### 3a. Estado do form — adicionar campo urgente

```js
// ANTES:
const [form, setForm] = useState({ titulo: '', mensagem: '', tipo: 'geral', paciente_id: '' });

// DEPOIS:
const [form, setForm] = useState({ titulo: '', mensagem: '', tipo: 'geral', paciente_id: '', urgente: false });
```

### 3b. Reset após salvar — incluir urgente no reset

```js
// ANTES:
setForm({ titulo: '', mensagem: '', tipo: 'geral', paciente_id: '' });

// DEPOIS:
setForm({ titulo: '', mensagem: '', tipo: 'geral', paciente_id: '', urgente: false });
```

### 3c. handleSalvar — incluir urgente no envio

```js
// ANTES:
await api.post('/gestor/comunicado', { ...form, paciente_id: form.tipo === 'individual' ? form.paciente_id : null });

// DEPOIS:
await api.post('/gestor/comunicado', {
  ...form,
  paciente_id: form.tipo === 'individual' ? form.paciente_id : null,
  urgente: form.urgente,
});
```

### 3d. Modal — adicionar toggle "Urgente" no formulário

Adicionar **logo após o campo "Tipo"** e **antes do campo "Paciente destinatário"** (que só aparece quando tipo=individual):

```jsx
{/* Toggle: marcar comunicado como urgente */}
<div className="space-y-2">
  <label className="text-sm font-bold text-on-surface-variant">Urgência</label>
  <button
    type="button"
    onClick={() => setForm(prev => ({ ...prev, urgente: !prev.urgente }))}
    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
      form.urgente
        ? 'border-red-400 bg-red-50'
        : 'border-surface-variant bg-surface-container-high'
    }`}
  >
    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
      form.urgente ? 'bg-red-500 border-red-500' : 'border-on-surface-variant/40'
    }`}>
      {form.urgente && <span className="material-symbols-outlined text-white text-sm">check</span>}
    </div>
    <div>
      <p className={`text-sm font-bold ${form.urgente ? 'text-red-700' : 'text-on-surface'}`}>
        {form.urgente ? 'Marcado como URGENTE' : 'Marcar como urgente'}
      </p>
      <p className="text-xs text-on-surface-variant">
        Comunicados urgentes aparecem destacados em vermelho para o paciente.
      </p>
    </div>
  </button>
</div>
```

### 3e. Exibir badge "URGENTE" na lista de comunicados existentes

Na lista de comunicados, dentro do `.map(c => ...)`, localizar o bloco de badges de tipo e adicionar o badge urgente:

```jsx
{/* ANTES (linha com tipo badge): */}
<div className="flex items-center gap-2 flex-wrap mb-1">
  <h3 className="font-bold text-on-background truncate">{c.titulo}</h3>
  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${c.tipo === 'individual' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
    {c.tipo === 'individual' ? 'INDIVIDUAL' : 'GERAL'}
  </span>
</div>

{/* DEPOIS (com badge URGENTE): */}
<div className="flex items-center gap-2 flex-wrap mb-1">
  <h3 className="font-bold text-on-background truncate">{c.titulo}</h3>
  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${c.tipo === 'individual' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
    {c.tipo === 'individual' ? 'INDIVIDUAL' : 'GERAL'}
  </span>
  {/* Badge de urgência: visível apenas quando o gestor marcou como urgente */}
  {c.urgente && (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 bg-red-100 text-red-600">
      URGENTE
    </span>
  )}
</div>
```

---

## ITEM 4 — FRONTEND PACIENTE: ComunicadosPaciente.jsx

### 4a. Substituir a função isUrgente() pelo campo c.urgente

**Localizar e remover** a função `isUrgente`:
```js
// REMOVER COMPLETAMENTE esta função:
const isUrgente = (titulo) => {
  const palavras = ['urgente', 'urgência', 'amanhã', 'hoje', 'prazo', 'imediato', 'alerta', 'atenção'];
  return palavras.some(p => titulo.toLowerCase().includes(p));
};
```

### 4b. Substituir todas as chamadas isUrgente(c.titulo)

Localizar TODAS as ocorrências de `isUrgente(c.titulo)` e `isUrgente(a.titulo)` e substituir por `Boolean(c.urgente)` / `Boolean(a.urgente)` conforme o nome da variável em cada contexto.

**Atenção:** no sort de `comunicadosOrdenados`, as variáveis locais podem ser `a` e `b`. Verificar o código real e substituir corretamente:

```js
// Exemplo de substituição no sort (ajustar aos nomes reais das variáveis):
// ANTES:
const aUrgente = isUrgente(a.titulo);
const bUrgente = isUrgente(b.titulo);

// DEPOIS:
const aUrgente = Boolean(a.urgente);
const bUrgente = Boolean(b.urgente);
```

E no JSX dos cards, qualquer uso de `isUrgente(c.titulo)` deve virar `Boolean(c.urgente)`.

**Importante:** não alterar a lógica de ordenação nem as classes visuais — apenas substituir a fonte da informação (heurística → campo real).

---

## VALIDAÇÃO

1. Gestor cria comunicado COM toggle urgente → `urgente: true` salvo no banco ✓
2. Gestor cria comunicado SEM toggle → `urgente: false` salvo no banco ✓
3. Badge "URGENTE" aparece na lista de comunicados do gestor quando urgente=true ✓
4. Paciente vê o comunicado com destaque vermelho quando urgente=true ✓
5. Título sem palavras-chave mas urgente=true → destaque vermelho ✓ (campo real, não heurística)
6. Título COM palavras de alerta mas urgente=false → SEM destaque vermelho ✓ (heurística eliminada)
7. Ordenação no portal do paciente: urgente-não-lido → não-lido → urgente-lido → lido ✓
8. Sem erros de console, build limpo, git commit + push ✓

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
