# Roteiro da Banca — Gestão Saúde UBS+
## Banca de Avaliação — UFBRA Engenharia de Software
### 26/06/2026 às 20h | Tempo estimado de demo: 16 minutos

---

## Credenciais de Demonstração

| Portal | Usuário | Senha |
|---|---|---|
| **Gestor matriz (admin — UBS Centro)** | centro@gestaoubs.dev | senha123 |
| **Paciente (Ana Paula Santos)** | CRA: `2606260001` / Nasc: `15/03/1985` | — |
| **Paciente alternativo (Ana Clara — DEMO)** | CRA: `DEMO-0001` / Nasc: `22/04/1989` | — |
| **Externa (AME SJC)** | ame@sjc.sp.gov.br | externa123 |

> **Modo matriz da demo:** em ambiente de testes, todas as ações de gestão ficam centralizadas no painel `centro@gestaoubs.dev`. Mesmo dados de outras UBSs, como Vila Maria, devem ser demonstrados por esse gestor matriz.

> **ATENÇÃO — PRÉ-REQUISITO OBRIGATÓRIO:** Antes da banca, rodar as seeds no terminal:
> ```
> cd "C:\Users\reina\OneDrive\Desktop\Projetos\Gestão Saúde UBS+\app\backend"
> npx knex seed:run
> ```
> Isso garante que Ana Paula Santos e os slots de agendamento estejam no banco.

> **URLs:** Frontend local `http://localhost:5173` · Produção `https://gestao-saude-ubs.vercel.app`
> Abrir 3 abas antes da apresentação: Portal Gestor / Portal Paciente / Portal Externo.

---

## 0. Antes de Começar (Preparação — 30 min antes)

- [ ] Verificar conexão de internet
- [ ] Abrir 3 abas: Portal do Gestor / Portal do Paciente / Portal Externo
- [ ] Fazer login em cada portal e verificar que carregam corretamente
- [ ] Confirmar que Ana Paula Santos (CRA 2606260001) tem ao menos 1 solicitação com status `em_analise` ou `autorizado`
- [ ] Confirmar que há pelo menos 1 encaminhamento para o AME em status `AGENDADO` para a Ana Paula
- [ ] Deixar o painel do gestor aberto na aba 1

---

## 1. Abertura — O Problema (2 minutos)

**O que falar:**

> "Quem já tentou ligar pra UBS pra saber se o exame saiu sabe como é: a linha ocupa, a recepção não sabe informar, e você vai pessoalmente só pra descobrir que ainda está em análise. Em São José dos Campos isso acontece com centenas de pacientes todo dia.

> O Gestão Saúde UBS+ resolve exatamente esse gargalo — não substituindo nenhum sistema do SUS, mas criando uma camada de transparência entre a equipe gestora e o paciente. O gestor alimenta informações que já possui, e o paciente acessa pelo celular, sem precisar ligar ou ir à UBS."

**Ponto técnico para mencionar:**
- Conformidade com LGPD e Decreto Municipal 18.855/2021 de SJC
- Não integra com e-SUS (escopo respeitado): o gestor é a fonte de informação

---

## 2. Portal do Gestor — Dashboard e Perfil do Paciente (5 minutos)

### Passo 2.1 — Login (30 seg)
- Abrir aba do Portal do Gestor
- Login com `centro@gestaoubs.dev` / `senha123` (UBS Centro, perfil admin)
- **Mencionar:** autenticação com email + senha, perfil de gestor admin, JWT com 12h de expiração

### Passo 2.2 — Dashboard (1 min)
- Mostrar a tela inicial com contadores de pacientes/solicitações ativas
- Mostrar paciente com badge URGENTE no topo da lista
- **Mencionar:** filtros por prioridade e tipo de solicitação, busca por CRA

### Passo 2.3 — Perfil Completo do Paciente — Ana Paula Santos (2 min)
- Buscar "Ana Paula" na lista e abrir o perfil
- Mostrar as seções: dados cadastrais → dados clínicos (tipo sanguíneo, comorbidades, alergias, IMC)
- Mostrar lista de solicitações ativas
- Abrir uma solicitação → expandir histórico de status (timeline)
- **Mencionar:** linha do tempo auditável, `historico_status`, linguagem simples para o paciente

