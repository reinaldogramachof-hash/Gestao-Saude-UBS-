# Roteiro de Avaliação Especialista — Portal do Gestor
**Agente executor:** Claude in Chrome (automação de browser)
**Papel:** Avaliador especialista em sistemas de gestão em saúde pública
**Data:** 2026-06-18
**URL de entrada:** https://gestao-saude-ubs.vercel.app/login-gestor

---

## Contexto do Sistema

Você está avaliando o **Gestão Saúde UBS+**, um sistema web desenvolvido como projeto de extensão universitária (UFBRA) para a Prefeitura de São José dos Campos (SP).

**Problema que o sistema resolve:** A falta de transparência de informação nas Unidades Básicas de Saúde (UBS). Pacientes não sabem o status dos seus exames, consultas e pedidos — ligam para a UBS repetidamente, formam filas desnecessárias e ficam desinformados. O sistema permite que a equipe gestora atualize o status de cada solicitação e o paciente acesse essa informação pelo celular, sem precisar ir à UBS.

**Dois portais:**
- **Portal do Gestor** (você vai avaliar este): usado pela equipe interna da UBS para cadastrar pacientes, atualizar status de exames/consultas, gerenciar medicamentos, comunicados e agendamentos.
- **Portal do Paciente**: app mobile-first que o cidadão acessa pelo celular para ver o status das suas solicitações em linguagem simples.

**Seu papel:** Avaliador especialista em sistemas de gestão para saúde pública. Você tem experiência em UX para usuários não-técnicos (recepcionistas, gestores de UBS), fluxos de trabalho em saúde, e usabilidade de sistemas administrativos. Seja crítico e preciso.

---

## Credenciais de Acesso

| Campo | Valor |
|---|---|
| URL | https://gestao-saude-ubs.vercel.app/login-gestor |
| E-mail | interlagos@gestaoubs.dev |
| Senha | senha123 |

Se este login não mostrar pacientes, tente também: `centro@gestaoubs.dev` / `senha123`

---

## Roteiro de Avaliação

Execute cada seção em sequência. Para cada tela, registre: o que funciona, o que está quebrado ou confuso, e o que está faltando do ponto de vista de um gestor de UBS real.

---

### SEÇÃO 1 — Login e primeiro acesso (2 min)

1. Acesse `https://gestao-saude-ubs.vercel.app/login-gestor`
2. Observe a tela de login: está clara? O campo de e-mail e senha estão visíveis? Há feedback de erro ao errar a senha?
3. Faça login com `interlagos@gestaoubs.dev` / `senha123`
4. Observe o tempo de carregamento até o Dashboard aparecer.

**Avalie:** Profissionalismo da tela de login, clareza do formulário, feedback de loading/erro.

---

### SEÇÃO 2 — Dashboard principal (3 min)

Após login, você está no Dashboard do Gestor. Avalie:

1. Os **cards de métricas** (pacientes ativos, em análise, autorizados etc.) — os números fazem sentido? Estão visíveis?
2. O bloco **"Atenção Imediata"** — mostra alertas de pacientes aguardando há muitos dias? Clique em algum alerta se houver.
3. O **badge âmbar** de cadastros pendentes — aparece? Indica quantidade?
4. O chip de atualização no subtítulo — tem timestamp "Atualizado às HH:MM"?
5. O **menu lateral** (sidebar) — todos os itens estão visíveis e com ícones?
6. Teste a **responsividade**: reduza a janela para ~375px de largura (ou use DevTools → mobile). O dashboard ainda é utilizável?

**Avalie:** Clareza das informações, hierarquia visual, utilidade prática para um gestor que abre o sistema de manhã.

---

### SEÇÃO 3 — Lista de Pacientes (3 min)

1. Clique em **Pacientes** no menu lateral.
2. Observe a lista: os pacientes aparecem? Há paginação ou scroll?
3. Localize a aba **"Aguardando Aprovação"** — tem badge de contagem? Clique nela.
4. Se houver pacientes pendentes, clique em "Aprovar" num deles e observe o fluxo (modal de confirmação? Toast de sucesso?).
5. Volte para a aba principal. Use a **barra de busca** — pesquise "Ana Clara". O resultado aparece rapidamente?
6. Observe os **filtros** disponíveis (status, UBS etc.) — existem? São funcionais?

**Avalie:** Velocidade da busca, clareza do fluxo de aprovação, organização da lista, facilidade de encontrar um paciente específico.

---

### SEÇÃO 4 — Perfil do Paciente (5 min)

1. Na busca, clique no paciente **Ana Clara Souza** (CRA: DEMO-0001).
2. Você está no Perfil do Paciente. Observe as **3 abas**:

**Aba "Dados":**
- Os dados pessoais estão organizados? (nome, CRA, telefone, UBS, bairro)
- Os **dados clínicos** aparecem? (Tipo sanguíneo O+, peso 68.5kg, altura 165cm, alergias: Dipirona/Penicilina, comorbidades: Asma/Rinite)
- O botão de edição dos dados clínicos funciona? Abra o modal e verifique os campos.
- Feche sem salvar.

**Aba "Solicitações":**
- As solicitações aparecem separadas em **"Em andamento"** e **"Histórico"**?
- Clique em **"Nova Solicitação"** — preencha: Tipo: Exame, Nome técnico: "Hemograma", Descrição ao paciente: "Exame de sangue de rotina", Prioridade: Rotina. Salve.
- A solicitação aparece imediatamente em "Em andamento"?
- Clique em **"Atualizar Status"** na solicitação criada. Mude para "Autorizado" com observação "Aprovado pela regulação". Salve.
- O card atualiza o status visual imediatamente?

