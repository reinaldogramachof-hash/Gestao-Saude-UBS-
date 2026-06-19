# TASK_23 — Regulação e Vigilância: Backend Completo + Cleanup de Módulos
## Para o Agente Antigravity

> **Prioridade:** 🔴 Alta — segurança (ubs_id ausente nas tabelas) + funcionalidade core da banca
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19
> **Deadline:** Antes da banca — 25/06/2026
>
> **Arquivos alterados:**
> - `app/backend/src/db/migrations/018_add_ubs_gestor_solicitacao_to_encaminhamentos.js` (novo)
> - `app/backend/src/db/migrations/019_add_ubs_gestor_to_notificacoes_vigilancia.js` (novo)
> - `app/backend/src/routes/gestor.js` (6 novas rotas)
> - `app/frontend/src/App.jsx` (cleanup + rota Vigilância)
> - `app/frontend/src/components/gestor/SideNavGestor.jsx` (cleanup)
> - `app/frontend/src/pages/gestor/RegulacaoGestor.jsx` (modal + PUT status)
> - `app/frontend/src/pages/gestor/VigilanciaGestor.jsx` (modal + PUT status + gerar alerta)
> - `app/frontend/src/pages/gestor/ComunicadosGestor.jsx` (ler router state)

---

## CONTEXTO E DECISÕES ARQUITETURAIS

Os módulos Transporte Sanitário e Serviço Social foram **descartados** por escopo e risco LGPD.
As migrations das tabelas `transporte_sanitario` e `casos_sociais` existem no banco e ficam —
nenhuma migração de DROP será executada. Apenas removemos as referências no frontend.

Os módulos **Regulação** e **Vigilância** são implementados integralmente.

**Problema de segurança crítico nas migrations existentes:** As tabelas `encaminhamentos` e
`notificacoes_vigilancia` foram criadas sem `ubs_id`. Sem essa coluna, um gestor da UBS A
consegue ver dados da UBS B, violando o isolamento multi-tenant. As migrations 018 e 019
corrigem isso.

**Bridge Regulação ↔ Solicitações:** Quando o gestor cria um encaminhamento vinculado a uma
`solicitacao_id`, o backend automaticamente atualiza `solicitacoes.status` para
`'aguardando_regulacao'` e registra em `historico_status`. Quando o encaminhamento é marcado
como `REALIZADO`, a solicitação vai para `'concluido'`. O paciente vê o progresso normalmente
no seu portal — sem tela nova no portal do paciente.

---

## ITEM 1 — Migration 018: colunas de segurança em `encaminhamentos`

Criar arquivo `app/backend/src/db/migrations/018_add_ubs_gestor_solicitacao_to_encaminhamentos.js`:

```js
// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 018 — Adiciona isolamento multi-tenant à tabela encaminhamentos.
//
// PROBLEMA CORRIGIDO: A migration original (20260618030419) criou a tabela sem
// ubs_id, permitindo que gestores de UBSs diferentes vissem os mesmos dados.
//
// NOVAS COLUNAS:
//   ubs_id        — isolamento por UBS (filtragem em todas as queries)
//   gestor_id     — rastreabilidade de quem criou o encaminhamento
//   solicitacao_id — bridge opcional com a tabela solicitacoes (NULL = avulso)
//   atualizado_em — timestamp de última modificação para auditoria
// ─────────────────────────────────────────────────────────────────────────────
exports.up = async function(knex) {
  await knex.schema.alterTable('encaminhamentos', table => {
    // FK para UBS — isola dados por unidade (pode ser NULL em registros legados)
    table.integer('ubs_id').unsigned().nullable().references('id').inTable('ubs').onDelete('CASCADE');
    // FK para gestor que criou — SET NULL se gestor for removido do sistema
    table.integer('gestor_id').unsigned().nullable().references('id').inTable('usuarios_gestores').onDelete('SET NULL');
    // Bridge opcional com solicitacoes — permite o ciclo de status automático
    table.integer('solicitacao_id').unsigned().nullable().references('id').inTable('solicitacoes').onDelete('SET NULL');
    // Timestamp de última atualização
    table.timestamp('atualizado_em').defaultTo(knex.fn.now());
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('encaminhamentos', table => {
    table.dropColumn('ubs_id');
    table.dropColumn('gestor_id');
    table.dropColumn('solicitacao_id');
    table.dropColumn('atualizado_em');
  });
};
```

---

## ITEM 2 — Migration 019: colunas de segurança em `notificacoes_vigilancia`

Criar arquivo `app/backend/src/db/migrations/019_add_ubs_gestor_to_notificacoes_vigilancia.js`:

```js
// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 019 — Adiciona isolamento multi-tenant à tabela notificacoes_vigilancia.
//
// MESMO PROBLEMA DA 018: tabela criada sem ubs_id na migration original.
// ─────────────────────────────────────────────────────────────────────────────
exports.up = async function(knex) {
  await knex.schema.alterTable('notificacoes_vigilancia', table => {
    table.integer('ubs_id').unsigned().nullable().references('id').inTable('ubs').onDelete('CASCADE');
    table.integer('gestor_id').unsigned().nullable().references('id').inTable('usuarios_gestores').onDelete('SET NULL');
    table.timestamp('atualizado_em').defaultTo(knex.fn.now());
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('notificacoes_vigilancia', table => {
    table.dropColumn('ubs_id');
    table.dropColumn('gestor_id');
    table.dropColumn('atualizado_em');
  });
};
```

