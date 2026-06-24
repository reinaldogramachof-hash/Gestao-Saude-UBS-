# Documento 04 — Requisitos Funcionais
## Gestão Saúde UBS+ | Projeto de Extensão Multidisciplinar
### Faculdade UFBRA — Engenharia de Software

**Versão:** 2.0
**Data:** 2026-06-24
**Status:** ✅ Todos os requisitos MUST e SHOULD implementados e testados

---

## 1. Convenções

| Código | Prioridade |
|---|---|
| [MUST] | Obrigatório no MVP — sem isso o sistema não funciona |
| [SHOULD] | Importante — deve entrar na Fase 2 se possível |
| [COULD] | Desejável — entra na Fase 3 se houver tempo |

---

## 2. Requisitos do Portal do Paciente

### RF-P01 — Autenticação do Paciente [MUST] ✅
O paciente deve conseguir realizar login inserindo o número do CRA e a data de nascimento.
- ✅ Validação de ambos os campos contra o banco de dados
- ✅ Mensagem de erro sem revelar qual campo está incorreto (segurança)
- ✅ Token JWT com expiração de 8 horas (chave `@UBS_Token_Paciente`)
- ✅ Formulário de auto-cadastro público para pacientes com CRA mas sem senha cadastrada
- **Arquivo:** `LoginPaciente.jsx` + `CadastroPaciente.jsx` + `POST /api/auth/login/paciente`

### RF-P02 — Visualização de Solicitações Ativas [MUST] ✅
O paciente autenticado deve visualizar todas as suas solicitações ativas em um dashboard.
- ✅ Exibição: tipo, descrição em linguagem simples, status com texto explicativo e cor visual
- ✅ Solicitações urgentes aparecem no topo
- ✅ Clique na solicitação exibe detalhes com linha do tempo (historico_status)
- ✅ Timeline atualizada automaticamente a cada 20 segundos (polling via `setInterval`)
- **Arquivo:** `DashboardPaciente.jsx` + `SolicitacoesPaciente.jsx` + `DetalheSolicitacao.jsx`

### RF-P03 — Consulta de Disponibilidade de Medicamentos [MUST] ✅
O paciente deve conseguir buscar um medicamento pelo nome e verificar disponibilidade.
- ✅ Busca por nome parcial (ILIKE no backend)
- ✅ Exibe: nome, disponível/indisponível, observação, dosagem, instruções de retirada e data de atualização
- **Arquivo:** `Medicamentos.jsx` + `GET /api/paciente/medicamentos`

### RF-P04 — Visualização de Comunicados [MUST] ✅
O paciente deve visualizar comunicados enviados pela equipe da sua UBS.
- ✅ Exibição de comunicados gerais, individuais e segmentados por condição clínica (ILIKE em comorbidades)
- ✅ Indicação visual de "não lido" com contador no menu
- ✅ Badge de urgência para comunicados marcados como urgentes
- **Arquivo:** `ComunicadosPaciente.jsx` + `GET /api/paciente/comunicados`

### RF-P05 — Agendamento com a Gestão [SHOULD] ✅
O paciente deve conseguir reservar um horário de atendimento presencial com a equipe gestora.
- ✅ Visualização de horários disponíveis em formato de lista agrupada por dia
- ✅ Informação de motivo ao reservar
- ✅ Confirmação visual imediata
- ✅ Push notification ao gestor ao reservar
- **Arquivo:** `AgendamentosPaciente.jsx` + `POST /api/paciente/agendamento/:id/reservar`

### RF-P06 — Histórico de Solicitações Anteriores [SHOULD] ✅
O paciente deve ter acesso ao histórico de solicitações já concluídas ou canceladas.
- ✅ Seção "Histórico" separada visualmente das solicitações ativas
- ✅ Ordenada por data (mais recente primeiro)
- ✅ Filtro automático por `STATUS_ENCERRADO = ['concluido', 'cancelado']`
- **Arquivo:** `SolicitacoesPaciente.jsx` (seção inferior da mesma tela)

### RF-P07 — Atualização de Dados de Contato [COULD] ✅
O paciente deve conseguir solicitar atualização de seus dados de contato.
- ✅ Perfil exibe dados atuais (telefone, email, endereço) de forma legível
- ✅ Banner informativo direciona o paciente ao agendamento presencial para solicitar correções
- ✅ Alinhado com o requisito original: "ficam sujeitas à aprovação da gestão da UBS"
- **Arquivo:** `PerfilPaciente.jsx` (paciente) — 253 linhas

---

## 3. Requisitos do Portal do Gestor

### RF-G01 — Autenticação do Gestor [MUST] ✅
O profissional da UBS deve conseguir realizar login com e-mail e senha.
- ✅ Senhas armazenadas com hash bcrypt (salt: 12)
- ✅ Perfis de acesso: recepcionista, gestor, admin e medico
- ✅ Token JWT carrega: id, ubs_id, perfil
- **Arquivo:** `LoginGestor.jsx` + `POST /api/auth/login/gestor`

