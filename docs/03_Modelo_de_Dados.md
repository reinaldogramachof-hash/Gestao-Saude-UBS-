# Documento 03 — Modelo de Dados
## Gestão Saúde UBS+ | Projeto de Extensão Multidisciplinar
### Faculdade UFBRA — Engenharia de Software

**Versão:** 1.0
**Data:** 2026-04-20
**Status:** Definido — aguardando implementação das migrations

---

## 1. Visão Geral do Modelo

O banco de dados segue o modelo **relacional** no PostgreSQL. Cada entidade representa um conceito central do domínio da saúde pública municipal.

```
ubs ──────────────────────────────────────────────┐
  │                                               │
  ├── usuarios_gestores (N:1 com ubs)             │
  │                                               │
  └── pacientes (N:1 com ubs) ────────────────────┤
        │                                         │
        ├── solicitacoes (1:N com paciente)        │
        │     └── historico_status (1:N)           │
        │                                         │
        ├── comunicados_individuais (1:N)          │
        │                                         │
        └── agendamentos_gestao (1:N)             │
                                                  │
medicamentos (N:1 com ubs) ───────────────────────┘
comunicados_gerais (N:1 com ubs)
```

---

## 2. Descrição das Tabelas

### 2.1 Tabela: `ubs`
Representa cada Unidade Básica de Saúde cadastrada no sistema.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Identificador único da UBS |
| `nome` | VARCHAR(200) | NOT NULL | Nome oficial da UBS |
| `endereco` | TEXT | NOT NULL | Endereço completo |
| `bairro` | VARCHAR(100) | NOT NULL | Bairro onde está localizada |
| `telefone` | VARCHAR(20) | | Telefone de contato |
| `ativa` | BOOLEAN | DEFAULT true | Indica se a UBS está operacional |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | Data de cadastro no sistema |

---

### 2.2 Tabela: `usuarios_gestores`
Representa os profissionais da UBS que têm acesso ao Portal do Gestor.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Identificador único |
| `ubs_id` | INTEGER | FK → ubs.id | UBS à qual o gestor pertence |
| `nome` | VARCHAR(150) | NOT NULL | Nome completo do profissional |
| `email` | VARCHAR(150) | UNIQUE NOT NULL | E-mail de login |
| `senha_hash` | VARCHAR(255) | NOT NULL | Senha criptografada com bcrypt |
| `perfil` | VARCHAR(30) | NOT NULL | 'recepcionista', 'gestor' ou 'admin' |
| `ativo` | BOOLEAN | DEFAULT true | Conta ativa ou desativada |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | Data de criação da conta |

---

### 2.3 Tabela: `pacientes`
Representa os munícipes cadastrados no sistema com acesso ao Portal do Paciente.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Identificador interno |
| `ubs_id` | INTEGER | FK → ubs.id | UBS de referência do paciente |
| `cra` | VARCHAR(20) | UNIQUE NOT NULL | Cadastro de Regulação Ambulatorial (chave de login) |
| `nome` | VARCHAR(150) | NOT NULL | Nome completo |
| `cpf` | VARCHAR(14) | UNIQUE | CPF (armazenado com máscara) |
| `data_nascimento` | DATE | NOT NULL | Usada na autenticação junto com o CRA |
| `telefone` | VARCHAR(20) | | Celular para notificações futuras |
| `email` | VARCHAR(150) | | E-mail opcional para notificações |
| `ativo` | BOOLEAN | DEFAULT true | Cadastro ativo ou inativo |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | Data de cadastro |
| `atualizado_em` | TIMESTAMP | DEFAULT NOW() | Data da última atualização cadastral |

---

### 2.4 Tabela: `solicitacoes`
Representa cada exame, consulta ou procedimento solicitado para um paciente.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Identificador único |
| `paciente_id` | INTEGER | FK → pacientes.id | Paciente ao qual pertence |
| `ubs_id` | INTEGER | FK → ubs.id | UBS que gerou a solicitação |
| `tipo` | VARCHAR(30) | NOT NULL | 'exame', 'consulta', 'procedimento', 'cirurgia' |
| `descricao` | VARCHAR(300) | NOT NULL | Nome técnico (ex: "Hemograma Completo") |
| `descricao_paciente` | VARCHAR(300) | NOT NULL | Texto em linguagem simples para o paciente |
| `status` | VARCHAR(50) | NOT NULL | Status atual (ver seção 3) |
| `prioridade` | VARCHAR(20) | DEFAULT 'rotina' | 'urgente', 'prioritario', 'rotina' |
| `data_solicitacao` | DATE | NOT NULL | Quando foi solicitado pelo médico |
| `data_prevista` | DATE | | Previsão de realização/agendamento |
| `data_conclusao` | DATE | | Quando foi concluído (NULL se pendente) |
| `observacao_gestor` | TEXT | | Nota interna da gestão |
| `observacao_paciente` | TEXT | | Mensagem exibida ao paciente sobre esta solicitação |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | |
| `atualizado_em` | TIMESTAMP | DEFAULT NOW() | |