**Após criar os dois arquivos, rodar:**
```bash
cd app/backend && npx knex migrate:latest
```

---

## ITEM 3 — Backend: 6 novas rotas em `gestor.js`

Adicionar ao final de `app/backend/src/routes/gestor.js`, antes do `module.exports = router`:

### 3a. GET /gestor/encaminhamentos

```js
// ─── GET /api/gestor/encaminhamentos ─────────────────────────────────────────
// Lista todos os encaminhamentos da UBS do gestor logado.
// Ordenação: prioridade (VERMELHO > AMARELO > VERDE) e depois por data de solicitação ASC.
// Calcula dias_na_fila em SQL apenas para encaminhamentos com status AGUARDANDO_VAGA.
// Cancelados são excluídos da listagem principal.
router.get('/encaminhamentos', async (req, res) => {
  try {
    const ubsId = req.user.ubs_id;
    const encaminhamentos = await knex('encaminhamentos')
      .join('pacientes', 'encaminhamentos.paciente_id', 'pacientes.id')
      .where('encaminhamentos.ubs_id', ubsId)
      .whereNot('encaminhamentos.status', 'CANCELADO')
      .select(
        'encaminhamentos.*',
        'pacientes.nome as paciente_nome',
        // dias_na_fila calculado em SQL — só relevante enquanto aguarda vaga
        knex.raw(`
          CASE
            WHEN encaminhamentos.status = 'AGUARDANDO_VAGA'
            THEN EXTRACT(DAY FROM NOW() - encaminhamentos.data_solicitacao)::integer
            ELSE NULL
          END as dias_na_fila
        `)
      )
      .orderByRaw(`
        CASE encaminhamentos.prioridade
          WHEN 'VERMELHO' THEN 1
          WHEN 'AMARELO'  THEN 2
          WHEN 'VERDE'    THEN 3
          ELSE 4
        END ASC,
        encaminhamentos.data_solicitacao ASC
      `);

    return res.json(encaminhamentos);
  } catch (err) {
    console.error('[GET /gestor/encaminhamentos]', err);
    return res.status(500).json({ error: 'Erro ao buscar encaminhamentos.' });
  }
});
```

### 3b. POST /gestor/encaminhamento

```js
// ─── POST /api/gestor/encaminhamento ─────────────────────────────────────────
// Cria novo encaminhamento de regulação para um paciente.
//
// BRIDGE AUTOMÁTICO: Se solicitacao_id for fornecido, a solicitação vinculada
// tem seu status atualizado para 'aguardando_regulacao' dentro da mesma transação.
// O historico_status registra a mudança com observação descritiva.
//
// Body: { paciente_id, destino, especialidade, prioridade, observacoes?, solicitacao_id? }
// Prioridade: 'VERDE' | 'AMARELO' | 'VERMELHO'
router.post('/encaminhamento', async (req, res) => {
  try {
    const { paciente_id, destino, especialidade, prioridade, observacoes, solicitacao_id } = req.body;

    if (!paciente_id || !destino || !especialidade || !prioridade) {
      return res.status(400).json({ error: 'Paciente, destino, especialidade e prioridade são obrigatórios.' });
    }

    const PRIORIDADES_VALIDAS = ['VERDE', 'AMARELO', 'VERMELHO'];
    if (!PRIORIDADES_VALIDAS.includes(prioridade)) {
      return res.status(400).json({ error: 'Prioridade inválida. Use VERDE, AMARELO ou VERMELHO.' });
    }

    const resultado = await knex.transaction(async (trx) => {
      // 1. Cria o encaminhamento
      const [encaminhamento] = await trx('encaminhamentos')
        .insert({
          ubs_id:         req.user.ubs_id,
          gestor_id:      req.user.id,
          paciente_id,
          destino,
          especialidade,
          prioridade,
          observacoes:    observacoes || null,
          solicitacao_id: solicitacao_id || null,
          status:         'AGUARDANDO_VAGA',
          data_solicitacao: trx.fn.now(),
          atualizado_em:  trx.fn.now(),
        })
        .returning('*');

      // 2. Se há solicitação vinculada, atualiza status para aguardando_regulacao
      if (solicitacao_id) {
        const solicitacao = await trx('solicitacoes').where({ id: solicitacao_id }).first();
        if (solicitacao) {
          await trx('solicitacoes')
            .where({ id: solicitacao_id })
            .update({ status: 'aguardando_regulacao', atualizado_em: trx.fn.now() });

          await trx('historico_status').insert({
            solicitacao_id,
            gestor_id:       req.user.id,
            status_anterior: solicitacao.status,
            status_novo:     'aguardando_regulacao',
            observacao:      `Encaminhamento criado para ${destino} — ${especialidade}.`,
          });
        }
      }

      return encaminhamento;
    });

    return res.status(201).json(resultado);
  } catch (err) {
    console.error('[POST /gestor/encaminhamento]', err);
    return res.status(500).json({ error: 'Erro ao criar encaminhamento.' });
  }
});
```

