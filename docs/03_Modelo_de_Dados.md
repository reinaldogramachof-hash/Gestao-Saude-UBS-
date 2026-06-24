# Documento 03 — Modelo de Dados
## Gestão Saúde UBS+ | Projeto de Extensão Multidisciplinar
### Faculdade UFBRA — Engenharia de Software

**Versão:** 2.0
**Data:** 2026-06-24
**Status:** ✅ 27 migrations aplicadas em produção (Supabase)

---

## 1. Visão Geral do Modelo

O banco de dados segue o modelo **relacional** no PostgreSQL. As 27 migrations cobrem todas as entidades do domínio, incluindo módulos da rede de saúde (regulação, vigilância, serviço social, transporte), portal externo e auditoria.

```
ubs ─────────────────────────────────────────────────────────────┐
  │                                                              │
  ├── usuarios_gestores (N:1 com ubs)                           │
  │                                                              │
  └── pacientes (N:1 com ubs) ──────────────────────────────────┤
        │                                                        │
        ├── solicitacoes (1:N)                                   │
        │     ├── historico_status (1:N)                         │
        │     └── encaminhamentos (1:N) ──► unidades_externas    │
        │                                                        │
        ├── atendimentos (1:N)                                   │
        ├── comunicados (1:N, quando individual)                 │
        ├── comunicados_leitura (1:N)                            │
        ├── agendamentos_gestao (1:N, quando reservado)          │
        ├── push_subscriptions (1:N)                             │
        ├── notificacoes_vigilancia (1:N)                        │
        └── audit_logs (rastreio de ações por gestor/sistema)    │
                                                                 │
medicamentos (N:1 com ubs) ──────────────────────────────────────┘
comunicados (N:1 com ubs, quando geral)
catalogo_procedimentos (N:1 com ubs)
```

---

## 2. Descrição das Tabelas

### 2.1 `ubs` — migration 001
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

### 2.2 `usuarios_gestores` — migration 002
Representa os profissionais da UBS com acesso ao Portal do Gestor.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `ubs_id` | INTEGER | FK → ubs.id | UBS à qual o gestor pertence |
| `nome` | VARCHAR(150) | NOT NULL | Nome completo do profissional |
| `email` | VARCHAR(150) | UNIQUE NOT NULL | E-mail de login |
| `senha_hash` | VARCHAR(255) | NOT NULL | Senha criptografada com bcrypt |
| `perfil` | VARCHAR(30) | NOT NULL | 'recepcionista', 'gestor', 'admin' ou 'medico' |
| `ativo` | BOOLEAN | DEFAULT true | Conta ativa ou desativada |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | Data de criação da conta |

---

### 2.3 `pacientes` — migrations 003 + 013
Representa os munícipes cadastrados no sistema com acesso ao Portal do Paciente.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `ubs_id` | INTEGER | FK → ubs.id | UBS de referência do paciente |
| `cra` | VARCHAR(20) | UNIQUE NOT NULL | Cadastro de Regulação Ambulatorial (chave de login) |
| `nome` | VARCHAR(150) | NOT NULL | Nome completo |
| `cpf` | VARCHAR(14) | UNIQUE | CPF (opcional, jamais exposto em relatórios) |
| `data_nascimento` | DATE | NOT NULL | Usada na autenticação junto com o CRA |
| `telefone` | VARCHAR(20) | | Celular para notificações |
| `email` | VARCHAR(150) | | E-mail opcional |
| `ativo` | BOOLEAN | DEFAULT true | Cadastro ativo ou inativo |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | |
| `atualizado_em` | TIMESTAMP | DEFAULT NOW() | |
| `tipo_sanguineo` | VARCHAR(5) | nullable | Ex: 'A+', 'O-', 'AB+' — migration 013 |
| `peso_kg` | DECIMAL(5,2) | nullable | Peso em kg — migration 013 |
| `altura_cm` | SMALLINT | nullable | Altura em cm — migration 013 |
| `alergias` | TEXT | nullable | Lista livre de alergias — migration 013 |
| `comorbidades` | TEXT | nullable | Doenças crônicas (ex: "Diabetes tipo 2, Hipertensão") — usada na segmentação clínica — migration 013 |
| `medicamentos_uso_continuo` | TEXT | nullable | Medicamentos em uso regular — migration 013 |
| `observacoes_clinicas` | TEXT | nullable | Anotações clínicas livres da equipe — migration 013 |

