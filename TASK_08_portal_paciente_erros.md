# TASK_08 — Corrigir Falhas Silenciosas no Portal do Paciente
**Agente executor:** Antigravity (Fast Mode)
**Revisor:** Claude Sonnet 4.6
**Prioridade:** 🟡 MÉDIA — afeta a demo se houver instabilidade de rede na banca
**Data:** 2026-06-18

---

## Contexto

Durante auditoria pré-banca, identificamos que dois componentes do portal do paciente têm **falha silenciosa** de rede: quando a API não responde, o `.catch(() => {})` descarta o erro silenciosamente e o componente renderiza como se não houvesse dados — enganando o usuário.

Os demais componentes (`DashboardPaciente`, `SolicitacoesPaciente`, `DetalheSolicitacao`, `Medicamentos`) já possuem estado de erro com retry — este padrão deve ser replicado.

---

## Arquivos a modificar

| # | Arquivo | Problema |
|---|---|---|
| P-01 | `app/frontend/src/pages/paciente/ComunicadosPaciente.jsx` | `.catch(() => {})` → sem estado de erro, sem retry |
| P-02 | `app/frontend/src/pages/paciente/AgendamentosPaciente.jsx` | `Promise.all([...]).catch(() => {})` → sem estado de erro, sem retry |

---

## Padrão de referência

O `SolicitacoesPaciente.jsx` já implementa o padrão correto. Use-o como referência:

```jsx
const [erro, setErro] = useState(false);

const carregar = () => {
  setLoading(true);
  setErro(false);
  api.get('/paciente/...')
    .then(r => setDados(r.data))
    .catch(() => setErro(true))
    .finally(() => setLoading(false));
};

useEffect(() => { carregar(); }, []);

// Estado de erro renderizado antes do return principal:
if (erro) {
  return (
    <PacienteLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
        <span className="material-symbols-outlined text-5xl text-red-400">wifi_off</span>
        <p className="text-on-surface-variant text-center text-sm">
          Não foi possível carregar os dados.<br />Verifique sua conexão e tente novamente.
        </p>
        <button
          onClick={carregar}
          className="bg-primary text-on-primary px-6 py-2 rounded-full text-sm font-semibold"
        >
          Tentar novamente
        </button>
      </div>
    </PacienteLayout>
  );
}
```

---

## P-01 — ComunicadosPaciente.jsx

**Localização do problema** (linhas ~20-24):
```js
// ATUAL — ERRADO
const [loading, setLoading] = useState(true);
const [expandidos, setExpandidos] = useState({});

useEffect(() => {
  api.get('/paciente/comunicados')
    .then(r => setComunicados(r.data))
    .catch(() => {})                    // ← descarta o erro silenciosamente
    .finally(() => setLoading(false));
}, []);
```

**Correção esperada:**
1. Adicionar `const [erro, setErro] = useState(false);`
2. Extrair `useEffect` para função nomeada `carregar()` (permite retry)
3. No `.catch()`: `setErro(true)` em vez de `() => {}`
4. Adicionar `setErro(false)` no início de `carregar()`
5. Renderizar estado de erro com botão "Tentar novamente" que chama `carregar()` antes do `return` principal, dentro do `PacienteLayout`
6. Manter o ícone `wifi_off` (Material Symbols) conforme padrão

**Atenção:** o componente tem um `if (loading)` no return — o estado de erro deve ser checado logo abaixo, antes de qualquer outro render condicional.

---

## P-02 — AgendamentosPaciente.jsx

**Localização do problema** (linhas ~40-54):
```js
// ATUAL — ERRADO
const carregarTodos = () => {
  setLoading(true);
  Promise.all([
    api.get('/paciente/agendamentos/disponiveis'),
    api.get('/paciente/agendamentos/meus'),
  ])
    .then(([resDisp, resMeus]) => {
      setDisponiveis(resDisp.data);
      setMeus(resMeus.data);
    })
    .catch(() => {})                    // ← descarta o erro silenciosamente
    .finally(() => setLoading(false));
};
```

**Correção esperada:**
1. Adicionar `const [erro, setErro] = useState(false);`
2. No início de `carregarTodos()`: adicionar `setErro(false)`
3. No `.catch()`: `setErro(true)` em vez de `() => {}`
4. Renderizar estado de erro com botão "Tentar novamente" que chama `carregarTodos()`, dentro do `PacienteLayout`, logo após o bloco `if (loading)`
5. Manter o ícone `wifi_off` e o texto padrão

**Atenção:** `carregarTodos` já é função nomeada (reutilizada pelo botão de reserva), então o retry pode chamar diretamente `carregarTodos`.

---

## Regra de comentários (obrigatório)

Adicionar comentário explicativo antes de cada bloco de estado de erro, no padrão do projeto:

```js
// Estado de erro com retry — exibido quando a API não responde ou retorna falha.
// Evita que o paciente veja uma lista vazia enganosa por falha de rede.
if (erro) { ... }
```

---

## Validação

Após as correções:

1. `npm run build` dentro de `app/frontend` — deve passar sem erros
2. Confirmar visualmente (DevTools → Network → desabilitar rede) que:
   - `ComunicadosPaciente` exibe mensagem de erro + botão retry ao falhar
   - `AgendamentosPaciente` exibe mensagem de erro + botão retry ao falhar
3. Confirmar que o botão retry recarrega os dados corretamente ao restaurar a rede

---

## Entregável

Relatório de sessão salvo em `.Agent/reports/REPORT_08_portal_paciente_erros.md` com:
- Confirmação das linhas alteradas em cada arquivo
- Output do `npm run build`
