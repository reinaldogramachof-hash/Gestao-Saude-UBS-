# TASK_27 — Catálogo de Procedimentos + Tipo UPA nas Unidades Externas
## Para o Agente Codex (Deep Think)

> **Prioridade:** 🟡 Média — melhoria estrutural pós-banca
> **Gerado por:** Claude Sonnet 4.6 — 2026-06-21
> **Deadline:** Pós-banca (após 25/06/2026)
> **Solicitado por:** Reinaldo — gap identificado em teste de "Nova Solicitação"

---

## PROBLEMA IDENTIFICADO

No modal "Nova Solicitação" (gestor cria solicitação para paciente), o campo
**"Nome técnico"** é um input de texto livre. Isso gera dois problemas:

1. **Sem padronização:** cada gestor pode escrever "Hemograma", "HEMOGRAMA COMPLETO",
   "hemograma c/ diferencial" — o sistema não sabe que é o mesmo exame. Isso dificulta
   métricas, relatórios e qualquer automação futura.

2. **Sem link com unidade destino:** o campo "Local de atendimento (se fora da UBS)"
   também é texto livre e não se conecta à tabela `unidades_externas`. Isso significa que,
   ao encaminhar um paciente para o AME, não há relação FK — não dá para saber
   automaticamente que o `encaminhamento` deve ir para o AME SJC.

3. **UPA ausente:** a tabela `unidades_externas` tem um CHECK constraint com tipos
   `(AME, CAPS, CENTRO_ESPECIALIDADES, HOSPITAL, OUTRO)`. UPA (Unidade de Pronto
   Atendimento) não está prevista, apesar de ser parte da rede de SJC.

---

## ESCOPO DA TASK

### Parte A — Imediata: Adicionar tipo UPA (pequena, pode ser antes da banca)

**Migration `022_add_upa_to_unidades_externas.js`:**
```sql
-- Alterar o CHECK constraint para incluir UPA
ALTER TABLE unidades_externas
  DROP CONSTRAINT IF EXISTS unidades_externas_tipo_check;

ALTER TABLE unidades_externas
  ADD CONSTRAINT unidades_externas_tipo_check
  CHECK (tipo IN ('AME', 'CAPS', 'CENTRO_ESPECIALIDADES', 'HOSPITAL', 'UPA', 'OUTRO'));
```

**Seed: adicionar UPA ao `004_unidades_externas.js`:**
```js
{
  nome: 'UPA Norte SJC',
  tipo: 'UPA',
  email: 'upa.norte@sjc.sp.gov.br',
  senha_hash,  // mesma senha 'externa123' do seed
  ativo: true,
},
{
  nome: 'UPA Sul SJC',
  tipo: 'UPA',
  email: 'upa.sul@sjc.sp.gov.br',
  senha_hash,
  ativo: true,
}
```

**Frontend — atualizar labels que mencionam os tipos de unidade** (se houver hardcode):
- `app/frontend/src/pages/gestor/RegulacaoGestor.jsx` — verificar se filtra por tipo
- `app/frontend/src/pages/externa/DashboardExterna.jsx` — nenhum label de tipo hardcoded
- `app/frontend/src/pages/externa/EncaminhamentosExterna.jsx` — verificar

---

### Parte B — Módulo de Catálogo de Procedimentos (pós-banca, complexo)

#### B1. Nova tabela `catalogo_procedimentos`

```sql
CREATE TABLE catalogo_procedimentos (
  id              SERIAL PRIMARY KEY,
  nome            VARCHAR(200) NOT NULL,           -- ex: "Hemograma Completo"
  especialidade   VARCHAR(100),                    -- ex: "Hematologia"
  tipo_unidade    VARCHAR(50),                     -- AME | CAPS | HOSPITAL | UPA | UBS | NULL (qualquer)
  cid_sugerido    VARCHAR(10),                     -- ex: "Z00.0" (opcional, uso clínico futuro)
  ativo           BOOLEAN NOT NULL DEFAULT true,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Índices:**
```sql
CREATE INDEX idx_catalogo_tipo_unidade ON catalogo_procedimentos(tipo_unidade);
CREATE INDEX idx_catalogo_nome ON catalogo_procedimentos USING gin(to_tsvector('portuguese', nome));
```

#### B2. Seed inicial `005_catalogo_procedimentos.js`

Procedimentos comuns no SUS de SJC, organizados por onde são realizados:

```
UBS: Hemograma Completo, Glicemia em Jejum, Urina Tipo I, ECG, Curativo
AME: Ecocardiograma, Espirometria, Colonoscopia, Endoscopia Digestiva Alta
CAPS: Consulta Psiquiátrica, Avaliação Psicológica, Terapia em Grupo
HOSPITAL: Cirurgia Ambulatorial, Internação, Hemodiálise
UPA: Sutura, Redução de Fratura, Hidratação Venosa, Atendimento de Urgência
CENTRO_ESPECIALIDADES: Ortopedia, Dermatologia, Oftalmologia, Otorrinolaringologia
```

#### B3. Modificar `solicitacoes` para referenciar o catálogo (opcional, sem quebrar retrocompatibilidade)

```sql
ALTER TABLE solicitacoes
  ADD COLUMN catalogo_id INTEGER REFERENCES catalogo_procedimentos(id) ON DELETE SET NULL;