### 3c. PUT /gestor/encaminhamento/:id/status

```js
// ─── PUT /api/gestor/encaminhamento/:id/status ───────────────────────────────
// Atualiza o status de um encaminhamento.
//
// REGRAS:
//   - status AGENDADO exige data_agendamento no body
//   - status REALIZADO → solicitação vinculada (se houver) vai para 'concluido'
//   - status CANCELADO → solicitação vinculada NÃO é alterada (o gestor decide o próximo passo)
//   - Só permite alterar encaminhamentos da própria UBS do gestor
//
// Body: { status_novo, data_agendamento?, observacoes? }
router.put('/encaminhamento/:id/status', async (req, res) => {
  try {
    const { status_novo, data_agendamento, observacoes } = req.body;

    const STATUS_VALIDOS = ['AGUARDANDO_VAGA', 'AGENDADO', 'REALIZADO', 'CANCELADO'];
    if (!STATUS_VALIDOS.includes(status_novo)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    if (status_novo === 'AGENDADO' && !data_agendamento) {
      return res.status(400).json({ error: 'data_agendamento é obrigatório ao marcar como Agendado.' });
    }

    // Garante que o encaminhamento pertence à UBS do gestor logado
    const encaminhamento = await knex('encaminhamentos')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .first();

    if (!encaminhamento) {
      return res.status(404).json({ error: 'Encaminhamento não encontrado.' });
    }

    await knex.transaction(async (trx) => {
      // Atualiza o encaminhamento
      await trx('encaminhamentos')
        .where({ id: req.params.id })
        .update({
          status:          status_novo,
          data_agendamento: data_agendamento || encaminhamento.data_agendamento,
          observacoes:     observacoes !== undefined ? observacoes : encaminhamento.observacoes,
          atualizado_em:   trx.fn.now(),
        });

      // Se realizado E há solicitação vinculada ainda não concluída → conclui automaticamente
      if (status_novo === 'REALIZADO' && encaminhamento.solicitacao_id) {
        const sol = await trx('solicitacoes').where({ id: encaminhamento.solicitacao_id }).first();
        if (sol && !['concluido', 'cancelado'].includes(sol.status)) {
          await trx('solicitacoes')
            .where({ id: encaminhamento.solicitacao_id })
            .update({ status: 'concluido', atualizado_em: trx.fn.now() });

          await trx('historico_status').insert({
            solicitacao_id: encaminhamento.solicitacao_id,
            gestor_id:      req.user.id,
            status_anterior: sol.status,
            status_novo:    'concluido',
            observacao:     'Encaminhamento realizado — solicitação concluída automaticamente.',
          });
        }
      }
    });

    // Retorna o encaminhamento atualizado com nome do paciente
    const atualizado = await knex('encaminhamentos')
      .join('pacientes', 'encaminhamentos.paciente_id', 'pacientes.id')
      .where('encaminhamentos.id', req.params.id)
      .select(
        'encaminhamentos.*',
        'pacientes.nome as paciente_nome',
        knex.raw(`
          CASE
            WHEN encaminhamentos.status = 'AGUARDANDO_VAGA'
            THEN EXTRACT(DAY FROM NOW() - encaminhamentos.data_solicitacao)::integer
            ELSE NULL
          END as dias_na_fila
        `)
      )
      .first();

    return res.json(atualizado);
  } catch (err) {
    console.error('[PUT /gestor/encaminhamento/:id/status]', err);
    return res.status(500).json({ error: 'Erro ao atualizar status do encaminhamento.' });
  }
});
```

### 3d. GET /gestor/vigilancia

```js
// ─── GET /api/gestor/vigilancia ──────────────────────────────────────────────
// Lista todas as notificações epidemiológicas da UBS do gestor logado.
// paciente_nome é NULL para surtos territoriais (sem paciente vinculado).
// Ordenação: data_notificacao DESC (mais recentes primeiro).
router.get('/vigilancia', async (req, res) => {
  try {
    const notificacoes = await knex('notificacoes_vigilancia')
      .leftJoin('pacientes', 'notificacoes_vigilancia.paciente_id', 'pacientes.id')
      .where('notificacoes_vigilancia.ubs_id', req.user.ubs_id)
      .select(
        'notificacoes_vigilancia.*',
        'pacientes.nome as paciente_nome'
      )
      .orderBy('notificacoes_vigilancia.data_notificacao', 'desc');

    return res.json(notificacoes);
  } catch (err) {
    console.error('[GET /gestor/vigilancia]', err);
    return res.status(500).json({ error: 'Erro ao buscar notificações de vigilância.' });
  }
});
```

### 3e. POST /gestor/vigilancia

