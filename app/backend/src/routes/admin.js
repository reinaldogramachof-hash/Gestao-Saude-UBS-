/**
 * ROTAS ADMINISTRATIVAS DE USUÁRIOS GESTORES (routes/admin.js)
 * -----------------------------------------------------------------------------
 * FUNÇÃO: Permite que administradores gerenciem a equipe da própria UBS.
 *         O módulo lista, cadastra, edita, redefine senhas, desativa e reativa
 *         contas sem remover registros do banco.
 *
 * SEGURANÇA:
 *   - O JWT é validado em server.js antes de chegar neste router.
 *   - Todas as rotas exigem perfil "admin".
 *   - Toda consulta por usuário também exige o ubs_id do token.
 *   - senha_hash nunca faz parte de uma seleção ou resposta.
 *
 * ROTAS:
 *   GET    /api/admin/usuarios
 *   POST   /api/admin/usuario
 *   PATCH  /api/admin/usuario/:id
 *   PATCH  /api/admin/usuario/:id/senha
 *   DELETE /api/admin/usuario/:id
 */
const express = require('express');
const bcrypt = require('bcrypt');
const knex = require('../db/knex');

const router = express.Router();
// 'medico' adicionado para suportar o Painel Médico (acesso read-only ao prontuário)
const PERFIS_VALIDOS = ['recepcionista', 'gestor', 'admin', 'medico'];
const CAMPOS_PUBLICOS = ['id', 'nome', 'email', 'perfil', 'ativo', 'criado_em'];

// Bloqueia recepcionistas e gestores mesmo quando possuem um JWT válido.
const somenteAdmin = (req, res, next) => {
  if (req.user?.perfil !== 'admin') {
    return res.status(403).json({
      error: 'Acesso exclusivo para administradores da UBS.',
    });
  }
  next();
};

router.use(somenteAdmin);

// Confirma a existência do usuário dentro da UBS do admin. Centralizar esta
// consulta evita que alguma rota esqueça o filtro de isolamento entre unidades.
const buscarUsuarioDaUbs = (id, ubsId) => knex('usuarios_gestores')
  .where({ id, ubs_id: ubsId })
  .select(...CAMPOS_PUBLICOS)
  .first();

// GET /api/admin/usuarios
// Lista somente campos públicos dos usuários vinculados à unidade autenticada.
router.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await knex('usuarios_gestores')
      .where({ ubs_id: req.user.ubs_id })
      .select('id', 'nome', 'email', 'perfil', 'ativo', 'criado_em')
      .orderBy('nome', 'asc');

    return res.json(usuarios);
  } catch (err) {
    console.error('[GET /admin/usuarios]', err);
    return res.status(500).json({ error: 'Erro ao buscar usuários da unidade.' });
  }
});

// POST /api/admin/usuario
// Cria uma conta ativa na mesma UBS do admin, ignorando qualquer UBS do body.
router.post('/usuario', async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;

    if (!nome || !email || !senha || !perfil) {
      return res.status(400).json({
        error: 'Nome, e-mail, senha e perfil são obrigatórios.',
      });
    }
    if (senha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }
    if (!PERFIS_VALIDOS.includes(perfil)) {
      return res.status(400).json({ error: 'Perfil de usuário inválido.' });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const emailExistente = await knex('usuarios_gestores')
      .where({ email: emailNormalizado })
      .first();

    if (emailExistente) {
      return res.status(409).json({ error: 'E-mail já cadastrado no sistema.' });
    }

    // O custo 12 equilibra segurança e tempo de resposta para uma operação rara.
    const senhaHash = await bcrypt.hash(senha, 12);
    const [usuario] = await knex('usuarios_gestores')
      .insert({
        nome: nome.trim(),
        email: emailNormalizado,
        senha_hash: senhaHash,
        perfil,
        ubs_id: req.user.ubs_id,
        ativo: true,
      })
      .returning(['id', 'nome', 'email', 'perfil', 'ubs_id']);

    return res.status(201).json(usuario);
  } catch (err) {
    console.error('[POST /admin/usuario]', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'E-mail já cadastrado no sistema.' });
    }
    return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});