### RF-G02 — Dashboard de Pacientes com Filtros [MUST] ✅
O gestor deve visualizar a lista de pacientes da sua UBS com filtros e indicadores de prioridade.
- ✅ Filtros: por status, prioridade (urgente/rotina), tipo de solicitação
- ✅ Indicação visual de pacientes com solicitações urgentes
- ✅ Busca por nome ou CRA
- ✅ Paginação e indicadores quantitativos
- **Arquivo:** `DashboardGestor.jsx` + `GestorPacientes.jsx`

### RF-G03 — Cadastro de Paciente [MUST] ✅
O gestor deve conseguir cadastrar um novo paciente no sistema.
- ✅ Campos obrigatórios: CRA, nome, data de nascimento, UBS
- ✅ Campos opcionais: CPF, telefone, email, dados clínicos (tipo sanguíneo, comorbidades, etc.)
- ✅ Validação de CRA único
- **Arquivo:** `PerfilPaciente.jsx` (gestor) + `POST /api/gestor/paciente`

### RF-G04 — Cadastro e Atualização de Solicitações [MUST] ✅
O gestor deve criar e atualizar solicitações de exames, consultas e procedimentos.
- ✅ Criação: tipo, descrição técnica, descrição para o paciente, prioridade, local executor
- ✅ Atualização de status com observação para o paciente
- ✅ Toda mudança de status registrada automaticamente em `historico_status`
- ✅ Resultado/laudo e CID-10 registráveis
- ✅ Integração com catálogo de procedimentos da UBS
- **Arquivo:** `PerfilPaciente.jsx` (gestor) + `POST /api/gestor/paciente/:id/solicitacao` + `PUT /api/gestor/solicitacao/:id/status`

### RF-G05 — Gestão de Medicamentos [MUST] ✅
O gestor deve marcar medicamentos como disponível ou indisponível.
- ✅ Campos: disponível/indisponível, observação, dosagem, instruções de retirada
- ✅ Data de atualização registrada automaticamente
- **Arquivo:** `MedicamentosGestor.jsx` + rotas CRUD em `GET/POST/PUT /api/gestor/medicamentos`

### RF-G06 — Envio de Comunicados [MUST] ✅
O gestor deve enviar comunicados para todos os pacientes da UBS ou para um específico.
- ✅ Comunicados gerais (para toda a UBS) e individuais (para paciente específico)
- ✅ Campo urgente com destaque visual
- ✅ Segmentação clínica: comunicado entregue apenas a pacientes com determinada comorbidade
- **Arquivo:** `ComunicadosGestor.jsx` + `POST /api/gestor/comunicado`

### RF-G07 — Gestão de Agenda de Atendimento [SHOULD] ✅
O gestor deve criar blocos de horários disponíveis para atendimento com pacientes.
- ✅ Criação em lote: data, hora início, duração, intervalo, repetição por dias, pular fins de semana
- ✅ Visualização de horários reservados com nome do paciente e motivo
- ✅ Push notification ao paciente ao confirmar/cancelar
- **Arquivo:** `AgendamentosGestor.jsx` + `POST /api/gestor/agendamentos/lote`

### RF-G08 — Visualização do Perfil Completo do Paciente [MUST] ✅
Ao clicar em um paciente, o gestor deve ver dados cadastrais, solicitações, histórico e comunicados.
- ✅ Dados cadastrais completos incluindo dados clínicos (tipo sanguíneo, comorbidades, alergias, IMC)
- ✅ Todas as solicitações com histórico de status e possibilidade de atualizar
- ✅ Encaminhamentos ativos
- ✅ Histórico de atendimentos clínicos
- **Arquivo:** `PerfilPaciente.jsx` (gestor, 1473 linhas)

### RF-G09 — Relatório Simples de Atividade [COULD] ✅
O gestor deve visualizar um resumo de atividade da UBS.
- ✅ Distribuição de solicitações por status (donut chart SVG)
- ✅ Lista de solicitações urgentes sem atualização
- ✅ Sem exposição de CPF (conformidade LGPD)
- **Arquivo:** `RelatoriosGestor.jsx` + `GET /api/gestor/relatorios`

---

## 4. Módulos Extras — Implementados Além do Escopo Original

### RF-EX01 — Portal de Unidades Externas ✅
- Autenticação própria para AMEs, hospitais, centros de especialidade e UPAs
- Dashboard com gráfico de encaminhamentos por status
- Confirmação de recebimento, agendamento de data e registro de retorno
- Push notification automático ao paciente nas ações de agendar e concluir
- **Arquivos:** `LoginExterna.jsx` + `DashboardExterna.jsx` + `EncaminhamentosExterna.jsx`

