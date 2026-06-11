/**
 * ROTAS DE AUTENTICAÇÃO (routes/auth.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Define as rotas públicas de login para os dois portais do sistema.
 *         Não exige autenticação (são as portas de entrada).
 *
 * ROTAS:
 *   POST /api/auth/login-gestor   → e-mail + senha → JWT (perfil gestor)
 *   POST /api/auth/login-paciente → CRA + data_nascimento → JWT (perfil paciente)
 *
 * FLUXO:
 *   1. Recebe credenciais no body da requisição
 *   2. Busca o usuário no banco de dados
 *   3. Valida a senha (bcrypt) ou a combinação CRA + data
 *   4. Assina e devolve um JWT com os dados básicos do usuário
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

module.exports = router;