### Passo 2.4 — Atualizar Status (1 min)
- Na mesma solicitação, clicar em "Atualizar Status"
- Mover para "Data marcada" com observação: "Exame agendado para 28/06 às 9h na UBS Vila Maria"
- Confirmar
- **Mencionar:** toda mudança registrada automaticamente no histórico com gestor e timestamp

### Passo 2.5 — Comunicado Segmentado (30 seg)
- Mostrar o botão "Novo Comunicado"
- Mostrar campo "Segmentação clínica" com exemplo "Diabetes"
- **Mencionar:** comunicado chega apenas a pacientes com "Diabetes" registrado no campo comorbidades — sem expor lista de pacientes (LGPD)

---

## 3. Portal do Paciente — Transparência em Tempo Real (4 minutos)

### Passo 3.1 — Login (30 seg)
- Trocar para a aba do Portal do Paciente
- Login com CRA `2606260001` + data de nascimento `15/03/1985` (Ana Paula Santos)
- **Mencionar:** autenticação por CRA + data de nascimento (padrão já usado pela prefeitura de SJC); sem necessidade de senha

### Passo 3.2 — Dashboard (1 min)
- Mostrar os cards de solicitação com cores por status
- O card que acabou de ser atualizado para "Data marcada" já aparece verde
- **Mencionar:** polling automático a cada 20 segundos — o paciente não precisa recarregar a página

### Passo 3.3 — Linha do Tempo (1 min)
- Clicar no card da solicitação atualizada
- Mostrar a timeline completa: "Em análise → Data marcada" com a observação inserida pelo gestor
- **Mencionar:** linguagem simples em cada etapa, sem jargão burocrático

### Passo 3.4 — Medicamentos (30 seg)
- Navegar para "Medicamentos"
- Digitar "metform" → mostrar Metformina disponível com dosagem e instruções de retirada
- **Mencionar:** paciente sabe se o medicamento está disponível antes de sair de casa

### Passo 3.5 — Comunicados (30 seg)
- Navegar para "Comunicados"
- Mostrar comunicado com badge URGENTE
- Mostrar comunicado segmentado por Diabetes (se Ana Paula tiver Diabetes no perfil)
- **Mencionar:** comunicados marcados como não lidos, contador no menu

### Passo 3.6 — Agendamento (30 seg)
- Navegar para "Agendamentos"
- Mostrar os horários disponíveis do dia 26/06 (slots da banca: 19h–21h)
- **Mencionar:** slots criados em lote pelo gestor via formulário

---

## 4. Portal de Unidades Externas — Integração AME (3 minutos)

### Passo 4.1 — Login (30 seg)
- Trocar para a aba do Portal Externo
- Login com `ame@sjc.sp.gov.br` / `externa123`
- **Mencionar:** portal dedicado para AMEs, hospitais e centros de especialidade

### Passo 4.2 — Dashboard (30 seg)
- Mostrar o donut chart com distribuição de encaminhamentos por status
- **Mencionar:** gráfico SVG gerado dinamicamente, sem biblioteca de chart externa

### Passo 4.3 — Encaminhamentos (2 min)
- Abrir a lista de encaminhamentos
- Mostrar filtro por status
- Encontrar encaminhamento da Ana Paula em status `AGENDADO`
- Clicar em "Registrar Retorno" → preencher feedback e marcar como CONCLUIDO
- **Mencionar:** ao clicar em Concluir, o sistema dispara automaticamente uma Web Push Notification para o celular da Ana Paula — demonstrar se possível

---

## 5. Perfil Médico com RBAC (2 minutos)

### Passo 5.1 — Contextualizar controle por perfil (30 seg)
- Permanecer no Portal do Gestor matriz (`centro@gestaoubs.dev`)
- **Mencionar:** o sistema possui RBAC por perfil (`admin`, `gestor`, `recepcionista`, `medico`), mas a demo centraliza a operação no gestor matriz para evitar troca de credenciais durante a banca

### Passo 5.2 — Limitações do Perfil Médico (30 seg)
- Abrir menu e explicar que Regulação/Vigilância usam guardas de perfil no backend
- Se perguntarem pelo perfil médico específico, mostrar o teste automatizado/RBAC ou o middleware `soNaoMedico`
- **Mencionar:** middleware `soNaoMedico` — médico não pode alterar dados regulatórios