---

### 2.4 `solicitacoes` — migrations 007 + 011 + 014 + 024
Representa cada exame, consulta ou procedimento solicitado para um paciente.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `paciente_id` | INTEGER | FK → pacientes.id | |
| `ubs_id` | INTEGER | FK → ubs.id | |
| `tipo` | VARCHAR(30) | NOT NULL | 'exame', 'consulta', 'procedimento', 'cirurgia' |
| `descricao` | VARCHAR(300) | NOT NULL | Nome técnico (ex: "Hemograma Completo") |
| `descricao_paciente` | VARCHAR(300) | NOT NULL | Texto em linguagem simples |
| `status` | VARCHAR(50) | NOT NULL | Status atual (ver seção 3) |
| `prioridade` | VARCHAR(20) | DEFAULT 'rotina' | 'urgente', 'prioritario', 'rotina' |
| `data_solicitacao` | DATE | NOT NULL | Quando foi solicitado |
| `data_prevista` | DATE | | Previsão de realização |
| `data_conclusao` | DATE | | Quando foi concluído |
| `observacao_gestor` | TEXT | | Nota interna |
| `observacao_paciente` | TEXT | | Mensagem exibida ao paciente |
| `resultado` | TEXT | nullable | Laudo ou resultado clínico — migration 014 |
| `cid_10` | VARCHAR(10) | nullable | Código CID-10 (ex: 'E11') — migration 014 |
| `local_executor` | VARCHAR(200) | nullable | Unidade que vai executar — migration 011 |
| `catalogo_id` | INTEGER | FK → catalogo_procedimentos.id nullable | migration 024 |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | |
| `atualizado_em` | TIMESTAMP | DEFAULT NOW() | |

---

### 2.5 `historico_status` — migration 008
Registra cada mudança de status de uma solicitação, criando linha do tempo auditável.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `solicitacao_id` | INTEGER | FK → solicitacoes.id | |
| `gestor_id` | INTEGER | FK → usuarios_gestores.id | Quem fez a alteração |
| `status_anterior` | VARCHAR(50) | | Status antes da mudança |
| `status_novo` | VARCHAR(50) | NOT NULL | Novo status aplicado |
| `observacao` | TEXT | | Justificativa ou nota da mudança |
| `alterado_em` | TIMESTAMP | DEFAULT NOW() | |

---

### 2.6 `medicamentos` — migrations 004 + 016
Controle de disponibilidade de medicamentos por UBS.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `ubs_id` | INTEGER | FK → ubs.id | |
| `nome` | VARCHAR(200) | NOT NULL | |
| `principio_ativo` | VARCHAR(200) | | Substância ativa (ex: "Metformina 500mg") |
| `disponivel` | BOOLEAN | DEFAULT false | |
| `observacao` | TEXT | | Ex: "Previsão de chegada: quinta-feira" |
| `instrucoes_retirada` | TEXT | nullable | Como retirar e horários — migration 016 |
| `dosagem` | VARCHAR(100) | nullable | Dosagem padrão — migration 016 |
| `atualizado_em` | TIMESTAMP | DEFAULT NOW() | |
| `atualizado_por` | INTEGER | FK → usuarios_gestores.id | |

---

### 2.7 `comunicados` — migrations 005 + 017 + 027
Mensagens enviadas pela gestão para pacientes (geral, individual ou segmentado por condição clínica).

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `ubs_id` | INTEGER | FK → ubs.id | |
| `gestor_id` | INTEGER | FK → usuarios_gestores.id | |
| `paciente_id` | INTEGER | FK → pacientes.id nullable | NULL = comunicado geral para toda a UBS |
| `titulo` | VARCHAR(200) | NOT NULL | |
| `mensagem` | TEXT | NOT NULL | |
| `tipo` | VARCHAR(20) | DEFAULT 'geral' | 'geral' ou 'individual' |
| `urgente` | BOOLEAN | DEFAULT false | Exibe badge de urgência — migration 017 |
| `segmentacao_clinica` | VARCHAR(100) | nullable | Condição clínica alvo (ex: 'Diabetes') — migration 027 |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | |

---

### 2.8 `comunicados_leitura` — migration 009
Rastreia quais comunicados cada paciente já leu.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `comunicado_id` | INTEGER | FK → comunicados.id | |
| `paciente_id` | INTEGER | FK → pacientes.id | |
| `lido_em` | TIMESTAMP | DEFAULT NOW() | |