```js
// ─── POST /api/gestor/vigilancia ─────────────────────────────────────────────
// Registra nova notificação epidemiológica local.
//
// NOTA IMPORTANTE: Este registro é interno ao UBS+. Não substitui nem envia
// dados ao SINAN (sistema oficial de notificação compulsória do MS).
// O gestor deve continuar notificando o SINAN conforme obrigação legal.
//
// Body: { agravo, bairro, cep?, paciente_id? }
// paciente_id é opcional — surtos territoriais não precisam de paciente específico.
router.post('/vigilancia', async (req, res) => {
  try {
    const { agravo, bairro, cep, paciente_id } = req.body;

    if (!agravo || !bairro) {
      return res.status(400).json({ error: 'Agravo e bairro são obrigatórios.' });
    }

    const [notificacao] = await knex('notificacoes_vigilancia')
      .insert({
        ubs_id:              req.user.ubs_id,
        gestor_id:           req.user.id,
        paciente_id:         paciente_id || null,
        agravo,
        bairro,
        cep:                 cep || null,
        status_investigacao: 'SUSPEITO',
        data_notificacao:    knex.fn.now(),
        atualizado_em:       knex.fn.now(),
      })
      .returning('*');

    return res.status(201).json(notificacao);
  } catch (err) {
    console.error('[POST /gestor/vigilancia]', err);
    return res.status(500).json({ error: 'Erro ao registrar notificação de vigilância.' });
  }
});
```

### 3f. PUT /gestor/vigilancia/:id/status

```js
// ─── PUT /api/gestor/vigilancia/:id/status ───────────────────────────────────
// Atualiza o status de investigação de uma notificação.
// Body: { status_investigacao } — 'SUSPEITO' | 'CONFIRMADO' | 'DESCARTADO'
router.put('/vigilancia/:id/status', async (req, res) => {
  try {
    const { status_investigacao } = req.body;

    const STATUS_VALIDOS = ['SUSPEITO', 'CONFIRMADO', 'DESCARTADO'];
    if (!STATUS_VALIDOS.includes(status_investigacao)) {
      return res.status(400).json({ error: 'Status inválido. Use SUSPEITO, CONFIRMADO ou DESCARTADO.' });
    }

    // Garante isolamento por UBS
    const notificacao = await knex('notificacoes_vigilancia')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .first();

    if (!notificacao) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }

    const [atualizada] = await knex('notificacoes_vigilancia')
      .where({ id: req.params.id })
      .update({ status_investigacao, atualizado_em: knex.fn.now() })
      .returning('*');

    return res.json(atualizada);
  } catch (err) {
    console.error('[PUT /gestor/vigilancia/:id/status]', err);
    return res.status(500).json({ error: 'Erro ao atualizar status da notificação.' });
  }
});
```

---

## ITEM 4 — Frontend: cleanup App.jsx

### 4a. Remover imports desnecessários

```jsx
// REMOVER estas duas linhas de import:
import TransporteGestor from './pages/gestor/TransporteGestor';
import ServicoSocialGestor from './pages/gestor/ServicoSocialGestor';
```

### 4b. Remover rotas e adicionar Vigilância

```jsx
// REMOVER estas duas rotas:
<Route path="/gestor/transporte"     element={<ProtectedRoute tipo="gestor"><TransporteGestor /></ProtectedRoute>} />
<Route path="/gestor/servico-social" element={<ProtectedRoute tipo="gestor"><ServicoSocialGestor /></ProtectedRoute>} />

// ADICIONAR esta rota (manter Regulação que já existe):
<Route path="/gestor/vigilancia" element={<ProtectedRoute tipo="gestor"><VigilanciaGestor /></ProtectedRoute>} />
```

---

## ITEM 5 — Frontend: cleanup SideNavGestor.jsx

### 5a. Remover entradas de PERFIS_ACESSO

```js
// ANTES:
const PERFIS_ACESSO = {
  ...
  regulacao:         ['gestor', 'admin'],
  transporte:        ['gestor', 'admin'],   // ← REMOVER
  'servico-social':  ['gestor', 'admin'],   // ← REMOVER
  vigilancia:        ['gestor', 'admin'],
  ...
};

// DEPOIS:
const PERFIS_ACESSO = {
  ...
  regulacao:  ['gestor', 'admin'],
  vigilancia: ['gestor', 'admin'],
  ...
};
```

### 5b. Remover NavItems de Transporte e Serviço Social

Localizar e REMOVER os dois blocos:
```jsx
// REMOVER:
{pode('transporte') && (
  <NavItem
    to="/gestor/transporte"
    icon="directions_bus"
    label="Transporte Sanitário"
    ...
  />
)}

// REMOVER:
{pode('servico-social') && (
  <NavItem
    to="/gestor/servico-social"
    icon="diversity_1"
    label="Serviço Social"
    ...
  />
)}
```

### 5c. Atualizar condição da seção e label

```jsx
// ANTES:
{(pode('regulacao') || pode('transporte') || pode('servico-social') || pode('vigilancia')) && (
  <SectionLabel label="REDE EXTERNA E APOIO" retraida={retraida} />
)}

// DEPOIS:
{(pode('regulacao') || pode('vigilancia')) && (
  <SectionLabel label="REDE EXTERNA" retraida={retraida} />
)}
```

