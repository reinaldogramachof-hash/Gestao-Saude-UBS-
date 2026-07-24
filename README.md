# Gestao Saude UBS+

> Projeto de Extensao Multidisciplinar em Engenharia de Software - UFBRA
> Transparencia de informacao para pacientes e equipes gestoras das UBSs de Sao Jose dos Campos (SP).

---

## Status do Projeto

O Gestao Saude UBS+ foi aprovado na banca academica e esta na Fase 4: preparacao para uso real assistido em Sao Jose dos Campos. O foco atual e estabilizar seguranca, LGPD, auditoria, documentacao operacional e monitoramento antes de ampliar o piloto em UBS real.

O sistema nao substitui e-SUS, SISREG, CROSS ou outros sistemas oficiais do SUS. Ele funciona como uma camada de transparencia e acompanhamento, alimentada manualmente pela equipe da UBS, para reduzir desinformacao sobre filas, exames, consultas, medicamentos, comunicados e atendimento com a gestao.

---

## Portais Entregues

1. **Portal do Gestor:** area operacional da UBS para cadastro e acompanhamento de pacientes, solicitacoes, medicamentos, comunicados, agendamentos, relatorios, regulacao, vigilancia, servico social e transporte sanitario.
2. **Portal do Paciente:** experiencia mobile-first para o municipe consultar solicitacoes, comunicados, medicamentos, historico, agendamentos e aceite LGPD.
3. **Portal de Unidades Externas:** acompanhamento de encaminhamentos e retornos de unidades parceiras.
4. **Painel Superadmin:** administracao central de UBSs, gestores, logs de auditoria e acessos a dados sensiveis de pacientes.

---

## Funcionalidades Principais

- Autenticacao com JWT e bcrypt para gestores, pacientes e unidades externas.
- Login do paciente por CRA e data de nascimento.
- Cadastro de paciente com orientacao de validacao presencial.
- Timeline de solicitacoes em linguagem simples, sem jargao medico ou burocratico.
- Comunicados gerais, individuais, urgentes e segmentados por criterio clinico.
- Web Push para notificacoes operacionais.
- Relatorios do gestor com indicadores operacionais.
- Controle de acesso por perfil, incluindo medico, gestor e admin.
- LGPD: aceite versionado, politica publica, direito ao esquecimento e auditoria de visualizacao.
- Monitoramento: endpoint publico `/health` e integracao Sentry condicionada a producao.
- Documentos operacionais em HTML imprimivel para treinamento e comunicacao com pacientes.

---

## Stack Tecnologica

- **Frontend:** React, Vite, Tailwind CSS.
- **Backend:** Node.js, Express, Knex.
- **Banco de dados:** PostgreSQL.
- **Autenticacao:** JWT, bcrypt e controle de versao de token.
- **Auditoria:** logs centralizados em `security_audit_logs`.
- **Notificacoes:** Web Push VAPID e servico interno de notificacoes do gestor.
- **Monitoramento:** Sentry e rota de saude para monitoramento externo.
- **Deploy academico/producao assistida:** Vercel/Railway conforme ambiente configurado.

---

## Como Executar Localmente

### Pre-requisitos

- Node.js 18 ou superior.
- PostgreSQL acessivel por `DATABASE_URL`.
- Variaveis de ambiente configuradas a partir dos arquivos `.env.example`.

### Backend

```bash
cd app/backend
npm install
npx knex migrate:latest
npx knex seed:run
npm run dev
```

Por padrao, a API local roda em `http://localhost:3001`.

### Frontend

```bash
cd app/frontend
npm install
npm run dev
```

Por padrao, o Vite abre o frontend em `http://localhost:5173`.

---

## Variaveis de Ambiente

Consulte os arquivos de exemplo antes de iniciar:

- `app/backend/.env.example`
- `app/frontend/.env.example`

Variaveis reais de `.env` nao devem ser versionadas. Em producao, configure os segredos no painel da plataforma de hospedagem.

---

## Credenciais de Teste

As credenciais abaixo sao usadas em ambientes de demonstracao e desenvolvimento. Elas nao devem ser reutilizadas para operacao real com dados sensiveis.

| Portal | Usuario | Observacao |
|---|---|---|
| Gestor | `centro@gestaoubs.dev` | Conta demo da UBS Centro |
| Gestor | `industrial@gestaoubs.dev` | Conta demo da UBS Vila Industrial |
| Gestor | `satelite@gestaoubs.dev` | Conta demo da UBS Jardim Satelite |
| Paciente | CRA + data de nascimento | Criado pelo fluxo de cadastro ou pelos seeds de demo |

---

## Estrutura do Repositorio

```text
/
|-- app/
|   |-- frontend/             # Aplicacao React
|   |   |-- src/
|   |   |   |-- components/   # Componentes por portal
|   |   |   |-- pages/        # Telas do gestor, paciente, externa e admin
|   |   |   `-- utils/        # Helpers de status, datas e regras de UI
|   `-- backend/              # API REST Node.js
|       |-- src/
|       |   |-- routes/       # Rotas publicas e autenticadas
|       |   |-- middleware/   # Autenticacao, autorizacao, validacao e auditoria
|       |   |-- services/     # Auditoria, email, push e notificacoes
|       |   `-- db/           # Knex, migrations e seeds
|-- docs/                     # Documentacao tecnica e operacional
|-- tests/                    # Testes de contrato e regressao
|-- .Agent/                   # Briefings, tarefas e relatorios de sessao
|-- AGENTS.md                 # Regras master para agentes de desenvolvimento
`-- README.md                 # Visao publica do projeto
```

---

## Documentacao

- [Descricao do Projeto](docs/01_Descricao_do_Projeto.md)
- [Arquitetura Tecnica](docs/02_Arquitetura_Tecnica.md)
- [Modelo de Dados](docs/03_Modelo_de_Dados.md)
- [Requisitos Funcionais](docs/04_Requisitos_Funcionais.md)
- [Roadmap](docs/05_Roadmap.md)
- [Configuracoes](docs/06_Configuracoes.md)
- [Convencoes de Codigo](docs/07_Convencoes_Codigo.md)
- [Manual do Gestor](docs/Manual_Gestor.html)
- [Guia do Paciente](docs/Guia_Paciente.html)

---

## Validacao

Comandos principais:

```bash
node --test tests\*.test.mjs
cd app/frontend
npm run build
```

Antes de qualquer publicacao, separe os resultados dos testes focados das verificacoes de prontidao geral do repositorio.

---

## Principios de Produto

- LGPD em primeiro lugar: nenhum dado sensivel deve ser exposto sem autenticacao e autorizacao.
- Linguagem simples para pacientes.
- Mobile-first no portal do paciente.
- Registro de auditoria para acoes sensiveis.
- Sem integracao direta com e-SUS, SISREG ou CROSS no escopo atual.
