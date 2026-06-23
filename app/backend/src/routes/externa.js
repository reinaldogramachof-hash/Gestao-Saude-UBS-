/**
 * ROTAS DO PORTAL DE UNIDADES EXTERNAS (routes/externa.js)
 * -----------------------------------------------------------------------------
 * Permite que AMEs, CAPS, hospitais e centros especializados acompanhem os
 * encaminhamentos recebidos pela UBS. Todas as rotas exigem JWT de unidade
 * externa e restringem os dados por unidade_externa_id para preservar LGPD.
 */
const express = require('express');
const Joi = require('joi');
const knex = require('../db/knex');
const validateBody = require('../middleware/validateBody');
const { soExterna } = require('../middleware/auth');
const { registrarAuditoria } = require('../services/auditService');

const router = express.Router();

router.use(soExterna);

const CAMPOS_ENCAMINHAMENTO_EXTERNA = [
  'encaminhamentos.id',
  'pacientes.nome as paciente_nome',
  'pacientes.cra as paciente_cra',
  'ubs.nome as ubs_nome',
  'encaminhamentos.especialidade',
  'catalogo_procedimentos.nome as catalogo_nome',
  'encaminhamentos.prioridade',
  'encaminhamentos.status',
  'encaminhamentos.data_solicitacao',
  'encaminhamentos.data_procedimento_unidade',
  'encaminhamentos.confirmado_paciente',
  'encaminhamentos.feedback_tipo',
  // feedback_conduta e feedback_data_retorno são necessários para o dashboard calcular
  // concluídos hoje e para o frontend exibir a conduta no card de retorno
  'encaminhamentos.feedback_conduta',
  'encaminhamentos.feedback_data_retorno',
  'encaminhamentos.observacoes',
  'encaminhamentos.solicitacao_id',
  // Necessário para ordenar "Últimos encaminhamentos" no dashboard por data de criação
  'encaminhamentos.atualizado_em',
];

const agendamentoSchema = Joi.object({
  data_procedimento_unidade: Joi.date().iso().required(),
});

const feedbackSchema = Joi.object({
  feedback_tipo: Joi.string().valid(
    'REALIZADO_SEM_INTERCORRENCIAS',
    'REALIZADO_COM_INTERCORRENCIAS',
    'CANCELADO_AUSENCIA',
    'CANCELADO_CONTRAINDICADO',
    'NECESSITA_RETORNO',
    'ENCAMINHAMENTO_ESPECIALIDADE',
    'INTERNACAO_NECESSARIA'
  ).required(),
  feedback_conduta: Joi.string().trim().min(3).max(4000).required(),
});

async function buscarEncaminhamentoOuResponder(req, res) {
  const encaminhamento = await knex('encaminhamentos')
    .where({ id: req.params.id })
    .first();

  if (!encaminhamento) {
    res.status(404).json({ error: 'Encaminhamento nao encontrado.' });
    return null;
  }

  if (Number(encaminhamento.unidade_externa_id) !== Number(req.user.id)) {
    res.status(403).json({ error: 'Encaminhamento pertence a outra unidade externa.' });
    return null;
  }

  return encaminhamento;
}

router.get('/dashboard', async (req, res) => {
  try {
    const base = () => knex('encaminhamentos').where({ unidade_externa_id: req.user.id });

    const [pendentes, agendados, aguardandoConfirmacao, realizadosHoje] = await Promise.all([
      base().where({ status: 'RECEBIDO' }).count('id as total').first(),
      base().where({ status: 'AGENDADO' }).count('id as total').first(),
      base().where({ status: 'AGUARDANDO_CONFIRMACAO' }).count('id as total').first(),
      base()
        .where({ status: 'RETORNO_UBS' })
        .whereRaw('feedback_data_retorno::date = CURRENT_DATE')
        .count('id as total')
        .first(),
    ]);

    return res.json({
      pendentes: Number(pendentes.total || 0),
      agendados: Number(agendados.total || 0),
      aguardando_confirmacao: Number(aguardandoConfirmacao.total || 0),
      realizados_hoje: Number(realizadosHoje.total || 0),
    });
  } catch (err) {
    console.error('[GET /externa/dashboard]', err);
    return res.status(500).json({ error: 'Erro ao carregar painel da unidade externa.' });
  }
});

