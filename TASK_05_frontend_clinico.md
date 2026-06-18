# TASK 05 — Frontend Clínico (PerfilPaciente + PainelMedico)
**Origem:** Claude Cowork (Arquiteto)
**Destino:** Antigravity Agent (Executor)
**Projeto:** Gestão Saúde UBS+
**Tipo:** Implementação — modificação de dois componentes React existentes
**Pré-requisito:** TASK_04 aprovada e migrations executadas (`013`, `014`, `015`)
**Data:** 2026-06-18

---

## CONTEXTO

Com a TASK_04 concluída, o backend agora expõe:
- Campos clínicos em `pacientes` (tipo_sanguineo, peso_kg, altura_cm, alergias, comorbidades, medicamentos_uso_continuo, observacoes_clinicas)
- `resultado` + `cid_10` em `solicitacoes`
- CRUD completo de `atendimentos` (linha do tempo clínica)

Esta task expõe esses dados no frontend em **dois arquivos**:

1. **`app/frontend/src/pages/gestor/PerfilPaciente.jsx`** (617 linhas)
   - Navegação por abas: Dados | Solicitações | Linha do Tempo
   - Seção "Dados Clínicos" (visualização + edição)
   - `CardSolicitacao` exibe resultado + cid_10
   - Modal Atualizar Status ganha campos resultado + cid_10
   - Aba "Linha do Tempo" com CRUD de atendimentos + modal

2. **`app/frontend/src/pages/gestor/PainelMedico.jsx`**
   - Exibe campos clínicos do paciente (read-only)
   - `CardSolicitacaoMedico` exibe resultado + cid_10
   - Nova seção "Linha do Tempo" (read-only)

---

## LEITURA OBRIGATÓRIA

Ler os arquivos completos antes de qualquer modificação:
- `app/frontend/src/pages/gestor/PerfilPaciente.jsx`
- `app/frontend/src/pages/gestor/PainelMedico.jsx`
- `app/frontend/src/utils/statusHelper.js` (para confirmar que `formatarDataBR` existe)

---

## ARQUIVO 1: PerfilPaciente.jsx

### 1.1 — Novos estados (adicionar junto aos existentes, após linha 186)

```jsx
// ── Estados da Linha do Tempo (atendimentos clínicos) ──
const [atendimentos, setAtendimentos] = useState([]);
const [loadingAtendimentos, setLoadingAtendimentos] = useState(false);
const [modalAtendimentoAberto, setModalAtendimentoAberto] = useState(false);
const [enviandoAtendimento, setEnviandoAtendimento] = useState(false);
// null = criar novo; objeto = editar existente
const [atendimentoEditando, setAtendimentoEditando] = useState(null);
const [deletandoAtendimento, setDeletandoAtendimento] = useState(null);
const [formAtendimento, setFormAtendimento] = useState({
  data_atendimento: '', unidade: '', tipo_unidade: '',
  especialidade: '', profissional: '',
  cid_10_principal: '', cid_10_secundario: '',
  conduta: '', observacoes: '',
});

// ── Estado da aba ativa (navegação por tabs) ──
// Valores: 'dados' | 'solicitacoes' | 'linha_do_tempo'
const [abaAtiva, setAbaAtiva] = useState('dados');
```

---

### 1.2 — Estender formDados e iniciarEdicaoDados

**Localizar** a declaração `const [formDados` (linha ~180) e **substituir** pelo estado estendido:

```jsx
// ANTES:
const [formDados, setFormDados] = useState({ nome: '', telefone: '', email: '' });

// DEPOIS:
const [formDados, setFormDados] = useState({
  // Dados pessoais
  nome: '', telefone: '', email: '',
  // Dados clínicos
  tipo_sanguineo: '', peso_kg: '', altura_cm: '',
  alergias: '', comorbidades: '',
  medicamentos_uso_continuo: '', observacoes_clinicas: '',
});
```

**Localizar** a função `iniciarEdicaoDados` (linha ~198) e **substituir** o corpo:

```jsx
// ANTES:
const iniciarEdicaoDados = () => {
  setFormDados({
    nome: paciente?.nome || '',
    telefone: paciente?.telefone || '',
    email: paciente?.email || '',
  });
  setEditandoDados(true);
};

// DEPOIS:
const iniciarEdicaoDados = () => {
  // Pré-preenche dados pessoais E dados clínicos do estado atual do paciente
  setFormDados({
    nome:                      paciente?.nome || '',
    telefone:                  paciente?.telefone || '',
    email:                     paciente?.email || '',
    tipo_sanguineo:            paciente?.tipo_sanguineo || '',
    peso_kg:                   paciente?.peso_kg || '',
    altura_cm:                 paciente?.altura_cm || '',
    alergias:                  paciente?.alergias || '',
    comorbidades:              paciente?.comorbidades || '',
    medicamentos_uso_continuo: paciente?.medicamentos_uso_continuo || '',
    observacoes_clinicas:      paciente?.observacoes_clinicas || '',
  });
  setEditandoDados(true);
};
```

> A função `handleSalvarDados` NÃO precisa de alteração — ela já envia `formDados`
> inteiro para `PUT /gestor/paciente/:id`. Com o backend atualizado (TASK_04),
> os novos campos serão aceitos automaticamente.