// PATCH /api/admin/usuario/:id
// Atualiza dados públicos e também aceita "ativo" para a reativação solicitada
// pela interface. A desativação continua exclusiva do DELETE lógico.
router.patch('/usuario/:id', async (req, res) => {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(403).json({
        error: 'Não é permitido alterar o próprio perfil por esta tela.',
      });
    }

    const existente = await buscarUsuarioDaUbs(req.params.id, req.user.ubs_id);
    if (!existente) {
      return res.status(404).json({ error: 'Usuário não encontrado nesta UBS.' });
    }

    const { nome, email, perfil, ativo } = req.body;
    if (perfil !== undefined && !PERFIS_VALIDOS.includes(perfil)) {
      return res.status(400).json({ error: 'Perfil de usuário inválido.' });
    }

    const emailNormalizado = email?.trim().toLowerCase();
    if (emailNormalizado && emailNormalizado !== existente.email) {
      const emailEmUso = await knex('usuarios_gestores')
        .where({ email: emailNormalizado })
        .whereNot({ id: req.params.id })
        .first();
      if (emailEmUso) {
        return res.status(409).json({ error: 'E-mail já cadastrado no sistema.' });
      }
    }

    // Somente campos enviados entram no update para não apagar dados existentes.
    const alteracoes = {};
    if (nome !== undefined) alteracoes.nome = nome.trim();
    if (email !== undefined) alteracoes.email = emailNormalizado;
    if (perfil !== undefined) alteracoes.perfil = perfil;
    if (typeof ativo === 'boolean') alteracoes.ativo = ativo;

    if (Object.keys(alteracoes).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido foi informado.' });
    }

    await knex('usuarios_gestores')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .update(alteracoes);

    const atualizado = await buscarUsuarioDaUbs(req.params.id, req.user.ubs_id);
    return res.json(atualizado);
  } catch (err) {
    console.error('[PATCH /admin/usuario/:id]', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'E-mail já cadastrado no sistema.' });
    }
    return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// PATCH /api/admin/usuario/:id/senha
// Redefine a senha de outro membro da equipe sem retornar o novo hash.
router.patch('/usuario/:id/senha', async (req, res) => {
  try {
    const { nova_senha } = req.body;
    if (!nova_senha || nova_senha.length < 6) {
      return res.status(400).json({
        error: 'A nova senha deve ter no mínimo 6 caracteres.',
      });
    }
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(403).json({
        error: 'Use o fluxo da própria conta para alterar sua senha.',
      });
    }

    const existente = await buscarUsuarioDaUbs(req.params.id, req.user.ubs_id);
    if (!existente) {
      return res.status(404).json({ error: 'Usuário não encontrado nesta UBS.' });
    }

    const senhaHash = await bcrypt.hash(nova_senha, 12);
    await knex('usuarios_gestores')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .update({ senha_hash: senhaHash });

    return res.json({ mensagem: 'Senha atualizada com sucesso.' });
  } catch (err) {
    console.error('[PATCH /admin/usuario/:id/senha]', err);
    return res.status(500).json({ error: 'Erro ao atualizar senha.' });
  }
});

// DELETE /api/admin/usuario/:id
// A exclusão é lógica: preserva auditoria e relacionamentos históricos.
router.delete('/usuario/:id', async (req, res) => {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(403).json({ error: 'Não é permitido desativar a própria conta.' });
    }

    const existente = await buscarUsuarioDaUbs(req.params.id, req.user.ubs_id);
    if (!existente) {
      return res.status(404).json({ error: 'Usuário não encontrado nesta UBS.' });
    }

    await knex('usuarios_gestores')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .update({ ativo: false });

    return res.json({ mensagem: 'Usuário desativado.' });
  } catch (err) {
    console.error('[DELETE /admin/usuario/:id]', err);
    return res.status(500).json({ error: 'Erro ao desativar usuário.' });
  }
});

module.exports = router;