---

### 2.5 Tabela: `historico_status`
Registra cada mudança de status de uma solicitação, criando uma linha do tempo auditável.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `solicitacao_id` | INTEGER | FK → solicitacoes.id | Solicitação relacionada |
| `gestor_id` | INTEGER | FK → usuarios_gestores.id | Quem fez a alteração |
| `status_anterior` | VARCHAR(50) | | Status antes da mudança |
| `status_novo` | VARCHAR(50) | NOT NULL | Novo status aplicado |
| `observacao` | TEXT | | Justificativa ou nota da mudança |
| `alterado_em` | TIMESTAMP | DEFAULT NOW() | Data/hora da alteração |

---

### 2.6 Tabela: `medicamentos`
Controle de disponibilidade de medicamentos por UBS.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `ubs_id` | INTEGER | FK → ubs.id | UBS onde o medicamento está ou não |
| `nome` | VARCHAR(200) | NOT NULL | Nome do medicamento |
| `principio_ativo` | VARCHAR(200) | | Substância ativa (ex: "Metformina 500mg") |
| `disponivel` | BOOLEAN | DEFAULT false | Está disponível no estoque agora? |
| `observacao` | TEXT | | Ex: "Previsão de chegada: quinta-feira" |
| `atualizado_em` | TIMESTAMP | DEFAULT NOW() | Quando foi atualizado o estoque |
| `atualizado_por` | INTEGER | FK → usuarios_gestores.id | Quem atualizou |

---

### 2.7 Tabela: `comunicados`
Mensagens enviadas pela gestão da UBS para pacientes (geral ou individual).

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `ubs_id` | INTEGER | FK → ubs.id | UBS que enviou |
| `gestor_id` | INTEGER | FK → usuarios_gestores.id | Quem criou o comunicado |
| `paciente_id` | INTEGER | FK → pacientes.id (nullable) | NULL = comunicado geral para toda a UBS |
| `titulo` | VARCHAR(200) | NOT NULL | Título do comunicado |
| `mensagem` | TEXT | NOT NULL | Texto completo |
| `tipo` | VARCHAR(20) | DEFAULT 'geral' | 'geral' ou 'individual' |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | |

---

### 2.8 Tabela: `agendamentos_gestao`
Horários disponibilizados pela gestão para atendimento presencial de pacientes.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `ubs_id` | INTEGER | FK → ubs.id | |
| `paciente_id` | INTEGER | FK → pacientes.id (nullable) | NULL = horário disponível, não reservado |
| `gestor_responsavel_id` | INTEGER | FK → usuarios_gestores.id | Gestor que atenderá |
| `data_hora` | TIMESTAMP | NOT NULL | Data e hora do atendimento |
| `duracao_minutos` | INTEGER | DEFAULT 15 | Duração prevista |
| `status` | VARCHAR(20) | DEFAULT 'disponivel' | 'disponivel', 'reservado', 'concluido', 'cancelado' |
| `motivo` | TEXT | | Motivo do agendamento (preenchido pelo paciente ao reservar) |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | |

---

## 3. Valores Aceitos: Status de Solicitação

| Valor no Banco | Texto Exibido ao Paciente | Cor Sugerida |
|---|---|---|
| `em_analise` | "Sua solicitação está sendo analisada pela equipe" | Amarelo |
| `aguardando_regulacao` | "Aguardando autorização da central de regulação" | Laranja |
| `autorizado` | "Sua solicitação foi autorizada!" | Verde claro |
| `data_marcada` | "Data e horário confirmados — veja os detalhes abaixo" | Verde |
| `aguardando_resultado` | "Exame realizado — aguardando resultado do laboratório" | Azul |
| `concluido` | "Concluído — resultado disponível no seu histórico" | Cinza |
| `cancelado` | "Esta solicitação foi cancelada — entre em contato com a UBS" | Vermelho |

---

## 4. Diagrama Entidade-Relacionamento (Simplificado)

```
[ubs] 1 ──── N [usuarios_gestores]
[ubs] 1 ──── N [pacientes]
[ubs] 1 ──── N [medicamentos]
[ubs] 1 ──── N [comunicados]
[ubs] 1 ──── N [agendamentos_gestao]

[pacientes] 1 ──── N [solicitacoes]
[pacientes] 1 ──── N [comunicados] (quando individual)
[pacientes] 1 ──── N [agendamentos_gestao] (quando reservado)

[solicitacoes] 1 ──── N [historico_status]
[usuarios_gestores] 1 ──── N [historico_status]
[usuarios_gestores] 1 ──── N [medicamentos] (atualizado_por)
[usuarios_gestores] 1 ──── N [comunicados]
[usuarios_gestores] 1 ──── N [agendamentos_gestao] (gestor_responsavel)
```

---

*Documento mantido e atualizado pelo time de desenvolvimento a cada fase concluída.*
