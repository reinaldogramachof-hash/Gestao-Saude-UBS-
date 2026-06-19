# TASK 06 — Demo Data + Correções Finais Pré-Banca
**De:** Claude Sonnet 4.6 (Arquiteto)
**Para:** Antigravity (Executor)
**Data:** 2026-06-18
**Prazo real:** Banca em 25/06 — estas correções devem estar prontas em até 24h

---

## Contexto

O módulo clínico (TASK_04 + TASK_05) foi implementado com sucesso: migrations 013-015 aplicadas, rotas no backend, e PerfilPaciente.jsx com 3 abas (dados, solicitações, linha do tempo). O build passa.

**Problema central:** nenhuma das novas funcionalidades clínicas é visível na demo porque:
1. O seed de demo (003_demo_data.js) não tem dados clínicos nem atendimentos.
2. Dois arquivos do portal do paciente ainda usam `new Date()` diretamente, exibindo data errada em SJC (UTC-3).

Esta task resolve os 3 itens abaixo em ordem de prioridade.

---

## ITEM 1 — Seed de dados clínicos para a demo (CRÍTICO)

**Arquivo:** `app/backend/src/db/seeds/003_demo_data.js`

### 1.1 — Adicionar limpeza de atendimentos no início do seed

No bloco de limpeza (seção "1. LIMPEZA"), adicionar **antes** de deletar pacientes:

```js
// Limpar atendimentos dos pacientes de demo antes de deletá-los
if (pacienteIds.length > 0) {
  await knex('atendimentos').whereIn('paciente_id', pacienteIds).del();
}
```

Isso vai antes do `await knex('solicitacoes')...del()` existente.

### 1.2 — Atualizar dados clínicos da paciente DEMO-0001 (Ana Clara Souza)

Após o `insertedPacientes` ser gerado, adicionar um `UPDATE` para enriquecer Ana Clara com dados clínicos:

```js
// ── Dados Clínicos: Ana Clara Souza (DEMO-0001) ──────────────────────────────
// Atualiza o prontuário da paciente principal da demo com dados clínicos
// realistas, permitindo demonstrar a seção de Dados Clínicos na banca.
const anaClara = insertedPacientes[0]; // DEMO-0001 é sempre o primeiro
await knex('pacientes').where({ id: anaClara.id }).update({
  tipo_sanguineo:            'O+',
  peso_kg:                   68.5,
  altura_cm:                 162,
  alergias:                  'Dipirona, Amoxicilina',
  comorbidades:              'Hipertensão arterial (CID: I10), Diabetes tipo 2 (CID: E11)',
  medicamentos_uso_continuo: 'Losartana 50mg 1x/dia, Metformina 500mg 2x/dia',
  observacoes_clinicas:      'Em acompanhamento regular. Última HbA1c: 7.2% (março/2026). PA controlada.',
});
```

### 1.3 — Inserir atendimentos clínicos para Ana Clara

Logo após o bloco acima, inserir 3 atendimentos realistas que representem a jornada clínica dela:

```js
// ── Linha do Tempo Clínica: Ana Clara Souza (DEMO-0001) ──────────────────────
// 3 atendimentos em unidades distintas — demonstra o propósito da aba
// "Linha do Tempo": centralizar o histórico clínico disperso em múltiplos serviços.

// Buscar o gestor da UBS 4 para usar como registrado_por (pega o primeiro disponível)
const gestorDemo = await knex('usuarios_gestores').where({ ubs_id: UBS_ID }).first();

await knex('atendimentos').insert([
  {
    paciente_id:       anaClara.id,
    registrado_por:    gestorDemo?.id || null,
    data_atendimento:  '2026-01-20',
    unidade:           'Hospital Municipal Dr. Josefino Fernandes Lobo',
    tipo_unidade:      'hospital',
    especialidade:     'Pneumologia',
    profissional:      'Dra. Carla Moreira',
    cid_10_principal:  'J18.9',
    cid_10_secundario: null,
    conduta:           'Internação por 3 dias. Antibioticoterapia com Amoxicilina (contraindicada — substituída por Azitromicina por alergia registrada). Alta com retorno em 30 dias.',
    observacoes:       'Paciente relatou alergia a Amoxicilina durante triagem — reforçar no prontuário.',
  },
  {
    paciente_id:       anaClara.id,
    registrado_por:    gestorDemo?.id || null,
    data_atendimento:  '2026-03-15',
    unidade:           'AME São José dos Campos — Zona Leste',
    tipo_unidade:      'ame',
    especialidade:     'Cardiologia',
    profissional:      'Dr. Paulo Mendes',
    cid_10_principal:  'I10',
    cid_10_secundario: 'E11',
    conduta:           'Ajuste de dose: Losartana 50mg → 100mg. Solicitado ecocardiograma de controle. Retorno em 90 dias.',
    observacoes:       null,
  },
  {
    paciente_id:       anaClara.id,
    registrado_por:    gestorDemo?.id || null,
    data_atendimento:  '2026-05-08',
    unidade:           'UBS Alto da Ponte',
    tipo_unidade:      'ubs',
    especialidade:     'Clínica Geral',
    profissional:      null,
    cid_10_principal:  'E11',
    cid_10_secundario: null,
    conduta:           'Renovação de receituário. Hemograma e HbA1c solicitados. Orientação nutricional.',
    observacoes:       'Paciente relata aderência ao tratamento. Glicemia de jejum: 126 mg/dL.',
  },
]);

console.log('✅ Dados clínicos e linha do tempo inseridos para DEMO-0001 (Ana Clara).');
```

