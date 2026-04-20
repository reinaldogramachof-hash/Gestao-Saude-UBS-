# Documento 04 — Requisitos Funcionais
## Gestão Saúde UBS+ | Projeto de Extensão Multidisciplinar
### Faculdade UFBRA — Engenharia de Software

**Versão:** 1.0
**Data:** 2026-04-20
**Status:** Levantado — aguardando validação com usuários reais

---

## 1. Convenções

| Código | Prioridade |
|---|---|
| [MUST] | Obrigatório no MVP — sem isso o sistema não funciona |
| [SHOULD] | Importante — deve entrar na Fase 2 se possível |
| [COULD] | Desejável — entra na Fase 3 se houver tempo |

---

## 2. Requisitos do Portal do Paciente

### RF-P01 — Autenticação do Paciente [MUST]
O paciente deve conseguir realizar login inserindo o número do CRA e a data de nascimento.
- O sistema deve validar ambos os campos contra o banco de dados
- Em caso de erro, exibir mensagem clara sem revelar qual campo está incorreto (segurança)
- O token de sessão deve expirar em 8 horas

### RF-P02 — Visualização de Solicitações Ativas [MUST]
O paciente autenticado deve visualizar todas as suas solicitações ativas (exames, consultas, procedimentos) em uma tela de dashboard.
- Cada solicitação deve exibir: tipo, descrição em linguagem simples, status atual com texto explicativo e cor visual
- Solicitações urgentes devem aparecer no topo
- Deve ser possível clicar em uma solicitação para ver detalhes e histórico de atualizações

### RF-P03 — Consulta de Disponibilidade de Medicamentos [MUST]
O paciente deve conseguir buscar um medicamento pelo nome e verificar se está disponível na sua UBS de referência.
- Exibir: nome, disponível (sim/não), observação da gestão e data da última atualização
- Busca deve ser por nome parcial (ex: buscar "metform" retorna "Metformina 500mg")

### RF-P04 — Visualização de Comunicados [MUST]
O paciente deve conseguir visualizar comunicados enviados pela equipe da sua UBS.
- Exibir comunicados gerais (para todos) e comunicados individuais (para ele especificamente)
- Comunicados novos devem ter indicação visual de "não lido"

### RF-P05 — Agendamento com a Gestão [SHOULD]
O paciente deve conseguir reservar um horário de atendimento presencial com a equipe gestora.
- Deve visualizar horários disponíveis em formato de calendário simples
- Ao reservar, informar brevemente o motivo
- Receber confirmação visual imediata

### RF-P06 — Histórico de Solicitações Anteriores [SHOULD]
O paciente deve ter acesso ao histórico de solicitações já concluídas ou canceladas.
- Separado visualmente das solicitações ativas
- Ordenado por data (mais recente primeiro)

### RF-P07 — Atualização de Dados de Contato [COULD]
O paciente deve conseguir atualizar seu número de telefone e e-mail dentro do aplicativo.
- Mudanças ficam sujeitas à aprovação da gestão da UBS

---

## 3. Requisitos do Portal do Gestor

### RF-G01 — Autenticação do Gestor [MUST]
O profissional da UBS deve conseguir realizar login com e-mail e senha.
- Senhas armazenadas com hash bcrypt
- Perfis de acesso: recepcionista, gestor, admin

### RF-G02 — Dashboard de Pacientes com Filtros [MUST]
O gestor deve visualizar a lista de pacientes da sua UBS com filtros e indicadores de prioridade.
- Filtros: por status de solicitação, por prioridade (urgente/rotina), por tipo de solicitação
- Indicação visual de pacientes com solicitações urgentes pendentes
- Busca por nome ou CRA do paciente

### RF-G03 — Cadastro de Paciente [MUST]
O gestor deve conseguir cadastrar um novo paciente no sistema.
- Campos obrigatórios: CRA, nome completo, data de nascimento, UBS de referência
- Campos opcionais: CPF, telefone, e-mail

### RF-G04 — Cadastro e Atualização de Solicitações [MUST]
O gestor deve conseguir criar e atualizar solicitações de exames, consultas e procedimentos para um paciente.
- Ao criar: selecionar tipo, inserir descrição técnica e descrição para o paciente, definir prioridade
- Ao atualizar: mover o status para a fase seguinte com observação opcional
- Toda mudança de status deve ser registrada automaticamente no histórico

