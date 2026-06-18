# TASK 04 — Backend Clínico (Migrations + Rotas)
**Origem:** Claude Cowork (Arquiteto)
**Destino:** Antigravity Agent (Executor)
**Projeto:** Gestão Saúde UBS+
**Tipo:** Implementação — migrations + rotas backend
**Prioridade:** 🔴 Alta — bloqueia TASK_05 (frontend)
**Data:** 2026-06-18

---

## CONTEXTO

O modelo de dados atual cobre apenas gestão burocrática de filas.
Um avaliador médico na banca vai exigir:
- Dados clínicos do paciente (alergias, comorbidades, medicamentos de uso contínuo)
- Resultado e CID-10 por solicitação (exame/consulta)
- Linha do tempo de atendimentos em qualquer unidade (UBS, AME, CAPS, hospital)

Esta task implementa **toda a camada de dados e API**. O frontend vem em TASK_05.

---

## LEITURA OBRIGATÓRIA ANTES DE QUALQUER CÓDIGO

| Arquivo | O que observar |
|---|---|
| `app/backend/src/db/migrations/011_add_local_executor_solicitacoes.js` | Padrão de `alterTable` com rollback |
| `app/backend/src/db/migrations/002_create_usuarios_gestores.js` | Padrão de `createTable` com comentários |
| `app/backend/src/routes/gestor.js` (linhas 539-573) | `PUT /paciente/:id` a ser estendido |
| `app/backend/src/routes/gestor.js` (linhas 266-345) | `PUT /solicitacao/:id/status` — referência de transação |

---

## BLOCO A — MIGRATIONS

### Migration 013: Campos clínicos em `pacientes`

**Arquivo:** `app/backend/src/db/migrations/013_add_campos_clinicos_pacientes.js`

```js
/**
 * MIGRATION 013 — Campos clínicos na tabela pacientes
 * Finalidade: Adiciona dados de saúde fundamentais ao cadastro do paciente,
 *             permitindo que médicos e gestores registrem informações clínicas
 *             diretamente no sistema sem depender de prontuários externos.
 *
 * Por que texto livre e não tabelas normalizadas:
 *   Para o MVP e a banca, campos TEXT são suficientes e rápidos de preencher.
 *   Em produção real, alergias e comorbidades seriam entidades próprias com
 *   codificação padronizada (SNOMED, CID-10). Isso é escopo pós-aprovação.
 *
 * Depende de: pacientes (003)
 */
exports.up = function (knex) {
  return knex.schema.alterTable('pacientes', (table) => {
    // Dados vitais básicos
    table.string('tipo_sanguineo', 5).nullable();          // Ex: 'A+', 'O-', 'AB+'
    table.decimal('peso_kg', 5, 2).nullable();             // Ex: 72.50
    table.smallint('altura_cm').nullable();                // Ex: 175

    // Informações críticas de segurança — um médico DEVE ver antes de prescrever
    table.text('alergias').nullable();                     // Ex: "Penicilina, Dipirona"
    table.text('comorbidades').nullable();                 // Ex: "Diabetes tipo 2, Hipertensão arterial"
    table.text('medicamentos_uso_continuo').nullable();    // Ex: "Metformina 500mg 2x/dia, Losartana 50mg"

    // Espaço livre para anotações clínicas da equipe
    table.text('observacoes_clinicas').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('pacientes', (table) => {
    table.dropColumn('tipo_sanguineo');
    table.dropColumn('peso_kg');
    table.dropColumn('altura_cm');
    table.dropColumn('alergias');
    table.dropColumn('comorbidades');
    table.dropColumn('medicamentos_uso_continuo');
    table.dropColumn('observacoes_clinicas');
  });
};
```

---

### Migration 014: Resultado e CID-10 em `solicitacoes`

**Arquivo:** `app/backend/src/db/migrations/014_add_resultado_cid_solicitacoes.js`

```js
/**
 * MIGRATION 014 — Resultado clínico e CID-10 em solicitacoes
 * Finalidade: Permite registrar o RESULTADO de um exame ou consulta e o
 *             diagnóstico (CID-10) vinculado à solicitação, transformando
 *             o sistema de "rastreador de fila" em "rastreador clínico".
 *
 * Depende de: solicitacoes (007)
 */
exports.up = function (knex) {
  return knex.schema.alterTable('solicitacoes', (table) => {
    // Resultado em texto livre — laudos, conclusões de especialistas, etc.
    table.text('resultado').nullable();

    // CID-10: código de diagnóstico internacional (ex: 'E11', 'I10', 'J45.0')
    table.string('cid_10', 10).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('solicitacoes', (table) => {
    table.dropColumn('resultado');
    table.dropColumn('cid_10');
  });
};
```

