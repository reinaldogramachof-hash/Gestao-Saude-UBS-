# Relatório de Expansão do Painel Gestor

## Data de execução

11 de junho de 2026

## Módulos implementados

### ✅ Módulo 5 — Backend do gestor

- `GET /api/gestor/pacientes` agora retorna:
  - `solicitacoes_ativas`, contando somente status diferentes de `concluido` e `cancelado`;
  - `tem_urgente`, considerando somente solicitações urgentes ainda ativas.
- A listagem usa `LEFT JOIN`, preservando pacientes sem solicitações.
- CPF foi removido da listagem e também das respostas de cadastro e edição.
- A nova rota de histórico valida a UBS pela relação entre solicitação e paciente.

### ✅ Módulo 1 — Medicamentos

- Botão e modal de cadastro de medicamento.
- Edição de observação e disponibilidade em modal com dados preenchidos.
- Toggle rápido de disponibilidade preservado.
- Filtros locais: Todos, Disponíveis e Em falta.
- Contadores de disponíveis e indisponíveis.
- Exibição de observação e data de atualização em português do Brasil.
- Estado de erro com botão `Tentar novamente`.
- Loading com skeletons.

### ✅ Módulo 2 — Perfil do paciente

- Edição inline de nome, telefone e e-mail.
- Salvamento por `PUT /api/gestor/paciente/:id`.
- Recarregamento do perfil após salvar.
- Histórico expansível por solicitação.
- Loading, erro e retry independentes para cada histórico.
- Nome do gestor, data, transição de status e observação exibidos na linha do tempo.
- Modais existentes de nova solicitação, atualização de status e escalada preservados.

### ✅ Módulo 3 — Lista de pacientes

- Coluna de solicitações ativas.
- Badge vermelho quando existe solicitação urgente ativa.
- Badge verde para solicitações ativas sem urgência.
- Paginação com 20 registros por página.
- Botões Anterior e Próxima com desabilitação nos limites.
- Busca reinicia automaticamente na primeira página.
- Estado de erro com retry.

### ✅ Módulo 4 — Agendamentos

- Link `→ Ver paciente` em agendamentos reservados.
- Motivo da reserva mantido visível quando preenchido.
- Criação de 1, 5, 10, 15, 20 ou 30 slots com o mesmo horário em dias consecutivos.
- Chamadas POST sequenciais com progresso `Criando X/Y...`.
- Em falha parcial, o toast informa quantos horários foram concluídos.
- Resumo local de disponíveis, reservados e concluídos hoje.
- Estado de erro com retry.

## Rotas de backend adicionadas ou alteradas

### Adicionada

`GET /api/gestor/solicitacao/:id/historico`

Retorna:

```json
[
  {
    "id": 1,
    "status_anterior": "em_analise",
    "status_novo": "autorizado",
    "observacao": "Pedido autorizado",
    "alterado_em": "2026-06-11T12:00:00.000Z",
    "gestor_nome": "Nome do gestor"
  }
]
```

### Alterada

`GET /api/gestor/pacientes`

Campos operacionais adicionados:

- `solicitacoes_ativas`
- `tem_urgente`

O campo CPF não é retornado.

## Decisões técnicas

- A contagem e o indicador urgente foram agregados no banco para evitar uma requisição por paciente.
- `BOOL_OR` usa `COALESCE(..., false)` para pacientes sem solicitações.
- Urgência encerrada não deixa o badge vermelho ativo.
- O histórico é carregado apenas ao expandir e armazenado em cache local por solicitação.
- A criação de slots é sequencial para permitir progresso fiel e reduzir rajadas simultâneas de escrita.
- Nenhum novo componente ou dependência foi criado; os modais permanecem inline conforme o padrão do projeto.
- A resposta de cadastro e edição de paciente remove CPF antes do envio para cumprir a regra global de LGPD.

## Validações executadas

### Testes automatizados

```powershell
node --test tests\expansao-painel-gestor-contracts.test.mjs tests\bloco1-contracts.test.mjs
```

Resultado: **14 testes aprovados, 0 falhas**.

### Sintaxe do backend

```powershell
& 'C:\Program Files\nodejs\node.exe' --check 'app\backend\src\routes\gestor.js'
```

Resultado: **aprovado, sem erros de sintaxe**.

### Build do frontend

```powershell
npm.cmd run build
```

Resultado: **build aprovado**, 109 módulos transformados, concluído em 5,58 segundos.

## Pendências identificadas

- A inspeção visual pelo navegador integrado não pôde ser executada porque o processo do navegador falhou duas vezes ao iniciar no ambiente Windows. O servidor auxiliar foi encerrado após as tentativas.
- Não foi realizado teste integrado com banco PostgreSQL real ou credenciais de gestor; as verificações locais cobrem contratos de código, regressões anteriores, sintaxe e compilação de produção.
