# TASK_09 — Correções Pós-Avaliação (Portal do Gestor)
**Agente executor:** Antigravity (Fast Mode)
**Revisor:** Claude Sonnet 4.6
**Prioridade:** 🔴 ALTA — corrigir antes da banca (25/06)
**Origem:** Relatório de avaliação do Agente Claude Chrome (19/06/2026)

---

## Contexto

Avaliação especialista do Portal do Gestor identificou 5 itens a corrigir. Nenhum é crítico de sistema — todos são gaps de UX e dados que comprometem a credibilidade na banca. Execute na ordem listada.

---

## ITEM 1 — AutoComplete no login do gestor [M1]
**Arquivo:** `app/frontend/src/pages/gestor/LoginGestor.jsx`
**Problema:** O campo de e-mail (type="email") sem atributo `autoComplete` permite que o browser preencha automaticamente com e-mails salvos do usuário (ex: e-mail pessoal do desenvolvedor). Na banca, o avaliador vê um e-mail inválido pré-preenchido.

**Localização:** Linha ~65, o input de e-mail.
```jsx
// ATUAL
<input
  required
  type="email"
  placeholder="gestor@gestaoubs.dev"
  value={email}
  onChange={e => setEmail(e.target.value)}
  className="..."
/>
```

**Correção:** Adicionar `autoComplete="off"` ao input de e-mail e `autoComplete="current-password"` ao de senha (melhora compatibilidade de browser):
```jsx
// CORRIGIDO
<input
  required
  type="email"
  autoComplete="off"
  placeholder="gestor@gestaoubs.dev"
  value={email}
  onChange={e => setEmail(e.target.value)}
  className="..."
/>
```
E no input de senha, adicionar: `autoComplete="current-password"`

---

## ITEM 2 — Campo "Bairro" no perfil do paciente [M2]
**Arquivo:** `app/frontend/src/pages/gestor/PerfilPaciente.jsx`
**Problema:** O backend retorna `pacientes.*` (inclui `bairro`), mas o componente renderiza apenas Telefone, Nascimento, E-mail e UBS de Origem — omitindo o bairro. Para UBS de atenção básica, o bairro é dado de territorialização essencial.

**Localização:** Linhas ~650–655, o array de dados pessoais renderizados.
```jsx
// ATUAL — falta bairro
{ label: 'Telefone',     value: paciente?.telefone || '---' },
{ label: 'Nascimento',  value: paciente?.data_nascimento ? formatarDataBR(paciente.data_nascimento) : '---' },
{ label: 'E-mail',      value: paciente?.email || '---' },
{ label: 'UBS de Origem', value: paciente?.ubs_nome || '---' },
```

**Correção:** Adicionar `Bairro` logo após E-mail:
```jsx
// CORRIGIDO
{ label: 'Telefone',      value: paciente?.telefone || '---' },
{ label: 'Nascimento',    value: paciente?.data_nascimento ? formatarDataBR(paciente.data_nascimento) : '---' },
{ label: 'E-mail',        value: paciente?.email || '---' },
{ label: 'Bairro',        value: paciente?.bairro || '---' },
{ label: 'UBS de Origem', value: paciente?.ubs_nome || '---' },
```

Também adicionar `bairro` ao estado `formDados` (para edição). Procure a linha com `nome: '', telefone: '', email: ''` (~linha 222) e adicione `bairro: ''`. Depois, onde `formDados` é preenchido com dados do paciente (~linha 267–269), adicione:
```js
bairro: paciente?.bairro || '',
```
E no submit do PUT `/paciente/:id`, incluir `bairro: formDados.bairro` no body enviado.

---

## ITEM 3 — Badge "Aguardando Aprovação" visível antes de clicar na aba [M4]
**Arquivo:** `app/frontend/src/pages/gestor/GestorPacientes.jsx`
**Problema:** `fetchPendentes()` só é chamado quando `aba === 'pendentes'`, então o badge que mostra a contagem (`pendentes.length > 0`) começa como `[]` e o número não aparece até o gestor clicar na aba. O gestor perde a informação de urgência na primeira visualização.

**Localização:** O `useEffect` principal que dispara `fetchPendentes()` depende de `[busca, paginaAtual, aba]` — não é chamado no mount quando `aba === 'ativos'`.

**Correção:** Adicionar um `useEffect` separado que carrega pendentes uma vez no mount, independente da aba ativa. Inserir logo após os outros `useEffect`:

```jsx
// Carrega pendentes no mount para exibir badge de contagem mesmo na aba de ativos
// O gestor precisa ver quantos cadastros aguardam aprovação sem precisar clicar na aba.
useEffect(() => {
  fetchPendentes();
}, []);
```

---

