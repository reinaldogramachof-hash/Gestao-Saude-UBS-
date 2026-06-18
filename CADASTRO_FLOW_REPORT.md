# Relatório de Fluxo — Cadastro e Tratamento de Dados do Paciente
**Data:** 2026-06-18
**Análise por:** Antigravity Agent
**Prioridade:** 🔴 Alta (Preparação para Banca)

## Bloco 1 — Rastreio ponta a ponta do fluxo

**[Frontend] CadastroPaciente.jsx**
- **Campos coletados:** `nome`, `data_nascimento`, `cpf` (opcional), `telefone` (opcional), `email` (opcional).
- **Validações aplicadas ANTES do submit:** Apenas as restrições nativas do HTML (`required` e `type="date"`, `type="email"`).
- **Endpoint chamado:** `POST /api/auth/cadastro-paciente`
- **Payload enviado:** `{ nome, data_nascimento, cpf, telefone, email, ubs_id, bairro }`

**[Backend] Rota POST /auth/cadastro-paciente**
- **Middlewares que interceptam antes do controller:** Nenhum. (O rate limiting está ativo apenas para as rotas de login).
- **Validações aplicadas NO backend:** Verificação de presença dos campos obrigatórios e checagem de duplicidade do CPF, caso enviado.
- **Operações no banco:** 
  1. `SELECT` em `ubs` (verificar se a UBS existe e está ativa).
  2. `SELECT` em `pacientes` (verificar unicidade do CPF).
  3. Geração e verificação no loop de colisão de `cra` (`SELECT` em `pacientes`).
  4. `INSERT` na tabela `pacientes` retornando colunas básicas.
- **O que é retornado ao frontend (sucesso):** `{ mensagem, cra, nome, ubs }`
- **O que é retornado ao frontend (erro):** `{ error: 'mensagem' }`

**[Banco] Tabela pacientes/usuarios**
- **Campos com NOT NULL:** `cra`, `nome`, `data_nascimento`
- **Campos com UNIQUE:** `cra`, `cpf`
- **RLS (Row Level Security) ativo:** Não. O acesso ao banco é gerenciado via Knex (conexão de servidor), sem depender das policies do Supabase diretamente pelo frontend.
- **Dados sensíveis armazenados em texto plano:** `nome`, `cpf`, `data_nascimento`, `telefone`, `email`

---

## Bloco 2 — Investigação de Comportamentos Estranhos

### Integridade de dados:
- **Existe tratamento para cadastro duplicado?**
  - **CPF:** Sim (`auth.js` linha 180).
  - **E-mail:** Não. Múltiplos pacientes podem ser criados com o mesmo endereço de e-mail.
- **O que acontece se o insert falhar silenciosamente?**
  - O Knex não falha silenciosamente. A exceção interrompe o fluxo e cai no bloco `catch` (`auth.js` linha 225), retornando erro `409` para duplicações (código `23505`) ou `500` genérico.
- **Há campos obrigatórios no frontend que não são validados no backend?**
  - Não. O backend efetua a validação idêntica de obrigatórios (`auth.js` linha 168).
- **O frontend e backend têm contratos compatíveis?**
  - Sim. As chaves enviadas na linha 113 de `CadastroPaciente.jsx` batem com a desestruturação no backend na linha 165 de `auth.js`.

### Segurança e LGPD:
- **Senha ou dado sensível logado em console?**
  - O backend imprime o erro completo usando `console.error('[POST /auth/cadastro-paciente]', err);` (`auth.js` linha 226). Erros do Knex frequentemente injetam todo o comando SQL gerado, o que vazará dados sensíveis em logs de produção.
- **A senha está sendo hasheada? Com qual algoritmo?**
  - Pacientes não possuem senha. Gestores usam o algoritmo **bcrypt** (`002_create_usuarios_gestores.js` linha 14 e `auth.js` linha 69).
- **O token retornado é armazenado de forma segura?**
  - Não. É salvo no `localStorage` (`api.js` linha 34). O que o expõe a ataques XSS (Cross-Site Scripting).
- **Dados do paciente sem verificação?**
  - Apenas o `nome` e o `cra` recém-gerado são devolvidos pela rota de cadastro.
- **Exposição de dados sensíveis em URL/Params?**
  - O fluxo utiliza POST Body, então não ocorre o vazamento de PII na URL.

### Validação de campos:
- **Campos com validação exclusiva de frontend:**
  - O comprimento de CPF, e o formato exato de telefone ou e-mail. A ausência de validação estrita permite bypass (ex: enviando "abc" como telefone via Postman).