**Aba "Linha do Tempo":**
- Os atendimentos clínicos de Ana Clara aparecem? (deve ter 2: UBS Centro Jan/26 e Hospital Municipal Fev/26)
- Clique em **"Registrar Atendimento"** — preencha os campos obrigatórios e salve.
- O novo atendimento aparece no topo da linha do tempo?

**Avalie:** Organização do perfil, clareza do fluxo de criação e atualização de solicitações, utilidade da linha do tempo clínica, facilidade de uso do modal de atendimento.

---

### SEÇÃO 5 — Painel do Médico (2 min)

1. No menu lateral, clique no ícone de **estetoscópio** (Painel do Médico).
2. No campo de busca, digite `DEMO-0001` e pressione Enter.
3. Os **Dados Clínicos** aparecem? (O+, alergias, comorbidades, medicamentos de uso contínuo)
4. A **Linha do Tempo** de atendimentos aparece abaixo?
5. Confirme que não há botões de edição — este painel é **somente leitura**.

**Avalie:** Utilidade clínica do painel, clareza das informações, adequação para uso rápido durante atendimento.

---

### SEÇÃO 6 — Medicamentos (2 min)

1. Clique em **Medicamentos** no menu lateral.
2. A lista de medicamentos aparece com disponibilidade (sim/não)?
3. Tente atualizar a disponibilidade de um medicamento. O toggle/botão funciona?
4. A data de atualização aparece ao lado de cada item?

**Avalie:** Clareza do cadastro de medicamentos, facilidade de atualização de disponibilidade.

---

### SEÇÃO 7 — Comunicados (2 min)

1. Clique em **Comunicados** no menu lateral.
2. Os comunicados existentes aparecem?
3. Crie um novo comunicado **geral** com título "Campanha de Vacinação" e algum texto. Salve.
4. O comunicado aparece na lista imediatamente?
5. Tente criar um comunicado **individual** para Ana Clara Souza.

**Avalie:** Clareza da distinção entre comunicado geral e individual, facilidade de criação.

---

### SEÇÃO 8 — Agendamentos (2 min)

1. Clique em **Agendamentos** no menu lateral.
2. Os horários já criados aparecem com data, horário e status?
3. Crie um novo horário disponível (data futura). Salve.
4. O novo slot aparece na lista?

**Avalie:** Clareza do calendário/lista, facilidade de criação de horários.

---

### SEÇÃO 9 — Módulos especializados (2 min, navegação rápida)

Navegue rapidamente por cada um dos módulos abaixo. Para cada um, verifique apenas: (a) carrega sem erro? (b) a tela faz sentido? (c) algum elemento quebrado?

- **Regulação** (encaminhamentos externos)
- **Transporte Sanitário**
- **Serviço Social**
- **Vigilância Epidemiológica**

**Avalie:** Consistência visual entre os módulos, presença de estados vazios informativos, erros de carregamento.

---

### SEÇÃO 10 — Administração de Usuários (1 min)

1. Clique em **Usuários** no menu lateral (se visível).
2. A lista de gestores cadastrados aparece?
3. Há opção de criar novo usuário gestor?

**Avalie:** Funcionalidade básica de administração.

---

## O que avaliar em TODA a navegação

Mantenha atenção constante para:

- **Erros de console** — abra DevTools (F12 → Console) e registre qualquer erro vermelho persistente
- **Requisições de rede falhando** — DevTools → Network → filtrar por erros 4xx/5xx
- **Textos confusos ou jargão técnico** — o sistema é para gestores de UBS, não desenvolvedores
- **Estados de loading infinito** — se alguma tela ficar carregando sem parar
- **Inconsistências visuais** — cards cortados, botões fora de lugar, sobreposição de elementos
- **Falta de feedback** — ações que não dão retorno visual ao usuário (sem toast, sem loading)
- **Navegação quebrada** — links que não funcionam, voltar que não volta

---

## Formato do Relatório Final

Ao terminar a navegação, entregue o relatório neste formato:

```
# Relatório de Avaliação — Portal do Gestor
Data: [data/hora]

## Resumo Executivo
[2-3 linhas: o sistema está pronto para apresentação? qual é o nível geral de qualidade?]

## ✅ Pontos Fortes
[Lista do que funciona bem e impressiona]

## 🔴 Problemas Críticos (travam o uso ou a demo)
[Bugs que impedem o funcionamento básico]

## 🟡 Problemas Moderados (não travam, mas comprometem a experiência)
[UX ruim, texto confuso, fluxo estranho]

## 🟢 Melhorias Sugeridas (nicetohave pós-banca)
[Sugestões de melhoria que não são urgentes]

## Erros de Console/Rede Registrados
[Copiar mensagens de erro exatas do DevTools]

## Avaliação por Seção
[Para cada seção do roteiro: status (OK / ATENÇÃO / CRÍTICO) + observação]

## Veredicto para a Banca (25/06)
[O sistema está apto para apresentação? O que é OBRIGATÓRIO corrigir antes?]
```

---

**Importante:** Seja honesto e técnico. Este relatório vai para o arquiteto do sistema que tomará decisões sobre correções antes da banca. Prefira apontar problemas reais a dar aprovação genérica.