### RF-G05 — Gestão de Medicamentos [MUST]
O gestor deve conseguir marcar medicamentos como disponível ou indisponível.
- Deve incluir observação (ex: "Previsão de chegada na quinta-feira")
- Data de atualização deve ser registrada automaticamente para exibição ao paciente

### RF-G06 — Envio de Comunicados [MUST]
O gestor deve conseguir enviar comunicados para todos os pacientes da UBS ou para um paciente específico.
- Comunicados gerais ficam visíveis para todos
- Comunicados individuais ficam visíveis apenas para o destinatário

### RF-G07 — Gestão de Agenda de Atendimento [SHOULD]
O gestor deve conseguir criar blocos de horários disponíveis para atendimento com pacientes.
- Definir data, hora, duração e gestor responsável
- Visualizar quais horários foram reservados e por qual paciente

### RF-G08 — Visualização do Perfil Completo do Paciente [MUST]
Ao clicar em um paciente, o gestor deve ver: dados cadastrais, todas as solicitações ativas, histórico e comunicados.
- Exibição em abas ou seções bem separadas

### RF-G09 — Relatório Simples de Atividade [COULD]
O gestor deve conseguir visualizar um resumo: total de solicitações abertas, distribuição por status e lista de solicitações urgentes sem atualização há mais de 7 dias.

---

## 4. Requisitos Não-Funcionais

### RNF-01 — Responsividade [MUST]
Todas as telas devem funcionar corretamente em dispositivos móveis a partir de 375px de largura, pois grande parte dos usuários acessa pelo smartphone.

### RNF-02 — Conformidade com LGPD [MUST]
- Nenhuma rota da API deve retornar dados de outros pacientes
- Dados de diagnóstico nunca devem ser expostos sem autenticação
- O sistema não deve exibir listas públicas de pacientes

### RNF-03 — Linguagem Acessível [MUST]
Todos os textos exibidos ao paciente devem ser escritos em linguagem simples, sem jargão médico, técnico ou burocrático.

### RNF-04 — Tempo de Resposta [SHOULD]
As principais telas devem carregar em menos de 3 segundos em conexão 4G padrão.

### RNF-05 — Comentários em Código [MUST]
Todo arquivo de código deve conter comentários explicativos para cada trecho relevante, permitindo que membros com menor experiência técnica compreendam a funcionalidade implementada.

### RNF-06 — Disponibilidade [SHOULD]
O sistema deve ter disponibilidade mínima de 95% durante horário comercial (7h–19h, dias úteis).

---

## 5. Casos de Uso Principais

### UC-01: Paciente verifica status do seu exame
```
Ator: Paciente
Pré-condição: Paciente possui CRA e está cadastrado no sistema
Fluxo:
  1. Paciente acessa o portal pelo smartphone
  2. Insere CRA e data de nascimento
  3. Sistema autentica e exibe o dashboard pessoal
  4. Paciente visualiza o card do exame com status "Data marcada"
  5. Paciente clica no card e vê a data, horário e orientações preparatórias
Pós-condição: Paciente informado sem precisar ligar ou ir à UBS
```

### UC-02: Paciente verifica disponibilidade de medicamento
```
Ator: Paciente
Pré-condição: Paciente autenticado
Fluxo:
  1. Paciente acessa a seção "Medicamentos" no menu
  2. Digita o nome do medicamento na busca
  3. Sistema exibe: disponível ✓ / indisponível ✗ com observação e data de atualização
Pós-condição: Paciente decide se vai ou não à UBS buscar o medicamento
```

### UC-03: Gestor atualiza status de solicitação
```
Ator: Gestor da UBS
Pré-condição: Gestor autenticado
Fluxo:
  1. Gestor busca o paciente pelo nome ou CRA
  2. Abre o perfil do paciente
  3. Localiza a solicitação desejada
  4. Clica em "Atualizar Status"
  5. Seleciona o novo status e opcionalmente adiciona observação para o paciente
  6. Confirma a atualização
  7. Sistema registra a mudança no histórico e torna visível para o paciente imediatamente
Pós-condição: Paciente vê o status atualizado ao próximo acesso ao portal
```

---

*Documento mantido e atualizado pelo time de desenvolvimento a cada fase concluída.*