---

### 1.3 — Estender formStatus e abrirModalStatus

**Localizar** `const [formStatus` (linha ~177) e **substituir**:

```jsx
// ANTES:
const [formStatus, setFormStatus] = useState({ status_novo: 'em_analise', observacao: '' });

// DEPOIS:
const [formStatus, setFormStatus] = useState({
  status_novo: 'em_analise',
  observacao: '',
  resultado: '',   // resultado clínico do exame/consulta (opcional)
  cid_10: '',      // CID-10 registrado no momento da conclusão (opcional)
});
```

**Localizar** a função `abrirModalStatus` (linha ~273) e **substituir**:

```jsx
// ANTES:
const abrirModalStatus = (sol) => {
  setSolicitacaoSelecionada(sol);
  setFormStatus({ status_novo: sol.status, observacao: '' });
  setModalStatusAberto(true);
};

// DEPOIS:
const abrirModalStatus = (sol) => {
  setSolicitacaoSelecionada(sol);
  // Pré-carrega resultado e cid_10 existentes para edição
  setFormStatus({
    status_novo: sol.status,
    observacao: '',
    resultado: sol.resultado || '',
    cid_10: sol.cid_10 || '',
  });
  setModalStatusAberto(true);
};
```

---

### 1.4 — Estender handleAtualizarStatus para salvar resultado/CID-10

**Localizar** `handleAtualizarStatus` (linha ~279) e **substituir** o bloco `try`:

```jsx
// ANTES:
try {
  await api.put(`/gestor/solicitacao/${solicitacaoSelecionada.id}/status`, formStatus);
  toast.success('Status atualizado com sucesso!');
  setModalStatusAberto(false);
  carregarPaciente();
}

// DEPOIS:
try {
  await api.put(`/gestor/solicitacao/${solicitacaoSelecionada.id}/status`, {
    status_novo: formStatus.status_novo,
    observacao: formStatus.observacao,
  });

  // Se o gestor preencheu resultado ou cid_10, salva em chamada separada
  if (formStatus.resultado || formStatus.cid_10) {
    await api.patch(`/gestor/solicitacao/${solicitacaoSelecionada.id}/resultado`, {
      resultado: formStatus.resultado || undefined,
      cid_10: formStatus.cid_10 || undefined,
    });
  }

  toast.success('Status atualizado com sucesso!');
  setModalStatusAberto(false);
  carregarPaciente();
}
```

---

### 1.5 — Novas funções de atendimentos (inserir após handleEscalarUrgencia, antes de `if (loading)`)

```jsx
// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÕES: Linha do Tempo (Atendimentos Clínicos)
// Gerenciam o CRUD de atendimentos do paciente. Os dados são carregados
// uma vez no mount e recarregados após cada operação de escrita.
// ─────────────────────────────────────────────────────────────────────────────

const TIPO_UNIDADE_LABEL = {
  ubs:                  'UBS',
  ame:                  'AME',
  caps:                 'CAPS',
  centro_especialidades:'Centro de Especialidades',
  hospital:             'Hospital',
  pronto_socorro:       'Pronto-Socorro',
  outro:                'Outro',
};

const carregarAtendimentos = () => {
  setLoadingAtendimentos(true);
  api.get(`/gestor/paciente/${id}/atendimentos`)
    .then(r => setAtendimentos(r.data))
    .catch(() => toast.error('Erro ao carregar linha do tempo.'))
    .finally(() => setLoadingAtendimentos(false));
};

const resetFormAtendimento = () => {
  setFormAtendimento({
    data_atendimento: '', unidade: '', tipo_unidade: '',
    especialidade: '', profissional: '',
    cid_10_principal: '', cid_10_secundario: '',
    conduta: '', observacoes: '',
  });
};

const abrirModalNovoAtendimento = () => {
  setAtendimentoEditando(null);
  resetFormAtendimento();
  setModalAtendimentoAberto(true);
};

const abrirModalEditarAtendimento = (atendimento) => {
  setAtendimentoEditando(atendimento);
  setFormAtendimento({
    data_atendimento: atendimento.data_atendimento?.split('T')[0] || '',
    unidade:           atendimento.unidade || '',
    tipo_unidade:      atendimento.tipo_unidade || '',
    especialidade:     atendimento.especialidade || '',
    profissional:      atendimento.profissional || '',
    cid_10_principal:  atendimento.cid_10_principal || '',
    cid_10_secundario: atendimento.cid_10_secundario || '',
    conduta:           atendimento.conduta || '',
    observacoes:       atendimento.observacoes || '',
  });
  setModalAtendimentoAberto(true);
};

const handleSalvarAtendimento = async (e) => {
  e.preventDefault();
  setEnviandoAtendimento(true);
  try {
    if (atendimentoEditando) {
      await api.put(`/gestor/atendimento/${atendimentoEditando.id}`, formAtendimento);
      toast.success('Atendimento atualizado!');
    } else {
      await api.post(`/gestor/paciente/${id}/atendimento`, formAtendimento);
      toast.success('Atendimento registrado!');
    }
    setModalAtendimentoAberto(false);
    setAtendimentoEditando(null);
    resetFormAtendimento();
    carregarAtendimentos();
  } catch {
    toast.error('Erro ao salvar atendimento.');
  } finally {
    setEnviandoAtendimento(false);
  }
};

const handleDeletarAtendimento = async (atendimentoId) => {
  if (!window.confirm('Tem certeza que deseja remover este atendimento?')) return;
  setDeletandoAtendimento(atendimentoId);
  try {
    await api.delete(`/gestor/atendimento/${atendimentoId}`);
    toast.success('Atendimento removido.');
    carregarAtendimentos();
  } catch {
    toast.error('Erro ao remover atendimento.');
  } finally {
    setDeletandoAtendimento(null);
  }
};
```