## ITEM 4 — Confirmação antes de aprovar cadastro de paciente [M5]
**Arquivo:** `app/frontend/src/pages/gestor/GestorPacientes.jsx`
**Problema:** Clicar em "Aprovar" executa a ação imediatamente sem confirmação. A rejeição já tem modal de confirmação (estado `confirmacao`) — aprovação deve seguir o mesmo padrão, pois é uma ação administrativa com implicações de acesso ao sistema.

**Localização:** Encontre o estado `confirmacao` já existente para rejeição (~linha 40) e a função `handleAtivar`.

**Correção:**
1. Adicionar estado para confirmação de aprovação junto ao de rejeição:
```js
// Estado para confirmação de aprovação — segue o mesmo padrão da confirmação de rejeição
const [confirmacaoAprovacao, setConfirmacaoAprovacao] = useState(null); // { id, nome }
```

2. No botão "Aprovar", em vez de chamar `handleAtivar` diretamente, abrir o modal:
```jsx
// Troca: onClick={() => handleAtivar(p.id, p.nome)}
// Por:
onClick={() => setConfirmacaoAprovacao({ id: p.id, nome: p.nome })}
```

3. Adicionar o modal de confirmação de aprovação na renderização (logo acima ou abaixo do modal de rejeição existente):
```jsx
{/* Modal de confirmação de APROVAÇÃO */}
{confirmacaoAprovacao && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
    <div className="bg-surface rounded-2xl p-6 w-full max-w-sm shadow-xl">
      <h3 className="font-bold text-on-surface text-lg mb-2">Confirmar aprovação</h3>
      <p className="text-on-surface-variant text-sm mb-6">
        Aprovar o cadastro de <strong>{confirmacaoAprovacao.nome}</strong>? O paciente poderá acessar o portal imediatamente.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setConfirmacaoAprovacao(null)}
          className="flex-1 h-11 rounded-xl border border-outline text-on-surface font-semibold text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            handleAtivar(confirmacaoAprovacao.id, confirmacaoAprovacao.nome);
            setConfirmacaoAprovacao(null);
          }}
          className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-semibold text-sm"
        >
          Aprovar
        </button>
      </div>
    </div>
  </div>
)}
```

---

## ITEM 5 — Remover pacientes duplicados da base de dados demo [M6]
**Arquivo:** `app/backend/validar_banco.js` (já existe na raiz do backend)
**Problema:** Dois pacientes com nome "Edivaldo Aparecido de Souza" e CRAs "1234567" e "2606194822" estão na base — formato inconsistente com o padrão DEMO-XXXX, indicam dados manuais de teste. Na lista de pacientes, aparecem lado a lado e sem e-mail, passando imagem de bug de validação.

**Correção:** Executar o seguinte script a partir de `app/backend`:

```bash
node -e "
require('dotenv').config();
const knex = require('knex')({ client: 'pg', connection: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
knex('pacientes')
  .whereNotLike('cra', 'DEMO-%')
  .whereNotLike('cra', 'UBS%')
  .del()
  .then(n => { console.log('Removidos:', n, 'pacientes de teste não-DEMO'); return knex.destroy(); })
  .catch(e => { console.error(e.message); process.exit(1); });
"
```

> **Atenção:** Este comando apaga pacientes cujo CRA não começa com `DEMO-` nem com `UBS`. Antes de executar, confirme o que existe rodando:
> ```bash
> node -e "
> require('dotenv').config();
> const knex = require('knex')({ client: 'pg', connection: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
> knex('pacientes').whereNotLike('cra', 'DEMO-%').select('cra','nome').then(r => { console.log(r); return knex.destroy(); });
> "
> ```
> Se a lista mostrar apenas os Edivaldos e nenhum paciente legítimo, prossiga com o delete.

---

## Regra de comentários

Todos os blocos novos devem ter comentário explicativo seguindo o padrão do projeto. Exemplos já incluídos nas correções acima.

---

## Validação

1. `npm run build` em `app/frontend` — deve passar sem erros
2. Abrir `https://gestao-saude-ubs.vercel.app/login-gestor` em aba anônima (sem dados salvos) — campo e-mail deve estar vazio
3. Confirmar que perfil de Ana Clara exibe campo "Bairro" preenchido
4. Abrir `GestorPacientes` — badge de pendentes deve aparecer sem clicar na aba
5. Clicar em "Aprovar" num cadastro pendente — modal de confirmação deve aparecer
6. Rodar o script de limpeza e confirmar que lista de pacientes não tem mais duplicatas

---

## Entregável

Relatório em `.Agent/reports/REPORT_09_correcoes_pos_avaliacao.md` com:
- Linhas exatas modificadas em cada arquivo
- Output do `npm run build`
- Output do script de limpeza de pacientes (quantos removidos)