---

## ITEM 6 — Frontend: RegulacaoGestor.jsx — modal de criação funcional

O botão "Novo Encaminhamento" atualmente faz `toast.info(...)`. Substituir por um modal completo.

### 6a. Adicionar estados no componente

```jsx
// Estados do modal de criação
const [modalCriarAberto, setModalCriarAberto] = useState(false);
const [criando, setCriando] = useState(false);

// Lista de pacientes para o select (mesma chamada já usada em ComunicadosGestor)
const [pacientes, setPacientes] = useState([]);

// Solicitações ativas do paciente selecionado (para o bridge opcional)
const [solicitacoesDisponiveis, setSolicitacoesDisponiveis] = useState([]);

// Formulário de novo encaminhamento
const FORM_INICIAL = {
  paciente_id:   '',
  destino:       '',
  especialidade: '',
  prioridade:    'AMARELO',
  observacoes:   '',
  solicitacao_id: '',
};
const [form, setForm] = useState(FORM_INICIAL);
```

### 6b. Carregar pacientes no useEffect

```jsx
// Adicionar ao useEffect existente ou criar novo:
useEffect(() => {
  api.get('/gestor/pacientes').then(r => setPacientes(r.data)).catch(() => {});
}, []);
```

### 6c. Handler de mudança de paciente (carrega solicitações ativas)

```jsx
// Quando o gestor seleciona um paciente, carrega as solicitações ativas dele
// para permitir o bridge opcional com a regulação.
const handlePacienteChange = async (pacienteId) => {
  setForm(prev => ({ ...prev, paciente_id: pacienteId, solicitacao_id: '' }));
  setSolicitacoesDisponiveis([]);
  if (!pacienteId) return;
  try {
    const { data } = await api.get(`/gestor/paciente/${pacienteId}`);
    // O endpoint /gestor/paciente/:id retorna o paciente com suas solicitações em data.solicitacoes
    const ativas = (data.solicitacoes || []).filter(s => !['concluido', 'cancelado'].includes(s.status));
    setSolicitacoesDisponiveis(ativas);
  } catch (err) {
    console.error('Erro ao carregar solicitações do paciente', err);
  }
};
```

> **VERIFICAR:** O endpoint `GET /gestor/paciente/:id` retorna `{ paciente, solicitacoes, ... }`.
> Ajustar o acesso ao campo conforme a estrutura real da resposta — ler o arquivo gestor.js
> no trecho do route `/paciente/:id` para confirmar o shape exato do response.

### 6d. Handler de submissão

```jsx
// Cria o encaminhamento via POST e atualiza a lista localmente
const handleCriar = async (e) => {
  e.preventDefault();
  setCriando(true);
  try {
    await api.post('/gestor/encaminhamento', {
      ...form,
      paciente_id:    Number(form.paciente_id),
      solicitacao_id: form.solicitacao_id ? Number(form.solicitacao_id) : null,
    });
    toast.success('Encaminhamento criado com sucesso!');
    setModalCriarAberto(false);
    setForm(FORM_INICIAL);
    setSolicitacoesDisponiveis([]);
    fetchEncaminhamentos(); // re-fetch da lista
  } catch (err) {
    toast.error(err.response?.data?.error || 'Erro ao criar encaminhamento.');
  } finally {
    setCriando(false);
  }
};
```

### 6e. Alterar o botão "Novo Encaminhamento"

```jsx
// ANTES:
onClick={() => toast.info('Funcionalidade em implementação — disponível na Fase 2.')}

// DEPOIS:
onClick={() => setModalCriarAberto(true)}
```

### 6f. Modal de criação (adicionar ao JSX antes do fechamento do GestorLayout)