### Passo 5.3 — Painel Médico Exclusivo (1 min)
- Navegar para "Painel Médico" no menu
- Mostrar o formulário de receituário com campo CID-10
- Clicar em "Imprimir Receituário"
- **Mencionar:** impressão nativa via `window.print()` com formatação CSS para papel A5

---

## 6. Encerramento — Qualidade Técnica (2 minutos)

### Passo 6.1 — Suite de Testes
- Mostrar o arquivo `package.json` do backend com o script de testes
- Ou mostrar o output de `npm test` (86 testes passando)
- **Mencionar:** 14 arquivos de teste, 86 casos de teste, 0 falhas — CI/CD confiável

### Passo 6.2 — LGPD na Prática
- Abrir o Insomnia/Postman (ou mostrar um exemplo) tentando acessar `/api/gestor/pacientes` sem token
- Mostrar que retorna 401 Unauthorized
- **Mencionar:** toda rota protegida por `autenticarToken`; nenhuma lista de pacientes acessível sem JWT; `ubs_id` vem sempre do token, nunca do body

### Passo 6.3 — Fala final
> "O sistema entregou todos os 9 requisitos funcionais do gestor e todos os 7 do paciente, acrescidos de 4 módulos extras que emergiram do desenvolvimento: portal externo, perfil médico com RBAC, regulação/vigilância epidemiológica e serviço social/transporte sanitário.

> São 3 portais, 27 tabelas em produção no Supabase, 86 testes automatizados e zero exposição de dados de pacientes sem autenticação.

> A stack escolhida — React + Node.js + PostgreSQL — é exatamente o que o mercado de São Paulo usa. Os alunos que participaram do projeto saem com um sistema real em produção no portfólio."

---

## Perguntas Esperadas da Banca — Respostas Sugeridas

**"Como vocês garantem a segurança dos dados de saúde?"**
> LGPD: JWT em toda rota, `ubs_id` e `id` do token nunca do body, CPF nunca exposto em relatórios, log de auditoria completo, CORS restrito ao domínio do frontend, Joi validando todas as entradas, Helmet.js com headers de segurança.

**"Por que não integrar com o e-SUS?"**
> Escopo acadêmico deliberado: integração com e-SUS requer credenciais governamentais do DATASUS e processo de credenciamento da UBS que ultrapassa o tempo disponível. O modelo manual é mais realista para a realidade das UBSs de pequeno e médio porte.

**"E se a equipe da UBS não atualizar o sistema?"**
> Este é o desafio de adoção de qualquer sistema de saúde. A proposta é que o gestor já possui as informações (no e-SUS, no SISREG) — o sistema apenas cria um canal para comunicar essas informações ao paciente em linguagem acessível. O esforço de atualização é mínimo.

**"O sistema está disponível para qualquer UBS?"**
> Sim — multi-UBS desde a arquitetura. Cada UBS tem seu próprio `ubs_id` e os dados são completamente isolados. Adicionar uma nova UBS é cadastrá-la na tabela `ubs` e criar um gestor com `ubs_id` correspondente.

**"Quais foram as principais decisões técnicas?"**
> Supabase no lugar de Railway (banco estável e gratuito), polling no lugar de WebSocket (menor complexidade de infra), Knex.js no lugar de Prisma (SQL transparente para aprendizado), perfil médico com RBAC (emergiu da necessidade real de separar acesso de escrita).

---

## Plano B — Se algo falhar ao vivo

| Problema | Solução |
|---|---|
| Backend não responde | Mostrar o código do backend — a demo é do sistema, não apenas da interface |
| Banco de dados off | Mostrar os 86 testes passando localmente via terminal |
| Portal externo com bug visual | Pular para o Painel Médico e os testes automatizados |
| Login falha | Usar dados alternativos do seed (criar backup de credenciais) |
| Internet cai | Rodar localmente: `npm run dev` no frontend e `node server.js` no backend |

---

*Roteiro criado em 2026-06-24. Tempo total estimado: 16 minutos de demo + 4 minutos de perguntas.*