---

### 1.6 — Adicionar useEffect para carregar atendimentos

**Localizar** `useEffect(() => { carregarPaciente(); }, [id]);` e **adicionar** logo abaixo:

```jsx
// Carrega a linha do tempo de atendimentos junto com os dados do paciente
useEffect(() => { carregarAtendimentos(); }, [id]);
```

---

### 1.7 — CardSolicitacao: exibir resultado e CID-10

**Localizar** o bloco após `{sol.observacao_paciente &&...}` e **antes** de `</div>` (que fecha o `flex-1`).
Inserir o bloco de resultado/cid_10 assim:

```jsx
{/* Resultado clínico — exibido quando a solicitação já tem resultado registrado */}
{(sol.resultado || sol.cid_10) && (
  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
    {sol.cid_10 && (
      <p className="text-xs font-bold text-emerald-700">
        <span className="material-symbols-outlined text-[14px] align-middle mr-1">vaccines</span>
        CID-10: {sol.cid_10}
      </p>
    )}
    {sol.resultado && (
      <p className="text-xs text-emerald-800 font-medium">{sol.resultado}</p>
    )}
  </div>
)}
```

Posição exata no JSX (dentro do CardSolicitacao, `div.flex-1`):
- Depois de: `{sol.observacao_paciente && (...)}` 
- Antes de: `</div>` (que fecha `<div className="flex-1 min-w-0">`)

---

### 1.8 — Navegação por abas (inserir após o cabeçalho, antes do Card de dados pessoais)

**Localizar** a linha `{/* ── Card de dados: leitura e edição inline ── */}` (linha ~341)
e **inserir antes** dela:

```jsx
{/* ── Navegação por Abas ── */}
<div className="flex border-b border-surface-variant mb-6 overflow-x-auto no-scrollbar">
  {[
    { id: 'dados',          label: 'Dados',          icon: 'person' },
    { id: 'solicitacoes',   label: 'Solicitações',    icon: 'receipt_long' },
    { id: 'linha_do_tempo', label: 'Linha do Tempo',  icon: 'timeline' },
  ].map(tab => (
    <button
      key={tab.id}
      onClick={() => setAbaAtiva(tab.id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap
        ${abaAtiva === tab.id
          ? 'border-primary text-primary'
          : 'border-transparent text-on-surface-variant hover:text-on-surface'
        }`}
    >
      <span className="material-symbols-outlined text-base">{tab.icon}</span>
      {tab.label}
    </button>
  ))}