---

### 2.9 `agendamentos_gestao` — migrations 006 + 026
Horários disponibilizados pela gestão para atendimento presencial.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `ubs_id` | INTEGER | FK → ubs.id | |
| `paciente_id` | INTEGER | FK → pacientes.id nullable | NULL = horário disponível |
| `gestor_responsavel_id` | INTEGER | FK → usuarios_gestores.id | |
| `data_hora` | TIMESTAMP | NOT NULL UNIQUE por ubs_id — migration 026 | |
| `duracao_minutos` | INTEGER | DEFAULT 15 | |
| `status` | VARCHAR(20) | DEFAULT 'disponivel' | 'disponivel', 'reservado', 'concluido', 'cancelado' |
| `motivo` | TEXT | | Motivo preenchido pelo paciente ao reservar |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | |

---

### 2.10 `atendimentos` — migration 015
Registra encontros clínicos do paciente em qualquer unidade de saúde — UBS, AME, CAPS, hospital, etc.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `paciente_id` | INTEGER | FK → pacientes.id CASCADE | |
| `registrado_por` | INTEGER | FK → usuarios_gestores.id SET NULL | |
| `data_atendimento` | DATE | NOT NULL | |
| `unidade` | VARCHAR(200) | NOT NULL | Nome livre da unidade |
| `tipo_unidade` | VARCHAR(30) | nullable | 'ubs', 'ame', 'caps', 'hospital', 'pronto_socorro', 'outro' |
| `especialidade` | VARCHAR(100) | nullable | |
| `profissional` | VARCHAR(150) | nullable | |
| `cid_10_principal` | VARCHAR(10) | nullable | |
| `cid_10_secundario` | VARCHAR(10) | nullable | |
| `conduta` | TEXT | nullable | O que foi prescrito ou decidido |
| `observacoes` | TEXT | nullable | |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | |

---

### 2.11 `push_subscriptions` — migration 010
Armazena as inscrições Web Push (VAPID) dos pacientes para receber notificações.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `paciente_id` | INTEGER | FK → pacientes.id | |
| `endpoint` | TEXT | NOT NULL | URL do endpoint do navegador |
| `p256dh` | TEXT | NOT NULL | Chave pública do cliente |
| `auth` | TEXT | NOT NULL | Chave de autenticação |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | |

---

### 2.12 `unidades_externas` — migrations 021 + 022
Representa AMEs, hospitais, centros de especialidade e UPAs cadastrados.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `nome` | VARCHAR(200) | NOT NULL | |
| `tipo` | VARCHAR(50) | NOT NULL | 'ame', 'hospital', 'centro_especialidades', 'upa' |
| `email` | VARCHAR(150) | UNIQUE NOT NULL | Credencial de login do portal externo |
| `senha_hash` | VARCHAR(255) | NOT NULL | |
| `ativa` | BOOLEAN | DEFAULT true | |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | |

---

### 2.13 `encaminhamentos` — migrations 018 + 025 + 20260618
Registra o encaminhamento de um paciente de uma UBS para uma unidade externa.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `solicitacao_id` | INTEGER | FK → solicitacoes.id | Solicitação de origem |
| `paciente_id` | INTEGER | FK → pacientes.id | |
| `ubs_id` | INTEGER | FK → ubs.id | UBS encaminhadora |
| `unidade_externa_id` | INTEGER | FK → unidades_externas.id | Destino |
| `status` | VARCHAR(50) | NOT NULL | 'PENDENTE', 'RECEBIDO', 'AGENDADO', 'CONFIRMADO_PACIENTE', 'CONCLUIDO' |
| `data_procedimento` | DATE | nullable | Data agendada pela unidade externa |
| `observacoes` | TEXT | nullable | Notas clínicas do encaminhamento |
| `feedback_unidade` | TEXT | nullable | Retorno da unidade ao concluir — migration 025 |
| `gestor_id` | INTEGER | FK → usuarios_gestores.id | Quem criou o encaminhamento — migration 018 |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | |
| `atualizado_em` | TIMESTAMP | DEFAULT NOW() | |

---