```jsx
{/* ── Modal: Novo Encaminhamento ── */}
{modalCriarAberto && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalCriarAberto(false)} />
    <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
      <header className="p-6 border-b border-surface-variant flex items-center justify-between">
        <h3 className="text-xl font-extrabold text-on-background">Novo Encaminhamento</h3>
        <button onClick={() => setModalCriarAberto(false)} className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </header>
      <form onSubmit={handleCriar} className="p-6 space-y-4">

        {/* Paciente */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-on-surface-variant">Paciente *</label>
          <select
            required
            value={form.paciente_id}
            onChange={e => handlePacienteChange(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
          >
            <option value="">Selecione o paciente</option>
            {pacientes.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        {/* Destino */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-on-surface-variant">Destino *</label>
          <select
            required
            value={form.destino}
            onChange={e => setForm(prev => ({ ...prev, destino: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
          >
            <option value="">Selecione</option>
            <option value="AME">AME</option>
            <option value="CAPS">CAPS</option>
            <option value="HOSPITAL_MUNICIPAL">Hospital Municipal</option>
            <option value="CENTRO_ESPECIALIDADES">Centro de Especialidades</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>

        {/* Especialidade */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-on-surface-variant">Especialidade *</label>
          <input
            required
            type="text"
            placeholder="Ex: Ortopedia, Psiquiatria, Cardiologia..."
            value={form.especialidade}
            onChange={e => setForm(prev => ({ ...prev, especialidade: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
          />
        </div>

        {/* Prioridade */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-on-surface-variant">Prioridade *</label>
          <div className="flex gap-2">
            {[
              { valor: 'VERDE',    label: 'Baixa',  cor: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
              { valor: 'AMARELO',  label: 'Média',  cor: 'bg-amber-100 text-amber-800 border-amber-300' },
              { valor: 'VERMELHO', label: 'Alta',   cor: 'bg-red-100 text-red-800 border-red-300' },
            ].map(p => (
              <button
                key={p.valor}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, prioridade: p.valor }))}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                  form.prioridade === p.valor
                    ? p.cor + ' border-current'
                    : 'bg-surface-container-high text-on-surface-variant border-transparent'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bridge: solicitação ativa (opcional) */}
        {solicitacoesDisponiveis.length > 0 && (
          <div className="space-y-1">
            <label className="text-sm font-bold text-on-surface-variant">
              Vincular a solicitação <span className="font-normal text-on-surface-variant/60">(opcional)</span>
            </label>
            <select
              value={form.solicitacao_id}
              onChange={e => setForm(prev => ({ ...prev, solicitacao_id: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
            >
              <option value="">Sem vínculo (encaminhamento avulso)</option>
              {solicitacoesDisponiveis.map(s => (
                <option key={s.id} value={s.id}>{s.descricao_paciente} — {s.status}</option>
              ))}
            </select>
            <p className="text-xs text-on-surface-variant">
              Se vinculado, a solicitação avançará para "Aguardando Regulação" automaticamente.
            </p>
          </div>
        )}

        {/* Observações */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-on-surface-variant">Observações <span className="font-normal">(opcional)</span></label>
          <textarea
            rows={2}
            placeholder="Ex: Paciente já passou por triagem, urgência clínica documentada..."
            value={form.observacoes}
            onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setModalCriarAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline font-bold text-sm">
            Cancelar
          </button>
          <button type="submit" disabled={criando} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold text-sm disabled:opacity-50">
            {criando ? 'Criando...' : 'Criar Encaminhamento'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

### 6g. Habilitar atualização de status inline na tabela

Na coluna "Ação" da tabela, substituir o botão "Ver Detalhes" por um dropdown de status:

```jsx
// ANTES (coluna Ação):
<td className="px-6 py-4 text-right">
  <button 
    onClick={() => navigate('/gestor/paciente/' + enc.paciente_id)}
    className="text-primary hover:bg-primary/10 p-2 rounded-lg font-bold text-sm transition-colors"
  >
    Ver Detalhes
  </button>
</td>

// DEPOIS (coluna Ação — dois botões):
<td className="px-6 py-4 text-right">
  <div className="flex items-center justify-end gap-2">
    {/* Avançar status */}
    {enc.status === 'AGUARDANDO_VAGA' && (
      <button
        onClick={() => handleAtualizarStatus(enc, 'AGENDADO')}
        className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
      >
        Marcar Agendado
      </button>
    )}
    {enc.status === 'AGENDADO' && (
      <button
        onClick={() => handleAtualizarStatus(enc, 'REALIZADO')}
        className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
      >
        Marcar Realizado
      </button>
    )}
    {/* Ver paciente */}
    <button
      onClick={() => navigate('/gestor/paciente/' + enc.paciente_id)}
      className="text-primary hover:bg-primary/10 p-2 rounded-lg text-sm transition-colors"
    >
      <span className="material-symbols-outlined text-lg">open_in_new</span>
    </button>
  </div>
</td>
```

Adicionar o handler (para AGENDADO pede data, para REALIZADO confirma direto):

```jsx
// Atualiza status do encaminhamento inline na tabela.
// Para AGENDADO: usa window.prompt para data (solução simples para MVP).
// Para REALIZADO: confirmação direta.
const handleAtualizarStatus = async (enc, novoStatus) => {
  let data_agendamento = null;

  if (novoStatus === 'AGENDADO') {
    // Pede a data no formato esperado pelo backend (YYYY-MM-DD)
    const input = window.prompt('Data do agendamento (DD/MM/AAAA):');
    if (!input) return;
    // Converte DD/MM/AAAA → YYYY-MM-DD
    const partes = input.split('/');
    if (partes.length !== 3) return toast.error('Formato de data inválido.');
    data_agendamento = `${partes[2]}-${partes[1]}-${partes[0]}`;
  }

  try {
    await api.put(`/gestor/encaminhamento/${enc.id}/status`, {
      status_novo: novoStatus,
      data_agendamento,
    });
    toast.success(`Encaminhamento atualizado para ${STATUS_LABELS[novoStatus]}.`);
    fetchEncaminhamentos();
  } catch (err) {
    toast.error(err.response?.data?.error || 'Erro ao atualizar status.');
  }
};
```

> **Nota sobre window.prompt:** é aceitável para MVP/banca. Para produção, substituir por
> um modal com `<input type="date">`. O Antigravity pode usar um mini modal se preferir.

---

## ITEM 7 — Frontend: VigilanciaGestor.jsx — modal de criação + status inline + gerar alerta

### 7a. Adicionar estados

```jsx
// Importar useNavigate se ainda não estiver importado
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();

