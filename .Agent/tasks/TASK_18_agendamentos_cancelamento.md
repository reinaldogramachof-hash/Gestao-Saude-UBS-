# TASK_18 — Agendamentos: Cancelamento pelo Paciente
## Para o Agente Antigravity

> **Prioridade:** 🟡 Média — sem cancelamento, o paciente fica preso no agendamento
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19
> **Sem migration:** a coluna `status` já suporta `'cancelado'` (migration 006) ✅
>
> **Arquivos alterados:**
> - `app/backend/src/routes/paciente.js` (nova rota PUT)
> - `app/frontend/src/pages/paciente/AgendamentosPaciente.jsx`

---

## CONTEXTO

O paciente pode reservar um agendamento, mas não tem como cancelar.
Se precisar desistir, o slot fica bloqueado para outros pacientes até o gestor intervir.

**Regras de negócio:**
- Só pode cancelar agendamentos com `status === 'reservado'` (não concluídos)
- Ao cancelar: `status → 'cancelado'`, `paciente_id → NULL` (slot volta à disponibilidade — o gestor pode reabrir manualmente se necessário), `motivo → null`
- Verificação de propriedade: paciente só cancela o próprio agendamento
- Deve exibir modal de confirmação no frontend para evitar cancelamento acidental

---

## ITEM 1 — BACKEND: nova rota PUT /paciente/agendamento/:id/cancelar

**Inserir em `app/backend/src/routes/paciente.js`**, **após** a rota `POST /agendamento/:id/reservar` (~linha 404), antes da rota `POST /push-subscribe`:

```js
// ─── PUT /api/paciente/agendamento/:id/cancelar ───────────────────────────────
// Permite que o paciente cancele um agendamento com status 'reservado'.
// Verifica que o agendamento pertence ao paciente logado antes de qualquer ação.
// Ao cancelar: status → 'cancelado', paciente_id → NULL (libera o slot para reuso pelo gestor).
router.put('/agendamento/:id/cancelar', async (req, res) => {
  try {
    // Busca o agendamento garantindo que pertence ao paciente logado
    const agendamento = await knex('agendamentos_gestao')
      .where({ id: req.params.id, paciente_id: req.user.id })
      .first();

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }

    // Impede cancelamento de agendamentos já concluídos ou já cancelados
    if (agendamento.status !== 'reservado') {
      return res.status(409).json({ error: 'Apenas agendamentos reservados podem ser cancelados.' });
    }

    // Cancela: limpa o vínculo com o paciente e marca como cancelado
    await knex('agendamentos_gestao')
      .where({ id: req.params.id })
      .update({
        status:      'cancelado',
        paciente_id: null,
        motivo:      null,
      });

    return res.json({ ok: true, mensagem: 'Agendamento cancelado com sucesso.' });
  } catch (err) {
    console.error('[PUT /paciente/agendamento/:id/cancelar]', err);
    return res.status(500).json({ error: 'Erro ao cancelar agendamento.' });
  }
});
```

Atualizar o bloco de comentário no cabeçalho do arquivo (lista de rotas):
```js
// ANTES (na linha de documentação do arquivo):
// *   POST /api/paciente/agendamento/:id/reservar
//
// DEPOIS:
// *   POST /api/paciente/agendamento/:id/reservar
// *   PUT  /api/paciente/agendamento/:id/cancelar
```

---

## ITEM 2 — FRONTEND: AgendamentosPaciente.jsx

### 2a. Adicionar estado de controle do modal de cancelamento

Adicionar **após** `const [reservando, setReservando] = useState(false);`:

```jsx
// Controla o modal de confirmação de cancelamento
const [cancelando, setCancelando] = useState(false);
// ID do agendamento que o paciente pretende cancelar
const [agendamentoCancelando, setAgendamentoCancelando] = useState(null);
```

### 2b. Adicionar função handleCancelar

Adicionar **após** a função `handleReservar` (~linha 83):

```jsx
// Abre o modal de confirmação para cancelar o agendamento informado
const abrirConfirmacaoCancelamento = (ag) => {
  setAgendamentoCancelando(ag);
};

// Executa o cancelamento após confirmação no modal
const handleCancelar = async () => {
  if (!agendamentoCancelando) return;
  setCancelando(true);
  try {
    await api.put(`/paciente/agendamento/${agendamentoCancelando.id}/cancelar`);
    toast.success('Agendamento cancelado.');
    setAgendamentoCancelando(null);
    carregarTodos();
  } catch (err) {
    toast.error(err.response?.data?.error || 'Erro ao cancelar agendamento.');
  } finally {
    setCancelando(false);
  }
};
```