### 2.14 `notificacoes_vigilancia` — migration 019
Registra notificações de vigilância epidemiológica (doenças de notificação compulsória).

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `paciente_id` | INTEGER | FK → pacientes.id | |
| `ubs_id` | INTEGER | FK → ubs.id | |
| `gestor_id` | INTEGER | FK → usuarios_gestores.id | |
| `agravo` | VARCHAR(200) | NOT NULL | Nome da doença ou agravo notificado |
| `bairro` | VARCHAR(100) | NOT NULL | Bairro de residência do caso |
| `cep` | VARCHAR(10) | NOT NULL | CEP para geoprocessamento |
| `status` | VARCHAR(30) | DEFAULT 'aberto' | 'aberto', 'em_investigacao', 'encerrado' |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | |
| `atualizado_em` | TIMESTAMP | DEFAULT NOW() | |

---

### 2.15 `catalogo_procedimentos` — migration 023
Catálogo de procedimentos por UBS para padronizar criação de solicitações.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `ubs_id` | INTEGER | FK → ubs.id | |
| `nome` | VARCHAR(200) | NOT NULL | |
| `tipo` | VARCHAR(30) | NOT NULL | |
| `descricao_paciente` | VARCHAR(300) | | Texto padrão em linguagem simples |
| `ativo` | BOOLEAN | DEFAULT true | |

---

### 2.16 `bairros_ubs` — migration 012
Mapeia bairros de abrangência de cada UBS.

| Coluna | Tipo | Restrição | Descrição |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | |
| `ubs_id` | INTEGER | FK → ubs.id | |
| `nome` | VARCHAR(100) | NOT NULL | Nome do bairro |

---

## 3. Valores Aceitos: Status de Solicitação

| Valor no Banco | Texto Exibido ao Paciente | Cor |
|---|---|---|
| `em_analise` | "Sua solicitação está sendo analisada pela equipe" | Amarelo |
| `aguardando_regulacao` | "Aguardando autorização da central de regulação" | Laranja |
| `autorizado` | "Sua solicitação foi autorizada!" | Verde claro |
| `data_marcada` | "Data e horário confirmados — veja os detalhes abaixo" | Verde |
| `aguardando_resultado` | "Exame realizado — aguardando resultado do laboratório" | Azul |
| `concluido` | "Concluído — resultado disponível no seu histórico" | Cinza |
| `cancelado` | "Esta solicitação foi cancelada — entre em contato com a UBS" | Vermelho |

---

## 4. Status de Encaminhamento

| Valor | Significado |
|---|---|
| `PENDENTE` | Encaminhamento criado, aguardando recebimento pela unidade externa |
| `RECEBIDO` | Unidade externa confirmou recebimento |
| `AGENDADO` | Unidade externa agendou data do procedimento |
| `CONFIRMADO_PACIENTE` | Paciente confirmou presença via portal |
| `CONCLUIDO` | Procedimento realizado; feedback registrado pela unidade |

---

## 5. Diagrama Entidade-Relacionamento (Simplificado)

```
[ubs] 1──N [usuarios_gestores]
[ubs] 1──N [pacientes]
[ubs] 1──N [medicamentos]
[ubs] 1──N [comunicados]
[ubs] 1──N [agendamentos_gestao]
[ubs] 1──N [catalogo_procedimentos]
[ubs] 1──N [bairros_ubs]

[pacientes] 1──N [solicitacoes]
[pacientes] 1──N [comunicados] (individual)
[pacientes] 1──N [comunicados_leitura]
[pacientes] 1──N [agendamentos_gestao] (reservado)
[pacientes] 1──N [atendimentos]
[pacientes] 1──N [push_subscriptions]
[pacientes] 1──N [notificacoes_vigilancia]
[pacientes] 1──N [encaminhamentos]

[solicitacoes] 1──N [historico_status]
[solicitacoes] 1──N [encaminhamentos]

[encaminhamentos] N──1 [unidades_externas]

[usuarios_gestores] 1──N [historico_status]
[usuarios_gestores] 1──N [medicamentos] (atualizado_por)
[usuarios_gestores] 1──N [comunicados]
[usuarios_gestores] 1──N [agendamentos_gestao] (responsavel)
[usuarios_gestores] 1──N [atendimentos] (registrado_por)
[usuarios_gestores] 1──N [encaminhamentos] (gestor_id)
[usuarios_gestores] 1──N [notificacoes_vigilancia]
```

---

*Documento atualizado em 2026-06-24 — 27 migrations aplicadas em produção.*