---

### Migration 015: Tabela `atendimentos`

**Arquivo:** `app/backend/src/db/migrations/015_create_atendimentos.js`

```js
/**
 * MIGRATION 015 — Tabela: atendimentos
 * Finalidade: Registra encontros clínicos do paciente em QUALQUER unidade de
 *             saúde — UBS, AME, CAPS, Centro de Especialidades, hospital, etc.
 *             Esta é a "linha do tempo clínica" do paciente, distinta das
 *             solicitacoes (que rastreiam processos burocráticos).
 *
 * Diferença de solicitacoes:
 *   solicitacoes = pedido administrativo de exame/consulta + rastreio de status
 *   atendimentos = registro do encontro clínico real — o que aconteceu, quando,
 *                  onde, com quem, qual diagnóstico, qual conduta
 *
 * Depende de: pacientes (003), ubs (001), usuarios_gestores (002)
 */
exports.up = function (knex) {
  return knex.schema.createTable('atendimentos', (table) => {
    table.increments('id').primary();

    // Paciente atendido
    table.integer('paciente_id').unsigned().notNullable()
      .references('id').inTable('pacientes')
      .onDelete('CASCADE');

    // Gestor que registrou este atendimento no sistema
    table.integer('registrado_por').unsigned().nullable()
      .references('id').inTable('usuarios_gestores')
      .onDelete('SET NULL');

    // Quando ocorreu o atendimento (pode ser retroativo)
    table.date('data_atendimento').notNullable();

    // Onde ocorreu — nome livre da unidade
    table.string('unidade', 200).notNullable();            // Ex: "UBS Vila Industrial", "AME Zona Leste"

    // Categoria da unidade para filtros e ícones no frontend
    // Valores: 'ubs', 'ame', 'caps', 'centro_especialidades', 'hospital', 'pronto_socorro', 'outro'
    table.string('tipo_unidade', 30).nullable();

    // Especialidade médica do atendimento
    table.string('especialidade', 100).nullable();         // Ex: "Cardiologia", "Ortopedia", "Clínica Geral"

    // Nome do profissional que realizou o atendimento (não vinculado ao sistema)
    table.string('profissional', 150).nullable();

    // Diagnósticos CID-10 — principal e secundário
    table.string('cid_10_principal', 10).nullable();       // Ex: 'I10' (Hipertensão)
    table.string('cid_10_secundario', 10).nullable();

    // O que foi decidido/prescrito durante o encontro
    table.text('conduta').nullable();                      // Ex: "Ajuste de dose de losartana para 100mg"

    // Observações livres da equipe sobre o atendimento
    table.text('observacoes').nullable();

    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('atendimentos');
};
```

---

## BLOCO B — ROTAS BACKEND

Todas as rotas novas devem ser inseridas em `app/backend/src/routes/gestor.js`.
**Local exato:** após o bloco `PATCH /solicitacao/:id/escalar` e antes do bloco `GET /medicamentos`.

### B1 — Estender PUT /paciente/:id para campos clínicos

**Localizar** o trecho atual (linha ~542) e **substituir** apenas a desestruturação do body e o objeto de update. O resto da rota permanece idêntico.

```js
// ANTES:
const { nome, telefone, email, ativo } = req.body;
// ...
.update({
  nome: nome ?? existente.nome,
  telefone: telefone ?? existente.telefone,
  email: email ?? existente.email,
  ativo: ativo ?? existente.ativo,
  atualizado_em: knex.fn.now()
})

// DEPOIS:
const {
  nome, telefone, email, ativo,
  // Campos clínicos — opcionais, null preserva valor existente
  tipo_sanguineo, peso_kg, altura_cm,
  alergias, comorbidades, medicamentos_uso_continuo, observacoes_clinicas,
} = req.body;
// ...
.update({
  nome:                       nome ?? existente.nome,
  telefone:                   telefone ?? existente.telefone,
  email:                      email ?? existente.email,
  ativo:                      ativo ?? existente.ativo,
  // Usa null explícito para apagar um campo clínico; undefined preserva o valor
  tipo_sanguineo:             tipo_sanguineo !== undefined ? tipo_sanguineo : existente.tipo_sanguineo,
  peso_kg:                    peso_kg !== undefined ? peso_kg : existente.peso_kg,
  altura_cm:                  altura_cm !== undefined ? altura_cm : existente.altura_cm,
  alergias:                   alergias !== undefined ? alergias : existente.alergias,
  comorbidades:               comorbidades !== undefined ? comorbidades : existente.comorbidades,
  medicamentos_uso_continuo:  medicamentos_uso_continuo !== undefined ? medicamentos_uso_continuo : existente.medicamentos_uso_continuo,
  observacoes_clinicas:       observacoes_clinicas !== undefined ? observacoes_clinicas : existente.observacoes_clinicas,
  atualizado_em:              knex.fn.now(),
})
```