### 2c. Adicionar botão "Cancelar" nos cards de "Meus Agendamentos"

Localizar o card dentro de `meus.map(ag => ...)`:

```jsx
// ANTES (card atual):
<div key={ag.id} className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-5">
  <div className="flex justify-between items-start gap-4">
    <div>
      <p className="font-bold text-on-background capitalize text-sm">{formatarDataHora(ag.data_hora)}</p>
      <p className="text-xs text-on-surface-variant font-medium mt-1">{ag.duracao_minutos} minutos</p>
      {ag.motivo && <p className="text-xs text-on-surface-variant italic mt-1">{ag.motivo}</p>}
    </div>
    <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${STATUS_BADGE[ag.status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABEL[ag.status] || ag.status}
    </span>
  </div>
</div>

// DEPOIS (com botão cancelar):
<div key={ag.id} className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-5">
  <div className="flex justify-between items-start gap-4">
    <div className="flex-1 min-w-0">
      <p className="font-bold text-on-background capitalize text-sm">{formatarDataHora(ag.data_hora)}</p>
      <p className="text-xs text-on-surface-variant font-medium mt-1">{ag.duracao_minutos} minutos</p>
      {ag.motivo && <p className="text-xs text-on-surface-variant italic mt-1">{ag.motivo}</p>}
    </div>
    <div className="flex flex-col items-end gap-2 flex-shrink-0">
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_BADGE[ag.status] || 'bg-gray-100 text-gray-600'}`}>
        {STATUS_LABEL[ag.status] || ag.status}
      </span>
      {/* Botão cancelar: só aparece em agendamentos reservados (não concluídos) */}
      {ag.status === 'reservado' && (
        <button
          onClick={() => abrirConfirmacaoCancelamento(ag)}
          className="text-xs font-bold text-red-500 border border-red-200 px-3 py-1 rounded-xl hover:bg-red-50 transition-colors"
        >
          Cancelar
        </button>
      )}
    </div>
  </div>
</div>
```

### 2d. Adicionar modal de confirmação de cancelamento

Adicionar **após** o modal de reserva (`{modalAberto && slotSelecionado && (...)}`) e antes do fechamento de `</PacienteLayout>`:

```jsx
{/* ── Modal: Confirmar Cancelamento ── */}
{agendamentoCancelando && (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
    {/* Overlay semitransparente com blur */}
    <div
      className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
      onClick={() => !cancelando && setAgendamentoCancelando(null)}
    />
    <div className="relative w-full sm:max-w-md bg-surface-container-lowest rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl">
      <div className="p-6 text-center">
        {/* Ícone de aviso */}
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-red-500 text-3xl">event_busy</span>
        </div>
        <h3 className="text-xl font-extrabold text-on-background mb-2">Cancelar agendamento?</h3>
        {/* Exibe data/hora do agendamento que será cancelado */}
        <p className="text-sm text-on-surface-variant mb-1 capitalize font-medium">
          {formatarDataHora(agendamentoCancelando.data_hora)}
        </p>
        <p className="text-xs text-on-surface-variant mb-6">
          Esta ação não pode ser desfeita. Se quiser reagendar, precisará escolher um novo horário disponível.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setAgendamentoCancelando(null)}
            disabled={cancelando}
            className="flex-1 h-14 rounded-2xl border border-outline font-bold disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleCancelar}
            disabled={cancelando}
            className="flex-1 h-14 rounded-2xl bg-red-500 text-white font-bold disabled:opacity-50"
          >
            {cancelando ? 'Cancelando...' : 'Confirmar cancelamento'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

---

## VALIDAÇÃO

1. Card de agendamento `reservado` exibe botão "Cancelar" em vermelho ✓
2. Cards `concluido` e `cancelado` NÃO exibem o botão ✓
3. Clicar "Cancelar" abre modal de confirmação com data/hora do slot ✓
4. Confirmar cancelamento: status muda para `cancelado`, paciente_id = NULL no banco ✓
5. Toast de sucesso e lista atualizada após cancelamento ✓
6. Overlay do modal fecha ao clicar fora (apenas se não estiver cancelando) ✓
7. Rota retorna 409 se tentar cancelar status diferente de `reservado` ✓
8. Build limpo, git commit + push ✓

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