</div>
```

---

### 1.9 — Condicionais de aba para o conteúdo existente

Envolver as seções existentes com condicionais de aba:

**Dados pessoais card** (linha ~342 até ~398) — envolver com:
```jsx
{abaAtiva === 'dados' && (
  <>
    {/* ... card dados pessoais EXISTENTE, sem modificação interna ... */}
  </>
)}
```

**Seção Solicitações** (cabeçalho + IIFE, linhas ~400 até ~469) — envolver com:
```jsx
{abaAtiva === 'solicitacoes' && (
  <>
    {/* ... cabeçalho + cards de solicitações EXISTENTES ... */}
  </>
)}
```

---

### 1.10 — Seção "Dados Clínicos" (dentro do condicional `abaAtiva === 'dados'`)

Inserir **após** o card de dados pessoais e **antes** do `</>` que fecha o wrapper de aba 'dados':

```jsx
{/* ── Card: Dados Clínicos ── */}
{abaAtiva === 'dados' && !editandoDados && (
  <div className="bg-surface-container-lowest rounded-2xl md:rounded-3xl border border-surface-variant p-5 md:p-8 mt-4">
    <h2 className="text-lg font-extrabold text-on-background mb-5">Dados Clínicos</h2>

    {/* Vitais básicos */}
    <div className="grid grid-cols-3 gap-4 mb-5">
      <div>
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Tipo Sanguíneo</p>
        <p className="font-bold text-on-background">{paciente?.tipo_sanguineo || '---'}</p>
      </div>
      <div>
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Peso</p>
        <p className="font-bold text-on-background">{paciente?.peso_kg ? `${paciente.peso_kg} kg` : '---'}</p>
      </div>
      <div>
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Altura</p>
        <p className="font-bold text-on-background">{paciente?.altura_cm ? `${paciente.altura_cm} cm` : '---'}</p>
      </div>
    </div>

    {/* Campos clínicos críticos — em destaque visual */}
    <div className="space-y-4">
      {[
        { label: 'Alergias', key: 'alergias', icon: 'warning', cor: 'amber' },
        { label: 'Comorbidades', key: 'comorbidades', icon: 'monitor_heart', cor: 'red' },
        { label: 'Medicamentos em uso contínuo', key: 'medicamentos_uso_continuo', icon: 'medication', cor: 'blue' },
        { label: 'Observações Clínicas', key: 'observacoes_clinicas', icon: 'note', cor: 'gray' },
      ].map(({ label, key, icon, cor }) => (
        <div key={key} className={`p-4 rounded-xl bg-${cor}-50 border border-${cor}-200`}>
          <p className={`text-xs font-bold text-${cor}-700 uppercase tracking-wider mb-1 flex items-center gap-1`}>
            <span className="material-symbols-outlined text-[14px]">{icon}</span>
            {label}
          </p>
          <p className={`text-sm font-medium text-${cor}-900`}>
            {paciente?.[key] || <span className="text-on-surface-variant italic font-normal">Não informado</span>}
          </p>
        </div>
      ))}
    </div>

    {/* O botão "Editar Dados" já no card de dados pessoais acima edita AMBOS os cards.
        Esta nota orienta o usuário a clicar nele. */}
    <p className="text-xs text-on-surface-variant mt-4 italic">
      Para editar dados clínicos, use o botão "Editar Dados" acima.
    </p>
  </div>
)}
```

> **ATENÇÃO:** As classes Tailwind com cor dinâmica (`bg-${cor}-50`) podem não 
> funcionar se o Tailwind não as indexou. Use condicionais explícitas ou substitua
> por um map de classes fixas:

```jsx
// Substitua o map acima por este, que usa classes fixas (Tailwind-safe):
{[
  {
    label: 'Alergias',
    key: 'alergias',
    icon: 'warning',
    wrapClass: 'bg-amber-50 border-amber-200',
    labelClass: 'text-amber-700',
    textClass: 'text-amber-900',
  },
  {
    label: 'Comorbidades',
    key: 'comorbidades',
    icon: 'monitor_heart',
    wrapClass: 'bg-red-50 border-red-200',
    labelClass: 'text-red-700',
    textClass: 'text-red-900',
  },
  {
    label: 'Medicamentos em uso contínuo',
    key: 'medicamentos_uso_continuo',
    icon: 'medication',
    wrapClass: 'bg-blue-50 border-blue-200',
    labelClass: 'text-blue-700',
    textClass: 'text-blue-900',
  },
  {
    label: 'Observações Clínicas',
    key: 'observacoes_clinicas',
    icon: 'note',
    wrapClass: 'bg-surface-container-high border-surface-variant',
    labelClass: 'text-on-surface-variant',
    textClass: 'text-on-background',
  },
].map(({ label, key, icon, wrapClass, labelClass, textClass }) => (
  <div key={key} className={`p-4 rounded-xl border ${wrapClass}`}>
    <p className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${labelClass}`}>
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {label}
    </p>
    <p className={`text-sm font-medium ${textClass}`}>
      {paciente?.[key] || <span className="text-on-surface-variant italic font-normal">Não informado</span>}
    </p>
  </div>
))}
```

---

### 1.11 — Seção de edição: adicionar campos clínicos ao form

**Localizar** o `<form onSubmit={handleSalvarDados}` (linha ~352) e **adicionar** um novo bloco de campos clínicos **após** o grid de 3 colunas (nome, telefone, email) e **antes** dos botões:

```jsx
{/* Separador visual entre dados pessoais e clínicos */}
<div className="border-t border-surface-variant pt-5">
  <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider mb-4">
    Dados Clínicos
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    <label className="space-y-2">
      <span className="text-sm font-bold text-on-surface-variant">Tipo Sanguíneo</span>
      <select value={formDados.tipo_sanguineo}
        onChange={e => setFormDados(p => ({ ...p, tipo_sanguineo: e.target.value }))}
        className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
        <option value="">Não informado</option>
        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </label>
    <label className="space-y-2">
      <span className="text-sm font-bold text-on-surface-variant">Peso (kg)</span>
      <input type="number" step="0.1" min="1" max="300"
        placeholder="Ex: 72.5"
        value={formDados.peso_kg}
        onChange={e => setFormDados(p => ({ ...p, peso_kg: e.target.value }))}
        className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
    </label>
    <label className="space-y-2">
      <span className="text-sm font-bold text-on-surface-variant">Altura (cm)</span>
      <input type="number" min="50" max="250"
        placeholder="Ex: 175"
        value={formDados.altura_cm}
        onChange={e => setFormDados(p => ({ ...p, altura_cm: e.target.value }))}
        className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
    </label>
  </div>
  <div className="space-y-4">
    <label className="block space-y-2">
      <span className="text-sm font-bold text-on-surface-variant">Alergias</span>
      <textarea rows={2}
        placeholder="Ex: Penicilina, Dipirona, látex"
        value={formDados.alergias}
        onChange={e => setFormDados(p => ({ ...p, alergias: e.target.value }))}
        className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
    </label>
    <label className="block space-y-2">
      <span className="text-sm font-bold text-on-surface-variant">Comorbidades</span>
      <textarea rows={2}
        placeholder="Ex: Diabetes tipo 2, Hipertensão arterial"
        value={formDados.comorbidades}
        onChange={e => setFormDados(p => ({ ...p, comorbidades: e.target.value }))}
        className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
    </label>
    <label className="block space-y-2">
      <span className="text-sm font-bold text-on-surface-variant">Medicamentos de uso contínuo</span>
      <textarea rows={2}
        placeholder="Ex: Metformina 500mg 2x/dia, Losartana 50mg"
        value={formDados.medicamentos_uso_continuo}
        onChange={e => setFormDados(p => ({ ...p, medicamentos_uso_continuo: e.target.value }))}
        className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
    </label>
    <label className="block space-y-2">
      <span className="text-sm font-bold text-on-surface-variant">Observações Clínicas</span>
      <textarea rows={3}
        placeholder="Anotações da equipe sobre saúde geral do paciente"
        value={formDados.observacoes_clinicas}
        onChange={e => setFormDados(p => ({ ...p, observacoes_clinicas: e.target.value }))}
        className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
    </label>
  </div>
</div>
```

---

### 1.12 — Modal Atualizar Status: adicionar campos resultado + CID-10

**Localizar** o `<textarea>` de observação no modal Atualizar Status (linha ~568) e **inserir após** o bloco da observação (após o `</div>` que fecha o label de observação):

```jsx
{/* Resultado clínico — opcional; relevante quando status é concluido */}
<div className="space-y-2">
  <label className="text-sm font-bold text-on-surface-variant">
    Resultado (opcional)
  </label>
  <textarea rows={3}
    placeholder="Ex: Laudado pelo radiologista Dr. Silva — sem alterações significativas"
    value={formStatus.resultado}
    onChange={e => setFormStatus(p => ({ ...p, resultado: e.target.value }))}
    className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
</div>
<div className="space-y-2">
  <label className="text-sm font-bold text-on-surface-variant">
    CID-10 (opcional)
  </label>
  <input
    type="text"
    maxLength={10}
    placeholder="Ex: I10, E11, J45.0"
    value={formStatus.cid_10}
    onChange={e => setFormStatus(p => ({ ...p, cid_10: e.target.value.toUpperCase() }))}
    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
  <p className="text-xs text-on-surface-variant">Código de diagnóstico internacional. Preencha ao concluir.</p>
</div>
```

---

### 1.13 — Aba Linha do Tempo (inserir dentro do condicional `abaAtiva === 'linha_do_tempo'`)

Após os condicionais de aba existentes (solicitações), adicionar:

```jsx
{/* ── Aba: Linha do Tempo (Atendimentos Clínicos) ── */}
{abaAtiva === 'linha_do_tempo' && (
  <div>
    {/* Cabeçalho da seção */}
    <div className="flex items-center justify-between mb-4 md:mb-6">
      <div>
        <h2 className="text-lg md:text-2xl font-extrabold text-on-background">Linha do Tempo</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Atendimentos em qualquer unidade — UBS, AME, CAPS, hospital, especialidades
        </p>
      </div>
      <button
        onClick={abrirModalNovoAtendimento}
        className="h-10 px-4 md:h-12 md:px-6 bg-primary text-white font-bold rounded-xl md:rounded-2xl shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-sm"
      >
        <span className="material-symbols-outlined text-lg">add</span>
        Registrar Atendimento
      </button>
    </div>

    {/* Estado de carregamento */}
    {loadingAtendimentos && (
      <div className="space-y-3 animate-pulse">
        {[1,2,3].map(n => (
          <div key={n} className="h-32 bg-surface-container-low rounded-2xl" />
        ))}
      </div>
    )}

    {/* Lista de atendimentos */}
    {!loadingAtendimentos && atendimentos.length > 0 && (
      <div className="space-y-3 md:space-y-4">
        {atendimentos.map(at => (
          <div key={at.id} className="bg-surface-container-lowest rounded-xl md:rounded-2xl border border-surface-variant p-4 md:p-6">
            {/* Cabeçalho do card: data + unidade + ações */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-bold text-on-surface-variant">
                    {formatarDataBR(at.data_atendimento)}
                  </span>
                  {at.tipo_unidade && (
                    <span className="text-xs px-2 py-0.5 bg-surface-container-high rounded font-bold text-on-surface-variant">
                      {TIPO_UNIDADE_LABEL[at.tipo_unidade] || at.tipo_unidade}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-on-background truncate">{at.unidade}</h3>
                {at.especialidade && (
                  <p className="text-sm text-on-surface-variant">
                    {at.especialidade}
                    {at.profissional ? ` • Dr(a). ${at.profissional}` : ''}
                  </p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => abrirModalEditarAtendimento(at)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-high transition-colors"
                  title="Editar atendimento"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button
                  onClick={() => handleDeletarAtendimento(at.id)}
                  disabled={deletandoAtendimento === at.id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-600 disabled:opacity-50 transition-colors"
                  title="Remover atendimento"
                >
                  <span className="material-symbols-outlined text-base">
                    {deletandoAtendimento === at.id ? 'hourglass_empty' : 'delete'}
                  </span>
                </button>
              </div>
            </div>

            {/* CID-10 */}
            {(at.cid_10_principal || at.cid_10_secundario) && (
              <div className="flex gap-2 flex-wrap mb-3">
                {at.cid_10_principal && (
                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold">
                    CID: {at.cid_10_principal}
                  </span>
                )}
                {at.cid_10_secundario && (
                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold">
                    CID 2°: {at.cid_10_secundario}
                  </span>
                )}
              </div>
            )}

            {/* Conduta */}
            {at.conduta && (
              <div className="mb-2">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Conduta</p>
                <p className="text-sm text-on-background">{at.conduta}</p>
              </div>
            )}

            {at.observacoes && (
              <p className="text-xs text-on-surface-variant italic mt-2">{at.observacoes}</p>
            )}

            {/* Rodapé de auditoria */}
            {at.registrado_por_nome && (
              <p className="text-xs text-on-surface-variant mt-3 pt-3 border-t border-surface-variant">
                Registrado por: {at.registrado_por_nome}
              </p>
            )}
          </div>
        ))}
      </div>
    )}

    {/* Estado vazio */}
    {!loadingAtendimentos && atendimentos.length === 0 && (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">timeline</span>
        <p className="text-on-surface-variant font-medium">Nenhum atendimento registrado ainda.</p>
        <p className="text-xs text-on-surface-variant mt-1">
          Clique em "Registrar Atendimento" para adicionar o primeiro registro clínico.
        </p>
      </div>
    )}
  </div>
)}
```

---

### 1.14 — Modal: Atendimento (Novo / Editar)

Inserir **após** o Modal Escalar Urgência e **antes** do `</GestorLayout>`:

```jsx
{/* ── Modal: Registrar / Editar Atendimento ── */}
{modalAtendimentoAberto && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalAtendimentoAberto(false)} />
    <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
      <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center flex-shrink-0">
        <h3 className="text-xl font-extrabold">
          {atendimentoEditando ? 'Editar Atendimento' : 'Registrar Atendimento'}
        </h3>
        <button onClick={() => setModalAtendimentoAberto(false)}
          className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <form onSubmit={handleSalvarAtendimento} className="p-6 md:p-8 space-y-4 overflow-y-auto">
        {/* Linha 1: Data + Tipo de Unidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant">Data do atendimento*</label>
            <input required type="date"
              value={formAtendimento.data_atendimento}
              onChange={e => setFormAtendimento(p => ({ ...p, data_atendimento: e.target.value }))}
              className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant">Tipo de unidade</label>
            <select
              value={formAtendimento.tipo_unidade}
              onChange={e => setFormAtendimento(p => ({ ...p, tipo_unidade: e.target.value }))}
              className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
              <option value="">Selecione...</option>
              <option value="ubs">UBS</option>
              <option value="ame">AME</option>
              <option value="caps">CAPS</option>
              <option value="centro_especialidades">Centro de Especialidades</option>
              <option value="hospital">Hospital</option>
              <option value="pronto_socorro">Pronto-Socorro</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </div>

        {/* Unidade (nome livre) */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface-variant">Nome da unidade*</label>
          <input required
            placeholder="Ex: UBS Vila Industrial, AME Zona Leste, Hospital Municipal de SJC"
            value={formAtendimento.unidade}
            onChange={e => setFormAtendimento(p => ({ ...p, unidade: e.target.value }))}
            className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
        </div>

        {/* Especialidade + Profissional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant">Especialidade</label>
            <input
              placeholder="Ex: Cardiologia, Ortopedia"
              value={formAtendimento.especialidade}
              onChange={e => setFormAtendimento(p => ({ ...p, especialidade: e.target.value }))}
              className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant">Profissional</label>
            <input
              placeholder="Ex: Dr(a). Nome do médico"
              value={formAtendimento.profissional}
              onChange={e => setFormAtendimento(p => ({ ...p, profissional: e.target.value }))}
              className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
          </div>
        </div>

        {/* CID-10 principal + secundário */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant">CID-10 Principal</label>
            <input
              maxLength={10}
              placeholder="Ex: I10, E11, J45.0"
              value={formAtendimento.cid_10_principal}
              onChange={e => setFormAtendimento(p => ({ ...p, cid_10_principal: e.target.value.toUpperCase() }))}
              className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant">CID-10 Secundário</label>
            <input
              maxLength={10}
              placeholder="Ex: Z87.0"
              value={formAtendimento.cid_10_secundario}
              onChange={e => setFormAtendimento(p => ({ ...p, cid_10_secundario: e.target.value.toUpperCase() }))}
              className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
          </div>
        </div>

        {/* Conduta */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface-variant">Conduta</label>
          <textarea rows={3}
            placeholder="O que foi prescrito, encaminhado ou decidido neste atendimento"
            value={formAtendimento.conduta}
            onChange={e => setFormAtendimento(p => ({ ...p, conduta: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface-variant">Observações</label>
          <textarea rows={2}
            placeholder="Notas adicionais sobre o atendimento"
            value={formAtendimento.observacoes}
            onChange={e => setFormAtendimento(p => ({ ...p, observacoes: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setModalAtendimentoAberto(false)}
            className="flex-1 h-12 rounded-2xl border border-outline font-bold">
            Cancelar
          </button>
          <button type="submit" disabled={enviandoAtendimento}
            className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">
            {enviandoAtendimento ? 'Salvando...' : (atendimentoEditando ? 'Salvar Alterações' : 'Registrar')}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

---

## ARQUIVO 2: PainelMedico.jsx

### 2.1 — Novos estados

Adicionar junto aos estados existentes:

```jsx
// Linha do tempo de atendimentos — carregada junto com o paciente ativo
const [atendimentos, setAtendimentos] = useState([]);
const [loadingAtendimentos, setLoadingAtendimentos] = useState(false);
```

---

### 2.2 — Mapa TIPO_UNIDADE_LABEL (inserir junto aos mapas STATUS_BADGE e STATUS_LABEL já existentes)

```jsx
const TIPO_UNIDADE_LABEL = {
  ubs:                  'UBS',
  ame:                  'AME',
  caps:                 'CAPS',
  centro_especialidades:'Centro de Especialidades',
  hospital:             'Hospital',
  pronto_socorro:       'Pronto-Socorro',
  outro:                'Outro',
};
```

---

### 2.3 — CardSolicitacaoMedico: adicionar resultado + CID-10

**Localizar** `function CardSolicitacaoMedico` e **adicionar** antes do `</div>` que fecha o bloco de informações do card (após observacao_paciente, antes do botão "Ver histórico"):

```jsx
{/* Resultado clínico — exibido em modo read-only quando presente */}
{(sol.resultado || sol.cid_10) && (
  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
    {sol.cid_10 && (
      <p className="text-xs font-bold text-emerald-700">
        CID-10: {sol.cid_10}
      </p>
    )}
    {sol.resultado && (
      <p className="text-xs text-emerald-800 font-medium">{sol.resultado}</p>
    )}
  </div>
)}
```

---

### 2.4 — Carregar atendimentos quando pacienteAtivo muda

**Localizar** o `useEffect` que carrega o paciente ativo (o que chama `api.get(/gestor/paciente/${pacienteAtivo.id})`).
**Adicionar** dentro desse useEffect, após o carregamento do paciente, a busca de atendimentos:

```jsx
// No mesmo useEffect que carrega pacienteAtivo, após carregar solicitações/histórico:
setLoadingAtendimentos(true);
api.get(`/gestor/paciente/${pacienteAtivo.id}/atendimentos`)
  .then(r => setAtendimentos(r.data))
  .catch(() => {}) // Falha silenciosa — atendimentos são complementares
  .finally(() => setLoadingAtendimentos(false));
```

> Se o useEffect usa `async/await`, adicione o fetch como chamada separada
> (sem await, para não bloquear o render principal). Ex:
> ```js
> api.get(`/gestor/paciente/${pacienteAtivo.id}/atendimentos`)
>   .then(r => setAtendimentos(r.data))
>   .catch(() => {})
>   .finally(() => setLoadingAtendimentos(false));
> ```

Também **resetar** atendimentos ao limpar o paciente ativo:
```jsx
// No handler que chama setPacienteAtivo(null) ou similar:
setAtendimentos([]);
```

---

### 2.5 — Seção de Dados Clínicos no PainelMedico (read-only)

**Localizar** o bloco que exibe os dados do paciente ativo (CRA, nome, UBS, etc.) e **inserir após** esse bloco e **antes** das solicitações:

```jsx
{/* ── Dados Clínicos (read-only) ── */}
{(pacienteAtivo?.tipo_sanguineo || pacienteAtivo?.alergias || pacienteAtivo?.comorbidades || pacienteAtivo?.medicamentos_uso_continuo) && (
  <div className="bg-surface-container-lowest rounded-xl md:rounded-2xl border border-surface-variant p-4 md:p-6 mb-4">
    <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider mb-4">
      Dados Clínicos
    </h3>

    {/* Vitais */}
    {(pacienteAtivo?.tipo_sanguineo || pacienteAtivo?.peso_kg || pacienteAtivo?.altura_cm) && (
      <div className="flex gap-4 flex-wrap mb-4">
        {pacienteAtivo?.tipo_sanguineo && (
          <div className="px-3 py-2 bg-surface-container-high rounded-xl">
            <p className="text-xs font-bold text-on-surface-variant">Tipo Sanguíneo</p>
            <p className="font-extrabold text-on-background text-lg">{pacienteAtivo.tipo_sanguineo}</p>
          </div>
        )}
        {pacienteAtivo?.peso_kg && (
          <div className="px-3 py-2 bg-surface-container-high rounded-xl">
            <p className="text-xs font-bold text-on-surface-variant">Peso</p>
            <p className="font-bold text-on-background">{pacienteAtivo.peso_kg} kg</p>
          </div>
        )}
        {pacienteAtivo?.altura_cm && (
          <div className="px-3 py-2 bg-surface-container-high rounded-xl">
            <p className="text-xs font-bold text-on-surface-variant">Altura</p>
            <p className="font-bold text-on-background">{pacienteAtivo.altura_cm} cm</p>
          </div>
        )}
      </div>
    )}

    <div className="space-y-3">
      {pacienteAtivo?.alergias && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-bold text-amber-700 mb-1">
            ⚠ Alergias
          </p>
          <p className="text-sm text-amber-900 font-medium">{pacienteAtivo.alergias}</p>
        </div>
      )}
      {pacienteAtivo?.comorbidades && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs font-bold text-red-700 mb-1">Comorbidades</p>
          <p className="text-sm text-red-900 font-medium">{pacienteAtivo.comorbidades}</p>
        </div>
      )}
      {pacienteAtivo?.medicamentos_uso_continuo && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs font-bold text-blue-700 mb-1">Medicamentos em uso</p>
          <p className="text-sm text-blue-900 font-medium">{pacienteAtivo.medicamentos_uso_continuo}</p>
        </div>
      )}
      {pacienteAtivo?.observacoes_clinicas && (
        <div className="p-3 bg-surface-container-high rounded-xl">
          <p className="text-xs font-bold text-on-surface-variant mb-1">Observações Clínicas</p>
          <p className="text-sm text-on-background">{pacienteAtivo.observacoes_clinicas}</p>
        </div>
      )}
    </div>
  </div>
)}
```

---

### 2.6 — Seção Linha do Tempo no PainelMedico (read-only, após solicitações)

Após o bloco de solicitações do paciente ativo, inserir:

```jsx
{/* ── Linha do Tempo (read-only no Painel Médico) ── */}
{(loadingAtendimentos || atendimentos.length > 0) && (
  <div className="mt-6">
    <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
      <span className="material-symbols-outlined text-base">timeline</span>
      Linha do Tempo
    </h3>

    {loadingAtendimentos && (
      <div className="space-y-3 animate-pulse">
        <div className="h-20 bg-surface-container-low rounded-xl" />
        <div className="h-20 bg-surface-container-low rounded-xl" />
      </div>
    )}

    {!loadingAtendimentos && (
      <div className="space-y-3">
        {atendimentos.map(at => (
          <div key={at.id} className="bg-surface-container-lowest rounded-xl border border-surface-variant p-4">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-bold text-on-surface-variant">
                {formatarDataBR(at.data_atendimento)}
              </span>
              {at.tipo_unidade && (
                <span className="text-xs px-2 py-0.5 bg-surface-container-high rounded font-bold text-on-surface-variant">
                  {TIPO_UNIDADE_LABEL[at.tipo_unidade] || at.tipo_unidade}
                </span>
              )}
            </div>
            <p className="font-bold text-on-background">{at.unidade}</p>
            {at.especialidade && (
              <p className="text-sm text-on-surface-variant">
                {at.especialidade}{at.profissional ? ` • Dr(a). ${at.profissional}` : ''}
              </p>
            )}
            {(at.cid_10_principal || at.cid_10_secundario) && (
              <div className="flex gap-2 mt-2">
                {at.cid_10_principal && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">CID: {at.cid_10_principal}</span>}
                {at.cid_10_secundario && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">CID 2°: {at.cid_10_secundario}</span>}
              </div>
            )}
            {at.conduta && <p className="text-sm text-on-background mt-2">{at.conduta}</p>}
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

---

## ORDEM DE EXECUÇÃO

1. Ler ambos os arquivos completos (`PerfilPaciente.jsx` e `PainelMedico.jsx`)
2. Aplicar todas as modificações em `PerfilPaciente.jsx` (seções 1.1 a 1.14)
3. Aplicar todas as modificações em `PainelMedico.jsx` (seções 2.1 a 2.6)
4. Verificar que nenhum arquivo tem erro de sintaxe (parênteses, chaves, JSX fechando corretamente)
5. Verificar que `carregarAtendimentos` referencia `id` (de `useParams`) corretamente no PerfilPaciente

---

## RESTRIÇÕES

- NÃO modificar nenhum arquivo backend
- NÃO modificar rotas em App.jsx
- NÃO criar novos arquivos — apenas modificar os dois listados
- Comentários obrigatórios em todos os blocos novos (padrão CLAUDE.md)
- **Atenção especial:** confirmar que `TIPO_UNIDADE_LABEL` está acessível dentro de `CardSolicitacaoMedico` em PainelMedico.jsx (mover para fora do componente principal se necessário, como constante no topo do arquivo)

---

## STATUS DE RETORNO

Gerar `REPORT_05_frontend_clinico.md` na raiz com:

```
# REPORT 05 — Frontend Clínico
**De:** Antigravity Agent
**Para:** Claude Cowork (Arquiteto)
**Data:** [data]

## Arquivos modificados
- app/frontend/src/pages/gestor/PerfilPaciente.jsx
- app/frontend/src/pages/gestor/PainelMedico.jsx

## Diff PerfilPaciente.jsx
[Diff completo]

## Diff PainelMedico.jsx
[Diff completo]

## Verificações
- [ ] Aba "Dados" exibe dados pessoais + dados clínicos
- [ ] Aba "Solicitações" exibe cards com resultado/cid_10 quando presentes
- [ ] Aba "Linha do Tempo" lista atendimentos e abre modal para criar/editar
- [ ] Modal de atendimento valida campos obrigatórios (data + unidade)
- [ ] Modal Atualizar Status tem campos resultado e cid_10
- [ ] PainelMedico exibe dados clínicos (read-only)
- [ ] PainelMedico exibe linha do tempo (read-only)
- [ ] Nenhum erro de sintaxe

## Pendências
[Qualquer desvio do escopo]
```