// Estados do modal de nova notificação
const [modalNovaAberto, setModalNovaAberto] = useState(false);
const [criando, setCriando] = useState(false);
const [formVigilancia, setFormVigilancia] = useState({
  agravo:      '',
  bairro:      '',
  cep:         '',
  paciente_id: '',
});

// Lista de pacientes para vincular opcionalmente (igual a RegulacaoGestor)
const [pacientes, setPacientes] = useState([]);
```

### 7b. Carregar pacientes

```jsx
useEffect(() => {
  fetchNotificacoes();
  api.get('/gestor/pacientes').then(r => setPacientes(r.data)).catch(() => {});
}, []);
```

### 7c. Handler de criação

```jsx
const handleCriarNotificacao = async (e) => {
  e.preventDefault();
  setCriando(true);
  try {
    await api.post('/gestor/vigilancia', {
      ...formVigilancia,
      paciente_id: formVigilancia.paciente_id ? Number(formVigilancia.paciente_id) : null,
    });
    toast.success('Notificação registrada. Lembre-se de notificar o SINAN se for compulsória.');
    setModalNovaAberto(false);
    setFormVigilancia({ agravo: '', bairro: '', cep: '', paciente_id: '' });
    fetchNotificacoes();
  } catch (err) {
    toast.error(err.response?.data?.error || 'Erro ao registrar notificação.');
  } finally {
    setCriando(false);
  }
};
```

### 7d. Handler de atualização de status

```jsx
// Alterna o status de investigação de uma notificação (SUSPEITO → CONFIRMADO → DESCARTADO)
const handleStatusVigilancia = async (notificacao, novoStatus) => {
  try {
    await api.put(`/gestor/vigilancia/${notificacao.id}/status`, {
      status_investigacao: novoStatus,
    });
    toast.success('Status atualizado.');
    fetchNotificacoes();
  } catch (err) {
    toast.error(err.response?.data?.error || 'Erro ao atualizar status.');
  }
};
```

### 7e. Handler "Gerar alerta para pacientes"

```jsx
// Navega para a página de Comunicados com dados pré-preenchidos via router state.
// O mesmo padrão do FAB de agendamentos (TASK_22).
// O gestor revisa a mensagem antes de publicar — sem envio automático.
const handleGerarAlerta = (notificacao) => {
  navigate('/gestor/comunicados', {
    state: {
      abrirModal:  true,
      titulo:      `Alerta: ${notificacao.agravo} em ${notificacao.bairro}`,
      mensagem:    `Atenção: identificamos casos de ${notificacao.agravo} no bairro ${notificacao.bairro}. Se você apresentar sintomas, procure nossa UBS imediatamente. Mantenha-se hidratado e evite acúmulo de água parada.`,
      urgente:     true,
    },
  });
};
```

### 7f. Alterar botão "Nova Notificação"

```jsx
// ANTES:
onClick={() => toast.info('Notificação epidemiológica disponível na Fase 2.')}

// DEPOIS:
onClick={() => setModalNovaAberto(true)}
```

### 7g. Substituir botão "Investigar" na tabela

```jsx
// ANTES:
<td className="px-6 py-4 text-right">
  <button 
    onClick={() => notificacao.paciente_id ? navigate('/gestor/paciente/' + notificacao.paciente_id) : toast.info('...')}
    className="text-primary hover:bg-primary/10 p-2 rounded-lg font-bold text-sm transition-colors"
  >
    Investigar
  </button>
</td>

// DEPOIS (3 ações):
<td className="px-6 py-4 text-right">
  <div className="flex items-center justify-end gap-2 flex-wrap">
    {/* Avançar investigação */}
    {notificacao.status_investigacao === 'SUSPEITO' && (
      <button
        onClick={() => handleStatusVigilancia(notificacao, 'CONFIRMADO')}
        className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
      >
        Confirmar
      </button>
    )}
    {notificacao.status_investigacao === 'SUSPEITO' && (
      <button
        onClick={() => handleStatusVigilancia(notificacao, 'DESCARTADO')}
        className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
      >
        Descartar
      </button>
    )}
    {/* Gerar alerta — só aparece para casos CONFIRMADOS */}
    {notificacao.status_investigacao === 'CONFIRMADO' && (
      <button
        onClick={() => handleGerarAlerta(notificacao)}
        className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-sm">campaign</span>
        Gerar Alerta
      </button>
    )}
  </div>