```
> Coluna NULLABLE: solicitações antigas continuam com `nome_tecnico` livre. Novas
> solicitações podem (mas não são obrigadas a) referenciar o catálogo.

#### B4. Nova rota no backend: `GET /api/gestor/catalogo-procedimentos`

```
Parâmetros query opcionais:
  ?tipo_unidade=AME    → filtra por tipo de unidade
  ?q=hemograma         → busca textual no nome
  
Retorna: [{ id, nome, especialidade, tipo_unidade }]
```

#### B5. Modificar modal "Nova Solicitação" no frontend

- Campo "Nome técnico" vira um **combobox com autocomplete** que busca em `/gestor/catalogo-procedimentos`
- O gestor pode continuar digitando livremente (fallback para texto livre)
- Ao selecionar um item do catálogo, o campo `catalogo_id` é enviado junto
- Se o `tipo_unidade` do item selecionado != null, sugerir automaticamente a unidade destino

---

## VARREDURA QUE O CODEX DEVE FAZER

Antes de implementar, o Codex deve vasculhar:

1. **Todos os lugares onde `especialidade` aparece como texto livre** em rotas e tabelas:
   - `app/backend/src/routes/gestor.js` — criação de solicitação
   - `app/backend/src/routes/paciente.js` — GET solicitações (o que é exibido)
   - `app/backend/src/db/migrations/` — definição dos campos

2. **Onde `local_executor` ou campo similar poderia virar FK** para `unidades_externas`:
   - `app/backend/src/db/migrations/007_create_solicitacoes.js` — estrutura da tabela
   - `app/backend/src/db/migrations/20260618030419_create_encaminhamentos_table.js` — ver campo `especialidade`

3. **Todos os tipos hardcoded** de unidades externas no frontend:
   - Procurar por `'AME'`, `'CAPS'`, `'HOSPITAL'` etc. em arquivos JSX
   - Avaliar se viram uma constante compartilhada ou continuam hardcoded

4. **Impacto nos testes:**
   - `app/backend/tests/` — quais testes de solicitação precisarão ser atualizados

---

## RESTRIÇÕES

- **NÃO alterar** estrutura de `encaminhamentos` (recém implementada na TASK_26)
- **NÃO quebrar** fluxo atual: `catalogo_id` é nullable, texto livre continua funcionando
- **NÃO executar** migrations de DROP em nada (nem nas tabelas descartadas de transporte/social)
- Todos os arquivos novos devem ter **comentários explicativos** conforme CLAUDE.md
- Mobile-first obrigatório em qualquer tela nova
- LGPD: rota `/gestor/catalogo-procedimentos` exige token de gestor

---

## ENTREGÁVEIS ESPERADOS

### Parte A (pode ser feita antes da banca):
- [ ] Migration `022_add_upa_to_unidades_externas.js`
- [ ] Seed `004_unidades_externas.js` atualizado com 2 UPAs
- [ ] Verificação de hardcodes de tipo no frontend

### Parte B (pós-banca):
- [ ] Migration `023_create_catalogo_procedimentos.js`
- [ ] Migration `024_add_catalogo_id_to_solicitacoes.js`
- [ ] Seed `005_catalogo_procedimentos.js` com ~30 procedimentos SUS
- [ ] Rota `GET /api/gestor/catalogo-procedimentos`
- [ ] Modal "Nova Solicitação" com combobox de autocomplete
- [ ] Módulo de configuração do gestor: `/gestor/catalogo` (CRUD de procedimentos da rede)

---

## NOTAS ARQUITETURAIS

**Por que catálogo e não enum no banco?**
Enum no PostgreSQL é rígido — adicionar um novo procedimento exigiria migration. Uma tabela
de catálogo permite que o próprio gestor (perfil admin) adicione procedimentos via interface
sem precisar de deploy.

**Por que manter texto livre como fallback?**
Retrocompatibilidade com dados existentes e flexibilidade para casos atípicos. O sistema
não deve bloquear o gestor de criar uma solicitação só porque o procedimento não está no
catálogo — ele pode digitá-lo manualmente.

**Conexão com Regulação (TASK_23):**
No futuro, ao criar um encaminhamento, o sistema poderá sugerir automaticamente a unidade
correta baseado no `tipo_unidade` do procedimento do catálogo. Ex: paciente precisa de
Colonoscopia → sistema sugere encaminhar para o AME SJC.