### RF-EX02 — Perfil Médico com RBAC ✅
- Perfil 'medico' dentro do Portal do Gestor com acesso read-only a regulação e vigilância
- Painel Médico exclusivo para receituários e atestados com impressão nativa
- Middleware `soNaoMedico` bloqueia escrita para médicos em rotas críticas
- **Arquivos:** `PainelMedico.jsx` + `middleware/authorization.js`

### RF-EX03 — Regulação e Vigilância Epidemiológica ✅
- Cadastro e acompanhamento de solicitações de regulação ambulatorial
- Cadastro de notificações de agravos epidemiológicos com geolocalização por CEP e bairro
- Encaminhamentos para unidades externas vinculados a solicitações
- **Arquivos:** `RegulacaoGestor.jsx` + `VigilanciaGestor.jsx`

### RF-EX04 — Serviço Social e Transporte Sanitário ✅
- Módulo de casos sociais vinculados a pacientes
- Solicitações de transporte sanitário com data, destino e observações
- **Arquivos:** `ServicoSocialGestor.jsx` + `TransporteGestor.jsx`

---

## 5. Requisitos Não-Funcionais

### RNF-01 — Responsividade [MUST] ✅
Todas as telas funcionam corretamente em dispositivos móveis a partir de 375px de largura.
- Mobile-first em todos os portais
- Menu lateral colapsável em telas pequenas

### RNF-02 — Conformidade com LGPD [MUST] ✅
- Nenhuma rota da API retorna dados de outros pacientes
- `ubs_id` e `id` vêm sempre do JWT — nunca do body
- CPF nunca exposto em relatórios ou listagens
- Log de auditoria completo

### RNF-03 — Linguagem Acessível [MUST] ✅
- Todos os textos exibidos ao paciente estão em linguagem simples, sem jargão médico ou burocrático
- Mapeamento de status técnico → texto amigável em todos os cards e timelines

### RNF-04 — Tempo de Resposta [SHOULD] ✅
- Backend serverless na Vercel + Supabase PostgreSQL em São Paulo
- Respostas típicas < 300ms em rede local; < 2s em 4G

### RNF-05 — Comentários em Código [MUST] ✅
- Todos os arquivos de código possuem comentários explicativos
- Padrão de cabeçalho JSDoc em componentes React e middlewares

### RNF-06 — Disponibilidade [SHOULD] ✅
- Vercel CDN + Supabase managed = SLA acima de 99,9% para fins acadêmicos
- Sem cold start no banco (Supabase connection pooling)

---

## 6. Casos de Uso Principais

### UC-01: Paciente verifica status do seu exame
```
Ator: Paciente
Pré-condição: Paciente possui CRA e está cadastrado no sistema
Fluxo:
  1. Paciente acessa o portal pelo smartphone
  2. Insere CRA e data de nascimento
  3. Sistema autentica e exibe o dashboard pessoal
  4. Paciente visualiza o card do exame com status "Data marcada"
  5. Paciente clica no card e vê linha do tempo completa com datas e observações
Pós-condição: Paciente informado sem precisar ligar ou ir à UBS
Status: ✅ Implementado
```

### UC-02: Paciente verifica disponibilidade de medicamento
```
Ator: Paciente
Pré-condição: Paciente autenticado
Fluxo:
  1. Paciente acessa "Medicamentos" no menu
  2. Digita o nome do medicamento
  3. Sistema exibe: disponível ✓ / indisponível ✗, dosagem e instruções de retirada
Pós-condição: Paciente decide se vai ou não à UBS
Status: ✅ Implementado
```

### UC-03: Gestor atualiza status de solicitação
```
Ator: Gestor da UBS
Pré-condição: Gestor autenticado
Fluxo:
  1. Gestor busca o paciente pelo nome ou CRA
  2. Abre o perfil do paciente
  3. Localiza a solicitação desejada
  4. Clica em "Atualizar Status", seleciona novo status, adiciona observação opcional
  5. Sistema registra a mudança em historico_status
  6. Paciente vê o status atualizado no próximo acesso (ou em até 20s via polling)
Pós-condição: Paciente informado em tempo real
Status: ✅ Implementado
```

### UC-04: Encaminhamento para unidade externa
```
Atores: Gestor → Unidade Externa → Paciente
Pré-condição: Solicitação existe; unidade externa cadastrada
Fluxo:
  1. Gestor cria encaminhamento vinculado à solicitação
  2. Unidade externa recebe no portal externo → confirma recebimento
  3. Unidade agenda data do procedimento → paciente recebe push notification
  4. Paciente confirma presença via portal → status CONFIRMADO_PACIENTE
  5. Unidade registra retorno → status CONCLUIDO → push ao paciente
Pós-condição: Fluxo completo UBS → Especialidade → UBS rastreado
Status: ✅ Implementado
```

---

*Documento atualizado em 2026-06-24 — todos os requisitos implementados e testados (86/86 testes passando).*
