/**
 * ROTAS DE AUTENTICAÇÃO (routes/auth.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Define as rotas públicas de login e auto-cadastro do sistema.
 *         Não exige autenticação (são as portas de entrada).
 *
 * ROTAS:
 *   POST /api/auth/login-gestor        → e-mail + senha → JWT (perfil gestor)
 *   POST /api/auth/login-paciente      → CRA + data_nascimento → JWT (paciente)
 *   GET  /api/auth/ubs                 → lista UBSs ativas para auto-cadastro
 *   POST /api/auth/cadastro-paciente   → auto-cadastro de novo paciente
 *
 * AUTO-CADASTRO:
 *   O paciente escolhe a UBS pelo bairro, preenche seus dados e recebe um CRA
 *   gerado automaticamente. O cadastro fica com status "pendente" até a UBS
 *   ativá-lo — isso evita que qualquer pessoa acesse dados de saúde sem validação
 *   presencial. Na tela de login, o paciente vê a mensagem de aguardar aprovação.
 *
 * LGPD: CPF não é retornado em nenhuma rota deste arquivo.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const knex    = require('../db/knex');

const router = express.Router();

// ─── POST /api/auth/login-gestor ─────────────────────────────────────────────
// Autentica um membro da equipe gestora (recepcionista, gestor, admin) via
// e-mail institucional + senha. Retorna JWT com 8h de validade.
router.post('/login-gestor', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    // Contas desativadas não podem gerar novas sessões. O filtro fica na própria
    // consulta para que uma conta inativa receba a mesma resposta de credencial inválida.
    const gestor = await knex('usuarios_gestores')
      .where({ email, ativo: true })
      .first();

    // Não distinguimos "usuário não encontrado" de "senha errada" por segurança
    if (!gestor) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // bcrypt.compare compara o texto puro com o hash armazenado com segurança
    const senhaValida = await bcrypt.compare(senha, gestor.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Monta o payload do JWT com os dados mínimos necessários nas próximas requisições
    const payload = {
      id:     gestor.id,
      nome:   gestor.nome,
      ubs_id: gestor.ubs_id,
      perfil: gestor.perfil,   // 'admin', 'gestor', 'recepcionista'
      tipo:   'gestor',         // Distingue do token do paciente
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    return res.json({ token, ...payload });
  } catch (err) {
    console.error('[login-gestor]', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── POST /api/auth/login-paciente ───────────────────────────────────────────
// Autentica um paciente via CRA (Cadastro de Regulação Ambulatorial) + data
// de nascimento. Não usa senha para facilitar o acesso por pessoas idosas.
// Retorna JWT com 12h de validade.
router.post('/login-paciente', async (req, res) => {
  try {
    const { cra, data_nascimento } = req.body;

    if (!cra || !data_nascimento) {
      return res.status(400).json({ error: 'CRA e data de nascimento são obrigatórios.' });
    }

    // A combinação CRA + data_nascimento é o "par de chave" do paciente.
    // O filtro de ativo impede acesso depois que a UBS desativa o cadastro.
    const paciente = await knex('pacientes')
      .where({ cra, ativo: true })
      .whereRaw('data_nascimento = ?', [data_nascimento])
      .first();

    if (!paciente) {
      return res.status(401).json({ error: 'CRA ou data de nascimento não conferem.' });
    }

    const payload = {
      id:     paciente.id,
      nome:   paciente.nome,
      ubs_id: paciente.ubs_id,
      tipo:   'paciente',
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

    return res.json({ token, ...payload });
  } catch (err) {
    console.error('[login-paciente]', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ─── GET /api/auth/ubs ───────────────────────────────────────────────────────
// Rota pública: retorna todas as UBSs ativas para exibir no select do cadastro.
// Ordenadas por bairro para facilitar a busca do munícipe.
// Não retorna dados sensíveis — apenas id, nome, bairro, endereco, telefone.
router.get('/ubs', async (req, res) => {
  try {
    const ubs = await knex('ubs')
      .where({ ativa: true })
      .select('id', 'nome', 'bairro', 'endereco', 'telefone')
      .orderBy('bairro');

    return res.json(ubs);
  } catch (err) {
    console.error('[GET /auth/ubs]', err);
    return res.status(500).json({ error: 'Erro ao buscar unidades de saúde.' });
  }
});


// ─── POST /api/auth/cadastro-paciente ────────────────────────────────────────
// Rota pública: permite que um munícipe se cadastre sem passar pelo gestor.
//
// FLUXO DE SEGURANÇA:
//   O cadastro é criado com ativo: false (pendente de aprovação pela UBS).
//   O paciente não consegue fazer login até a equipe da UBS ativar o cadastro.
//   Isso evita acesso não autorizado a dados de saúde sem validação presencial.
//
// CRA GERADO AUTOMATICAMENTE:
//   Formato: AAMMDD + 4 dígitos aleatórios (ex: 260611-4721)
//   Exibido na confirmação para o paciente anotar e levar à UBS.
//
// Body: { nome*, data_nascimento*, ubs_id*, bairro*, telefone, email, cpf }
router.post('/cadastro-paciente', async (req, res) => {
  try {
    const { nome, data_nascimento, ubs_id, bairro, telefone, email, cpf } = req.body;

    // Validação dos campos obrigatórios
    if (!nome || !data_nascimento || !ubs_id || !bairro) {
      return res.status(400).json({
        error: 'Nome completo, data de nascimento, unidade de saúde e bairro são obrigatórios.',
      });
    }

    // Verifica se a UBS escolhida existe e está ativa
    const ubs = await knex('ubs').where({ id: ubs_id, ativa: true }).first();
    if (!ubs) {
      return res.status(404).json({ error: 'Unidade de saúde não encontrada ou inativa.' });
    }

    // Verifica CPF duplicado se fornecido (campo único na tabela)
    if (cpf) {
      const cpfExiste = await knex('pacientes').where({ cpf }).first();
      if (cpfExiste) {
        return res.status(409).json({ error: 'CPF já cadastrado no sistema.' });
      }
    }

    // Gera o CRA automaticamente: AAMMDD + 4 dígitos aleatórios
    // Exemplo: 2606114721 (26 de junho de 2026 + 4721 aleatório)
    const hoje = new Date();
    const aammdd = String(hoje.getFullYear()).slice(2)
      + String(hoje.getMonth() + 1).padStart(2, '0')
      + String(hoje.getDate()).padStart(2, '0');
    const sufixo = String(Math.floor(Math.random() * 9000) + 1000); // 1000–9999
    const craNovo = `${aammdd}${sufixo}`;

    // Garante que o CRA gerado não colide com algum já existente (improvável mas seguro)
    const craExiste = await knex('pacientes').where({ cra: craNovo }).first();
    if (craExiste) {
      return res.status(500).json({
        error: 'Erro ao gerar número de cadastro. Tente novamente.',
      });
    }

    // Insere o paciente com ativo: false — aguarda validação presencial da UBS
    const [paciente] = await knex('pacientes')
      .insert({
        ubs_id,
        cra:            craNovo,
        nome:           nome.trim(),
        cpf:            cpf || null,
        data_nascimento,
        telefone:       telefone || null,
        email:          email || null,
        ativo:          false, // Pendente de aprovação — não pode fazer login ainda
      })
      .returning(['id', 'cra', 'nome', 'ubs_id']);

    return res.status(201).json({
      mensagem: 'Cadastro realizado com sucesso! Aguarde a aprovação da sua UBS para acessar o portal.',
      cra:      paciente.cra,   // O paciente deve anotar este número
      nome:     paciente.nome,
      ubs:      ubs.nome,
    });
  } catch (err) {
    console.error('[POST /auth/cadastro-paciente]', err);
    // Constraint única violada (CRA ou CPF duplicado por race condition)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Dados já cadastrados. Tente novamente.' });
    }
    return res.status(500).json({ error: 'Erro ao realizar cadastro.' });
  }
});


// Função auxiliar para remover acentos, trim e lowercase
function normalizar(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// ─── GET /api/auth/buscar-bairro ───────────────────────────────────────────────
// Rota pública: busca bairros para direcionar o paciente à UBS correta
// no momento do auto-cadastro.
router.get('/buscar-bairro', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const normalizadoQ = normalizar(q);

    const resultados = await knex('bairros_ubs as b')
      .join('ubs as u', 'u.id', 'b.ubs_id')
      .where('u.ativa', true)
      .where('b.bairro_busca', 'like', `%${normalizadoQ}%`)
      .select(
        'b.bairro',
        'b.ubs_id',
        'u.nome as ubs_nome',
        'u.endereco as ubs_endereco',
        'u.bairro as ubs_bairro',
        'u.telefone as ubs_telefone'
      )
      .orderByRaw(`CASE WHEN b.bairro_busca = ? THEN 0 ELSE 1 END`, [normalizadoQ])
      .orderBy('b.bairro', 'asc')
      .limit(8);

    return res.json(resultados);
  } catch (err) {
    console.error('[GET /auth/buscar-bairro]', err);
    return res.status(500).json({ error: 'Erro ao buscar bairro.' });
  }
});

module.exports = router;