> **Atenção:** O `GET /paciente/:id` usa `pacientes.*` — os novos campos já
> serão retornados automaticamente sem alterar a rota de leitura.

---

### B2 — Nova rota: PATCH /solicitacao/:id/resultado

Permite registrar ou atualizar o resultado e o CID-10 de uma solicitação,
independentemente do status atual. Inserir após o bloco `PATCH /escalar`.

```js
// ─── PATCH /api/gestor/solicitacao/:id/resultado ─────────────────────────────
// Registra ou atualiza o resultado clínico e o CID-10 de uma solicitação.
// Pode ser chamado mesmo com status != 'concluido' (ex: resultado parcial).
// Body: { resultado: string, cid_10: string }
router.patch('/solicitacao/:id/resultado', async (req, res) => {
  try {
    const { resultado, cid_10 } = req.body;

    // Ao menos um dos dois campos deve ser enviado
    if (resultado === undefined && cid_10 === undefined) {
      return res.status(400).json({ error: 'Informe ao menos resultado ou cid_10.' });
    }

    const solicitacao = await knex('solicitacoes')
      .where({ id: req.params.id })
      .first();

    if (!solicitacao) {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }

    const atualizada = await knex('solicitacoes')
      .where({ id: req.params.id })
      .update({
        // undefined não sobrescreve — null limpa o campo explicitamente
        resultado:    resultado !== undefined ? resultado : solicitacao.resultado,
        cid_10:       cid_10    !== undefined ? cid_10    : solicitacao.cid_10,
        atualizado_em: knex.fn.now(),
      })
      .returning('*')
      .then(rows => rows[0]);

    return res.json(atualizada);
  } catch (err) {
    console.error('[PATCH /gestor/solicitacao/:id/resultado]', err);
    return res.status(500).json({ error: 'Erro ao registrar resultado.' });
  }
});
```

---

### B3 — Nova rota: GET /paciente/:id/atendimentos

```js
// ─── GET /api/gestor/paciente/:id/atendimentos ────────────────────────────────
// Retorna todos os atendimentos clínicos do paciente, do mais recente ao mais antigo.
// Inclui nome de quem registrou para auditoria.
router.get('/paciente/:id/atendimentos', async (req, res) => {
  try {
    const paciente = await knex('pacientes').where({ id: req.params.id }).first();
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    const atendimentos = await knex('atendimentos')
      .leftJoin('usuarios_gestores', 'atendimentos.registrado_por', 'usuarios_gestores.id')
      .where('atendimentos.paciente_id', req.params.id)
      .select(
        'atendimentos.*',
        'usuarios_gestores.nome as registrado_por_nome',
      )
      .orderBy('atendimentos.data_atendimento', 'desc');

    return res.json(atendimentos);
  } catch (err) {
    console.error('[GET /gestor/paciente/:id/atendimentos]', err);
    return res.status(500).json({ error: 'Erro ao buscar atendimentos.' });
  }
});
```

---

### B4 — Nova rota: POST /paciente/:id/atendimento

```js
// ─── POST /api/gestor/paciente/:id/atendimento ───────────────────────────────
// Registra um novo atendimento clínico para o paciente.
// Body: { data_atendimento, unidade, tipo_unidade, especialidade,
//         profissional, cid_10_principal, cid_10_secundario, conduta, observacoes }
router.post('/paciente/:id/atendimento', async (req, res) => {
  try {
    const {
      data_atendimento, unidade, tipo_unidade, especialidade,
      profissional, cid_10_principal, cid_10_secundario, conduta, observacoes,
    } = req.body;

    if (!data_atendimento || !unidade) {
      return res.status(400).json({ error: 'Data do atendimento e unidade são obrigatórios.' });
    }

    const paciente = await knex('pacientes').where({ id: req.params.id }).first();
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    const [atendimento] = await knex('atendimentos')
      .insert({
        paciente_id:       req.params.id,
        registrado_por:    req.user.id,
        data_atendimento,
        unidade,
        tipo_unidade:      tipo_unidade || null,
        especialidade:     especialidade || null,
        profissional:      profissional || null,
        cid_10_principal:  cid_10_principal || null,
        cid_10_secundario: cid_10_secundario || null,
        conduta:           conduta || null,
        observacoes:       observacoes || null,
      })
      .returning('*');

    return res.status(201).json(atendimento);
  } catch (err) {
    console.error('[POST /gestor/paciente/:id/atendimento]', err);
    return res.status(500).json({ error: 'Erro ao registrar atendimento.' });
  }
});
```