- **Existe validação de formato de CPF?**
  - Nenhuma em todo o fluxo. (`CadastroPaciente.jsx` linha 402 e `auth.js` linha 180 não restringem o envio).
- **Existe validação de formato de data de nascimento?**
  - Não, o frontend usa o seletor nativo, e o backend aceita a string recebida delegando ao PostgreSQL a conversão, o que pode dar erro se corrompido.
- **Campos vazios submetidos sem 'required'?**
  - São processados através da construção `cpf || null` (`auth.js` linha 211), o que salva corretamente `null` no banco de dados.

---

## Bloco 3 — Mapeamento de Riscos para a Banca

| Risco | Classificação | Descrição |
|---|---|---|
| Ausência de Rate Limit no Cadastro | 🔴 **CRÍTICO** | Permite ataque massivo de criação de usuários por robôs durante a apresentação, poluindo o Supabase e causando negação de serviço. |
| Overflow e Ausência de Formato no CPF | 🔴 **CRÍTICO** | O banco aceita max 14 chars (`varchar(14)`). O bypass do client via POST pode lançar erros 500 do Postgres não tratados amigavelmente. |
| Log de PII via Exceção Knex | 🟡 **MÉDIO** | `console.error(err)` expõe a string SQL completa de um `INSERT` com os dados pessoais caso falhe. |
| Armazenamento JWT em localStorage | 🟡 **MÉDIO** | Vulnerabilidade a XSS. Em um ambiente de saúde real, a preferência é o uso de cookies `httpOnly`. |
| E-mail duplicado não tratado | 🟢 **BAIXO** | Não impacta o login já que a PK é o CRA + data. |

---

## Propostas de Correção (Itens 🔴 Críticos)

### Correção 1: Adicionar Rate Limit no Cadastro
**Arquivo:** `app/backend/src/routes/auth.js`
**Solução:** Criar um middleware limitador e aplicá-lo na rota pública de cadastro.

```javascript
// Adicionar nas declarações iniciais do arquivo (próximo à linha 35):
const cadastroRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Limita cada IP a criar no máximo 5 cadastros por hora
  message: {
    error: 'Muitos cadastros efetuados deste dispositivo. Tente novamente mais tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Alterar a assinatura da rota na linha 163:
router.post('/cadastro-paciente', cadastroRateLimiter, async (req, res) => {
```

### Correção 2: Validação de Formato e Comprimento de CPF
**Arquivo:** `app/backend/src/routes/auth.js`
**Solução:** Adicionar limpeza de caracteres não-numéricos e validação de tamanho antes do SELECT/INSERT para proteger o banco de dados de overflows e inconsistências.

```javascript
// Adicionar na linha 173 de auth.js (antes da verificação da UBS):

let cpfLimpo = null;
if (req.body.cpf) {
  cpfLimpo = req.body.cpf.replace(/[^\d]/g, ''); // Remove tudo que não for número
  
  if (cpfLimpo.length !== 11) {
    return res.status(400).json({ 
      error: 'CPF inválido. O documento deve conter exatamente 11 dígitos numéricos.' 
    });
  }
}

// Em seguida, na linha 180, substituir a busca de cpf duplicado por:
if (cpfLimpo) {
  const cpfExiste = await knex('pacientes').where({ cpf: cpfLimpo }).first();
  // ... resto do código inalterado
}

// Modificar também na linha 211, no payload do INSERT:
// cpf: cpfLimpo,
```

---

## Status de Retorno para Claude Cowork
- Tarefa: CONCLUÍDA
- Arquivos lidos: 9 (`CLAUDE.md`, `CadastroPaciente.jsx`, `LoginPaciente.jsx`, `useAuth.js`, `api.js`, `auth.js`, `knex.js`, `002_create_usuarios_gestores.js`, `003_create_pacientes.js`)
- Arquivos não encontrados: Nenhum. Todos os diretórios sugeridos de middlewares e models (inexistentes ou não aplicáveis na estrutura atual do app) foram validados através do `auth.js` e `knex.js`.
- Itens Críticos encontrados: 2
- Itens Médios encontrados: 2
- Itens Baixos encontrados: 1
- Próxima ação recomendada: Autorizar e iniciar a implementação imediata das duas Propostas de Correção listadas acima no arquivo `app/backend/src/routes/auth.js` para garantir estabilidade para a banca.