router.get('/encaminhamentos', async (req, res) => {
  try {
    const encaminhamentos = await knex('encaminhamentos')
      .join('pacientes', 'encaminhamentos.paciente_id', 'pacientes.id')
      .leftJoin('ubs', 'encaminhamentos.ubs_id', 'ubs.id')
      .leftJoin('solicitacoes', 'encaminhamentos.solicitacao_id', 'solicitacoes.id')
      .leftJoin('catalogo_procedimentos', 'solicitacoes.catalogo_id', 'catalogo_procedimentos.id')
      // Qualifica a coluna para evitar ambiguidade — solicitacoes também tem unidade_externa_id
      .where('encaminhamentos.unidade_externa_id', req.user.id)
      .select(CAMPOS_ENCAMINHAMENTO_EXTERNA)
      .orderByRaw(`
        CASE encaminhamentos.status
          WHEN 'AGUARDANDO_CONFIRMACAO' THEN 1
          WHEN 'RECEBIDO' THEN 2
          WHEN 'AGENDADO' THEN 3
          ELSE 4
        END ASC
      `)
      .orderBy('encaminhamentos.data_solicitacao', 'asc');

    return res.json(encaminhamentos);
  } catch (err) {
    console.error('[GET /externa/encaminhamentos]', err);
    return res.status(500).json({ error: 'Erro ao listar encaminhamentos.' });
  }
});

router.put('/encaminhamento/:id/receber', async (req, res) => {
  try {
    const encaminhamento = await buscarEncaminhamentoOuResponder(req, res);
    if (!encaminhamento) return undefined;

    if (encaminhamento.status !== 'AGUARDANDO_VAGA') {
      return res.status(409).json({ error: 'Apenas encaminhamentos aguardando vaga podem ser recebidos.' });
    }

    await knex.transaction(async (trx) => {
      await trx('encaminhamentos')
        .where({ id: encaminhamento.id })
        .update({ status: 'RECEBIDO', atualizado_em: trx.fn.now() });

      if (encaminhamento.solicitacao_id) {
        await trx('historico_status').insert({
          solicitacao_id: encaminhamento.solicitacao_id,
          gestor_id: null,
          status_anterior: 'aguardando_regulacao',
          status_novo: 'aguardando_regulacao',
          observacao: 'Recebido pela unidade externa',
        });
      }
    });

    await registrarAuditoria(req, {
      acao: 'encaminhamento_recebido',
      entidade: 'encaminhamentos',
      entidade_id: encaminhamento.id,
      escopo_ubs_id: encaminhamento.ubs_id,
    });

    return res.json({ ok: true, status: 'RECEBIDO' });
  } catch (err) {
    console.error('[PUT /externa/encaminhamento/:id/receber]', err);
    return res.status(500).json({ error: 'Erro ao receber encaminhamento.' });
  }
});