---

### B5 — Nova rota: PUT /atendimento/:id

```js
// ─── PUT /api/gestor/atendimento/:id ─────────────────────────────────────────
// Atualiza um atendimento clínico existente.
// Permite corrigir data, unidade, resultado, CID etc. após o registro inicial.
// Body: qualquer combinação dos campos de atendimento (todos opcionais)
router.put('/atendimento/:id', async (req, res) => {
  try {
    const existente = await knex('atendimentos').where({ id: req.params.id }).first();
    if (!existente) {
      return res.status(404).json({ error: 'Atendimento não encontrado.' });
    }

    const {
      data_atendimento, unidade, tipo_unidade, especialidade,
      profissional, cid_10_principal, cid_10_secundario, conduta, observacoes,
    } = req.body;

    const [atualizado] = await knex('atendimentos')
      .where({ id: req.params.id })
      .update({
        data_atendimento:  data_atendimento  ?? existente.data_atendimento,
        unidade:           unidade           ?? existente.unidade,
        tipo_unidade:      tipo_unidade      !== undefined ? tipo_unidade      : existente.tipo_unidade,
        especialidade:     especialidade     !== undefined ? especialidade     : existente.especialidade,
        profissional:      profissional      !== undefined ? profissional      : existente.profissional,
        cid_10_principal:  cid_10_principal  !== undefined ? cid_10_principal  : existente.cid_10_principal,
        cid_10_secundario: cid_10_secundario !== undefined ? cid_10_secundario : existente.cid_10_secundario,
        conduta:           conduta           !== undefined ? conduta           : existente.conduta,
        observacoes:       observacoes       !== undefined ? observacoes       : existente.observacoes,
        atualizado_em:     knex.fn.now(),
      })
      .returning('*');

    return res.json(atualizado);
  } catch (err) {
    console.error('[PUT /gestor/atendimento/:id]', err);
    return res.status(500).json({ error: 'Erro ao atualizar atendimento.' });
  }
});
```

---

### B6 — Nova rota: DELETE /atendimento/:id

```js
// ─── DELETE /api/gestor/atendimento/:id ──────────────────────────────────────
// Remove permanentemente um atendimento clínico.
// Usado para corrigir registros inseridos por engano.
// Não há soft delete — atendimentos errôneos simplesmente não existiram.
router.delete('/atendimento/:id', async (req, res) => {
  try {
    const existente = await knex('atendimentos').where({ id: req.params.id }).first();
    if (!existente) {
      return res.status(404).json({ error: 'Atendimento não encontrado.' });
    }

    await knex('atendimentos').where({ id: req.params.id }).delete();
    return res.json({ mensagem: 'Atendimento removido com sucesso.' });
  } catch (err) {
    console.error('[DELETE /gestor/atendimento/:id]', err);
    return res.status(500).json({ error: 'Erro ao remover atendimento.' });
  }
});
```

---

## ORDEM DE EXECUÇÃO

1. Criar os 3 arquivos de migration (013, 014, 015)
2. Executar `npx knex migrate:latest` na pasta `app/backend` para aplicar ao banco
3. Modificar `PUT /paciente/:id` em gestor.js
4. Inserir as 5 novas rotas (B2 a B6) no bloco correto de gestor.js
5. Verificar que o servidor sobe sem erros (`node src/server.js` ou equivalente)

---

## RESTRIÇÕES

- NÃO modificar nenhum arquivo de frontend
- NÃO alterar rotas existentes além do `PUT /paciente/:id` especificado
- NÃO criar novo arquivo de rotas — todas as rotas vão em `gestor.js`
- Comentários obrigatórios em todos os blocos (padrão CLAUDE.md)
- Os arquivos de migration devem ter rollback (`exports.down`) correto

---

## STATUS DE RETORNO

Gerar `REPORT_04_backend_clinico.md` na raiz com:

```
# REPORT 04 — Backend Clínico
**De:** Antigravity Agent
**Para:** Claude Cowork (Arquiteto)
**Data:** [data]

## Migrations criadas
[Lista dos 3 arquivos com confirmação de que migrate:latest foi executado]

## Saída do migrate:latest
[Output do comando — confirmar que as 3 migrations estão em "Batch X run: 3 migrations"]

## Rotas implementadas
[Lista das 6 mudanças de rota com confirmação de localização no gestor.js]

## Diff de gestor.js
[Diff completo das alterações em gestor.js]

## Teste rápido
[Resultado de curl ou equivalente nas rotas principais, OU confirmação
 de que o servidor subiu sem erros após as alterações]

## Pendências
[Qualquer desvio do escopo]
```