### 1.4 — Executar o seed após a edição

```bash
cd app/backend
npx knex seed:run --specific=003_demo_data.js
```

Confirmar no terminal que as 3 linhas de atendimentos foram inseridas sem erro.

---

## ITEM 2 — Corrigir bug de data em 2 arquivos do portal do paciente (M-17)

O helper `formatarDataBR` em `src/utils/statusHelper.js` já resolve o bug de UTC-3 (adiciona 'T12:00:00' em strings de data pura). Dois arquivos do portal do paciente ainda ignoram isso.

### 2.1 — `app/frontend/src/pages/paciente/AgendamentosPaciente.jsx`

**Localizar** a função que formata `data_hora` dos agendamentos (por volta da linha 79):

```js
const data = new Date(dt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
const hora = new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
```

**Substituir por** (usar helper existente para data, manter hora — `data_hora` tem timestamp completo, mas a data ainda pode ter offset):

```js
// Ancorando ao meio-dia local para evitar o bug de UTC-3 que exibe o dia anterior
const dtObj = dt.includes('T') ? new Date(dt) : new Date(dt + 'T12:00:00');
const data = dtObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
const hora = dtObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
```

Adicionar import do `formatarDataBR` se ainda não estiver importado:
```js
import { formatarDataBR } from '../../utils/statusHelper';
```

### 2.2 — `app/frontend/src/pages/paciente/Medicamentos.jsx`

**Localizar** a função que formata data de atualização (por volta da linha 20):

```js
const d = new Date(iso);
```

**Substituir** pela lógica do helper ou adicionar o fix de anchor:

```js
// Fix UTC-3: strings de data pura ('YYYY-MM-DD') são interpretadas como UTC meia-noite,
// exibindo o dia anterior em SJC. Ancoramos ao meio-dia local para corrigir.
const d = iso && !iso.includes('T') ? new Date(iso + 'T12:00:00') : new Date(iso);
```

---

## ITEM 3 — Atualizar o ensaio da demo para incluir os módulos novos

**Arquivo:** `.Agent/reports/Ensaio_Demo_Banca_25-06.md`

### 3.1 — Adicionar Cena 3b após a Cena 3 existente

Inserir a cena abaixo **entre** a Cena 3 (Perfil + Nova Solicitação) e a Cena 4 (Atualizar Status):

```markdown
### Cena 3b — Gestor: prontuário clínico e linha do tempo (1–2 min)

**O que mostrar:** Abas "Dados" e "Linha do Tempo" no perfil de Ana Clara

1. No perfil de Ana Clara, clicar na aba **"Dados"**
2. Rolar até a seção **"Dados Clínicos"**:
   - Mostrar tipo sanguíneo O+, peso e altura
   - Destacar os cards coloridos: Alergias (âmbar), Comorbidades (vermelho), Medicamentos (azul)
3. Clicar na aba **"Linha do Tempo"**
4. Mostrar os 3 atendimentos registrados: Hospital (Jan), AME Cardiologia (Mar), UBS (Mai)
5. Apontar que o primeiro atendimento registrou **alerta de alergia ao Amoxicilina**

**Frase de apoio:** *"O gestor consegue ver toda a jornada clínica do paciente — não só o que está na fila da UBS, mas tudo que aconteceu em outros serviços. Isso é fundamental para a equipe de saúde coordenar o cuidado."*
```

### 3.2 — Adicionar menção ao PainelMedico na seção "Perguntas prováveis da banca"

Adicionar ao final da seção de perguntas:

```markdown
**"Profissionais de saúde conseguem usar o sistema?"**
→ Sim. O sistema tem um Painel Médico (acessível via sidebar → ícone "stethoscope") onde o médico busca qualquer paciente e visualiza o prontuário clínico e a linha do tempo em modo somente leitura — sem edição, sem cadastro de novos dados.
```

---

## Verificação Final

Após concluir os 3 itens:

```bash
# 1. Confirmar seed executado
cd app/backend
npx knex seed:run --specific=003_demo_data.js

# 2. Build do frontend deve continuar passando
cd ../frontend
npm run build
```

Build deve passar sem erros. Se o `new Date()` nos arquivos do paciente causar erro de lint, ajustar conforme necessário.

---

## O que NÃO alterar

- `app/backend/src/routes/paciente.js` — C-02 já está resolvido via `CAMPOS_SOLICITACAO_PACIENTE` (não expõe `observacao_gestor`).
- `app/frontend/src/utils/statusHelper.js` — `STATUS_LABELS` e `formatarDataBR` já estão corretos.
- `app/frontend/src/components/paciente/PacienteLayout.jsx` — logout já está visível.
- Qualquer arquivo do portal do gestor — fora de escopo desta task.
- Migrations — não criar novas migrations. As 015 já estão aplicadas.

---

## Relatório esperado

Ao concluir, gerar `REPORT_06_demo_e_correcoes.md` na raiz com:
- Confirmação de que o seed rodou sem erro
- Saída do `npm run build` (✅ ou ❌)
- Lista exata de linhas alteradas nos 2 arquivos JSX
- Confirmação de que o ensaio foi atualizado
