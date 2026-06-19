# TASK_10 — Correção de Bugs Pós-Teste de Comunicação
## Para o Agente Antigravity

> **Prioridade:** Alta — bugs identificados em teste real com dados do Reinaldo  
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-19  
> **Contexto:** Teste executado pelo agente Chrome revelou 2 falhas antes do relatório ser concluído.

---

## BUG 1 (ALTA) — "Erro ao atualizar status" no modal de atualização de solicitação

### Sintoma
Ao abrir o modal de atualização de status em `PerfilPaciente.jsx` (gestor), alterar o status para "Autorizado" e preencher a observação, o botão "Confirmar" retorna o toast de erro `'Erro ao atualizar status.'` sem nenhuma mudança salva. O erro foi reproduzível (o agente tentou duas vezes).

### Rota afetada
`PUT /api/gestor/solicitacao/:id/status`  
Arquivo: `app/backend/src/routes/gestor.js` — linha 270

### Hipóteses (investigar nesta ordem)

**Hipótese A — React state não atualizado pelo form_input do agente Chrome**  
O agente usou `form_input` para alterar o `<select>` de status. Esse método pode não disparar o evento sintético do React, deixando `formStatus.status_novo` com o valor padrão `'em_analise'`. Se o valor não mudou, a chamada ainda chega ao servidor, mas isso não explicaria o 500.

**Hipótese B — Observação do paciente não está sendo salva (UX bug)**  
A rota PUT salva a observação em `historico_status.observacao`, mas **NÃO atualiza** `solicitacoes.observacao_paciente`. A observação que o gestor escreve no modal nunca aparece no card da solicitação no portal do paciente — ela fica presa no histórico interno. Isso não é um 500, mas é um bug de produto grave: o paciente nunca vê a mensagem do gestor.

**Hipótese C — Erro no servidor não capturado nos logs Vercel**  
Os logs da API nas últimas 6h não mostraram nenhuma chamada PUT ao endpoint de status — o erro pode ter ocorrido antes da janela de logs, ou o request foi bloqueado por CORS/auth antes de chegar ao Express.

### O que fazer

1. **Reproduzir manualmente:** abra o painel gestor em produção, entre no perfil do Reinaldo (ou qualquer paciente com solicitação), abra o modal de status e tente confirmar. Verifique se o erro acontece.

2. **Se reproduzível, verificar os Vercel runtime logs** imediatamente após o erro:
   - Painel: `https://vercel.com/team_sMMSKFmgqwJUjoxyXuZ69OXw/gestao-saude-ubs-api` → Runtime Logs → filtrar por `PUT /status`
   - O log do servidor mostrará o erro real (ex: constraint violation, coluna inexistente, timeout)

3. **Independente do erro 500, corrigir o Bug de produto (Hipótese B):**  
   Na rota `PUT /api/gestor/solicitacao/:id/status`, adicionar o update de `observacao_paciente` quando a observação for informada:

```js
// Dentro da transação, após o update de status (linha ~292):
if (observacao) {
  await trx('solicitacoes')
    .where('id', req.params.id)
    .update({ observacao_paciente: observacao });
}
```

   Isso garante que a mensagem do gestor apareça no card do paciente em `SolicitacoesPaciente.jsx` (que já renderiza `sol.observacao_paciente`).

---

## BUG 2 (MÉDIA) — "Erro ao carregar comunicados" ao entrar na página de Comunicados do gestor

### Sintoma
Ao navegar para Comunicados no painel gestor, aparece o toast de erro `'Erro ao carregar comunicados.'` imediatamente. A lista fica vazia mesmo com comunicados existentes no banco.

### Rota afetada
`GET /api/gestor/comunicados`  
Arquivo: `app/backend/src/routes/gestor.js` — linha 955  
Frontend: `app/frontend/src/pages/gestor/ComunicadosGestor.jsx` — linha 28

### O que verificar

A rota filtra por `req.user.ubs_id`. Se por qualquer motivo esse campo vier `undefined` no JWT decodificado, o Knex executaria `WHERE ubs_id = undefined`, causando um erro de SQL.

Adicionar log temporário para diagnóstico:
```js
router.get('/comunicados', async (req, res) => {
  console.log('[GET /comunicados] ubs_id:', req.user?.ubs_id); // DIAGNÓSTICO
  try {
    if (!req.user?.ubs_id) {
      return res.status(400).json({ error: 'ubs_id não identificado no token.' });
    }
    // ... resto do código
```

Após confirmar a causa, remover o log de diagnóstico.

---

## VALIDAÇÃO APÓS CORREÇÕES

1. Reproduzir o Flow 2 do roteiro de testes:
   - Abrir modal de status → mudar para "Autorizado" → preencher observação → Confirmar
   - Verificar: toast de sucesso, status mudou, observação aparece no portal do paciente

2. Navegar para Comunicados no gestor:
   - Página carrega a lista sem toast de erro

3. Fazer `git add -A && git commit -m "fix: status update saves observacao_paciente + fix comunicados ubs_id guard" && git push`

---

*Gerado por Claude Sonnet 4.6 — Gestão Saúde UBS+ — UFBRA*