router.put('/encaminhamento/:id/agendar', validateBody(agendamentoSchema), async (req, res) => {
  try {
    const encaminhamento = await buscarEncaminhamentoOuResponder(req, res);
    if (!encaminhamento) return undefined;

    if (encaminhamento.status !== 'RECEBIDO') {
      return res.status(409).json({ error: 'Apenas encaminhamentos recebidos podem ser agendados.' });
    }

    await knex.transaction(async (trx) => {
      await trx('encaminhamentos')
        .where({ id: encaminhamento.id })
        .update({
          status: 'AGUARDANDO_CONFIRMACAO',
          data_procedimento_unidade: req.body.data_procedimento_unidade,
          atualizado_em: trx.fn.now(),
        });

      if (encaminhamento.solicitacao_id) {
        const solicitacao = await trx('solicitacoes')
          .where({ id: encaminhamento.solicitacao_id })
          .first();

        await trx('solicitacoes')
          .where({ id: encaminhamento.solicitacao_id })
          .update({
            status: 'data_marcada',
            data_prevista: req.body.data_procedimento_unidade,
            atualizado_em: trx.fn.now(),
          });

        await trx('historico_status').insert({
          solicitacao_id: encaminhamento.solicitacao_id,
          gestor_id: null,
          status_anterior: solicitacao?.status || null,
          status_novo: 'data_marcada',
          observacao: 'Procedimento agendado pela unidade externa',
        });
      }
    });

    await registrarAuditoria(req, {
      acao: 'encaminhamento_agendado_unidade',
      entidade: 'encaminhamentos',
      entidade_id: encaminhamento.id,
      escopo_ubs_id: encaminhamento.ubs_id,
      metadata: { data_procedimento_unidade: req.body.data_procedimento_unidade },
    });

    return res.json({ ok: true, status: 'AGUARDANDO_CONFIRMACAO' });
  } catch (err) {
    console.error('[PUT /externa/encaminhamento/:id/agendar]', err);
    return res.status(500).json({ error: 'Erro ao agendar encaminhamento.' });
  }
});

router.put('/encaminhamento/:id/concluir', validateBody(feedbackSchema), async (req, res) => {
  try {
    const encaminhamento = await buscarEncaminhamentoOuResponder(req, res);
    if (!encaminhamento) return undefined;

    if (!['CONFIRMADO_PACIENTE', 'AGENDADO'].includes(encaminhamento.status)) {
      return res.status(409).json({ error: 'Encaminhamento ainda nao pode receber retorno.' });
    }

    await knex.transaction(async (trx) => {
      await trx('encaminhamentos')
        .where({ id: encaminhamento.id })
        .update({
          status: 'RETORNO_UBS',
          feedback_tipo: req.body.feedback_tipo,
          feedback_conduta: req.body.feedback_conduta,
          feedback_data_retorno: trx.fn.now(),
          atualizado_em: trx.fn.now(),
        });

      if (encaminhamento.solicitacao_id) {
        const solicitacao = await trx('solicitacoes')
          .where({ id: encaminhamento.solicitacao_id })
          .first();

        await trx('solicitacoes')
          .where({ id: encaminhamento.solicitacao_id })
          .update({
            status: 'concluido',
            data_conclusao: trx.fn.now(),
            atualizado_em: trx.fn.now(),
          });

        await trx('historico_status').insert({
          solicitacao_id: encaminhamento.solicitacao_id,
          gestor_id: null,
          status_anterior: solicitacao?.status || null,
          status_novo: 'concluido',
          observacao: req.body.feedback_tipo,
        });
      }
    });

    await registrarAuditoria(req, {
      acao: 'encaminhamento_retorno_enviado',
      entidade: 'encaminhamentos',
      entidade_id: encaminhamento.id,
      escopo_ubs_id: encaminhamento.ubs_id,
      metadata: { feedback_tipo: req.body.feedback_tipo },
    });

    return res.json({ ok: true, status: 'RETORNO_UBS' });
  } catch (err) {
    console.error('[PUT /externa/encaminhamento/:id/concluir]', err);
    return res.status(500).json({ error: 'Erro ao concluir encaminhamento.' });
  }
});

router.get('/paciente/:id', async (req, res) => {
  try {
    const possuiEncaminhamento = await knex('encaminhamentos')
      .where({
        paciente_id: req.params.id,
        unidade_externa_id: req.user.id,
      })
      .whereNot('status', 'CANCELADO')
      .first();

    if (!possuiEncaminhamento) {
      return res.status(404).json({ error: 'Paciente nao encontrado para esta unidade externa.' });
    }

    const paciente = await knex('pacientes')
      .where({ id: req.params.id })
      .select('nome', 'cra', 'data_nascimento', 'tipo_sanguineo', 'alergias', 'comorbidades')
      .first();

    return res.json(paciente);
  } catch (err) {
    console.error('[GET /externa/paciente/:id]', err);
    return res.status(500).json({ error: 'Erro ao buscar paciente.' });
  }
});

module.exports = router;