</td>
```

### 7h. Modal de nova notificação (adicionar ao JSX)

```jsx
{/* ── Modal: Nova Notificação de Vigilância ── */}
{modalNovaAberto && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalNovaAberto(false)} />
    <div className="relative w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-2xl">
      <header className="p-6 border-b border-surface-variant flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-on-background">Nova Notificação</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Registro interno — notifique o SINAN separadamente.</p>
        </div>
        <button onClick={() => setModalNovaAberto(false)} className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </header>
      <form onSubmit={handleCriarNotificacao} className="p-6 space-y-4">

        {/* Agravo */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-on-surface-variant">Agravo / Doença *</label>
          <input
            required
            type="text"
            placeholder="Ex: Dengue, Tuberculose, COVID-19, Sarampo..."
            value={formVigilancia.agravo}
            onChange={e => setFormVigilancia(prev => ({ ...prev, agravo: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
          />
        </div>

        {/* Bairro */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-on-surface-variant">Bairro (foco) *</label>
          <input
            required
            type="text"
            placeholder="Ex: Jardim Satélite, São Dimas..."
            value={formVigilancia.bairro}
            onChange={e => setFormVigilancia(prev => ({ ...prev, bairro: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
          />
        </div>

        {/* CEP (opcional) */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-on-surface-variant">CEP <span className="font-normal">(opcional)</span></label>
          <input
            type="text"
            placeholder="Ex: 12230-000"
            value={formVigilancia.cep}
            onChange={e => setFormVigilancia(prev => ({ ...prev, cep: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
          />
        </div>

        {/* Paciente (opcional) */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-on-surface-variant">Paciente vinculado <span className="font-normal">(opcional)</span></label>
          <select
            value={formVigilancia.paciente_id}
            onChange={e => setFormVigilancia(prev => ({ ...prev, paciente_id: e.target.value }))}
            className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
          >
            <option value="">Surto territorial (sem paciente específico)</option>
            {pacientes.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setModalNovaAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline font-bold text-sm">
            Cancelar
          </button>
          <button type="submit" disabled={criando} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold text-sm disabled:opacity-50">
            {criando ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

---

## ITEM 8 — Frontend: ComunicadosGestor.jsx — ler router state

### 8a. Importar useLocation

```jsx
// ANTES:
import React, { useState, useEffect } from 'react';

// DEPOIS:
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
```

### 8b. Usar location no componente

```jsx
const location = useLocation();
```

### 8c. useEffect para pré-preencher formulário quando vindo de Vigilância

Adicionar APÓS o useEffect existente:

```jsx
// Abre o modal de novo comunicado pré-preenchido quando o gestor navega
// a partir do botão "Gerar Alerta" em VigilanciaGestor.
// Usa o mesmo padrão do FAB de agendamentos (TASK_22).
useEffect(() => {
  if (location.state?.abrirModal) {
    setForm(prev => ({
      ...prev,
      titulo:  location.state.titulo   || '',
      mensagem: location.state.mensagem || '',
      urgente: location.state.urgente  ?? false,
      tipo:    'geral',
    }));
    setModalAberto(true);
    // Limpa o state para evitar re-trigger
    window.history.replaceState({}, document.title);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

> **Por que `[]` e não `[location.state]`?** Queremos executar apenas uma vez ao montar
> o componente. Se o gestor fechar e reabrir o modal sem sair da página, o state já foi
> limpo pelo replaceState e não haverá re-trigger.

---

## VALIDAÇÃO

**Backend:**
1. `GET /api/gestor/encaminhamentos` retorna lista com `dias_na_fila` calculado ✓
2. `POST /api/gestor/encaminhamento` com `solicitacao_id` válido → solicitação avança para `aguardando_regulacao` ✓
3. `PUT /api/gestor/encaminhamento/:id/status` com `REALIZADO` → solicitação vinculada vai para `concluido` ✓
4. `GET /api/gestor/vigilancia` retorna notificações apenas da UBS do gestor logado ✓
5. `POST /api/gestor/vigilancia` cria com `status_investigacao = 'SUSPEITO'` ✓
6. `PUT /api/gestor/vigilancia/:id/status` → só aceita da mesma UBS ✓

**Frontend:**
7. Rota `/gestor/transporte` retorna 404 ✓ (rota removida)
8. Rota `/gestor/servico-social` retorna 404 ✓ (rota removida)
9. Sidebar não exibe mais "Transporte Sanitário" nem "Serviço Social" ✓
10. Rota `/gestor/vigilancia` funciona e carrega lista ✓
11. Modal "Novo Encaminhamento" cria registro e re-fetcha lista ✓
12. Bridge opcional funciona: selecionar uma solicitação no modal e criar → status da solicitação muda ✓
13. Modal "Nova Notificação" em Vigilância cria registro ✓
14. Botão "Confirmar" muda status para CONFIRMADO e aparece botão "Gerar Alerta" ✓
15. Botão "Gerar Alerta" navega para `/gestor/comunicados` e abre modal pré-preenchido ✓
16. Build limpo sem erros ✓
17. Git commit + push ✓

---

## O QUE NÃO FAZER

- ❌ Não executar DROP nas tabelas `transporte_sanitario` e `casos_sociais` — ficam no banco
- ❌ Não usar `window.confirm()` para confirmações — usar toast.error e validação no backend
- ❌ Não criar tela no portal do paciente para encaminhamentos — o paciente vê via status da solicitação
- ❌ Não auto-enviar comunicado de alerta — o gestor SEMPRE revisa antes de publicar
- ❌ Não remover a coluna `vigilancia` de PERFIS_ACESSO — mantém o controle de acesso

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
