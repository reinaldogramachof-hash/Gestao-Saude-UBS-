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
const auditMiddleware = require('../middleware/auditMiddleware');
const { soExterna } = require('../middleware/auth');
const { registrarAuditoria } = require('../services/auditService');
// Push notifications: notifica o paciente quando a unidade externa agenda ou conclui
const pushService = require('../services/pushService');
const gestorNotificationService = require('../services/gestorNotificationService');
const MENSAGENS = require('../utils/mensagens');

const router = express.Router();

router.use(soExterna);
router.use(auditMiddleware({ modulo: 'externa' }));

const CAMPOS_ENCAMINHAMENTO_EXTERNA = [
  'encaminhamentos.id',
  'encaminhamentos.paciente_id as paciente_id',
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
    res.status(404).json({ error: MENSAGENS.ENCAMINHAMENTO.NAO_ENCONTRADO });
    return null;
  }

  if (Number(encaminhamento.unidade_externa_id) !== Number(req.user.id)) {
    res.status(403).json({ error: MENSAGENS.AUTH.ACESSO_NEGADO });
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
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
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
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

router.put('/encaminhamento/:id/receber', async (req, res) => {
  try {
    const encaminhamento = await buscarEncaminhamentoOuResponder(req, res);
    if (!encaminhamento) return undefined;

    if (encaminhamento.status !== 'AGUARDANDO_VAGA') {
      return res.status(409).json({ error: MENSAGENS.PACIENTE.DADOS_INVALIDOS });
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

    // Notifica os gestores da UBS que o encaminhamento foi recebido pela unidade externa
    await gestorNotificationService.criarNotificacao(encaminhamento.ubs_id, {
      tipo_evento: 'status_encaminhamento',
      titulo: 'Encaminhamento recebido externamente',
      mensagem: `O encaminhamento do paciente #${encaminhamento.paciente_id} foi recebido por ${req.user.nome}.`,
      rota_destino: '/regulacao',
      entidade: 'encaminhamentos',
      entidade_id: encaminhamento.id
    });

    return res.json({ ok: true, status: 'RECEBIDO' });
  } catch (err) {
    console.error('[PUT /externa/encaminhamento/:id/receber]', err);
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

router.put('/encaminhamento/:id/agendar', validateBody(agendamentoSchema), async (req, res) => {
  try {
    const encaminhamento = await buscarEncaminhamentoOuResponder(req, res);
    if (!encaminhamento) return undefined;

    if (encaminhamento.status !== 'RECEBIDO') {
      return res.status(409).json({ error: MENSAGENS.PACIENTE.DADOS_INVALIDOS });
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

    // Notifica os gestores da UBS sobre o agendamento externo
    await gestorNotificationService.criarNotificacao(encaminhamento.ubs_id, {
      tipo_evento: 'status_encaminhamento',
      titulo: 'Consulta/Procedimento agendado',
      mensagem: `Atendimento do paciente #${encaminhamento.paciente_id} agendado para ${req.body.data_procedimento_unidade} em ${req.user.nome}.`,
      rota_destino: '/regulacao',
      entidade: 'encaminhamentos',
      entidade_id: encaminhamento.id
    });

    // Notifica o paciente: data do procedimento foi confirmada pela unidade externa.
    // Feito fora da transação — falha no push não desfaz o agendamento.
    pushService.enviar(encaminhamento.paciente_id, 'paciente', {
      titulo: 'Data agendada para seu encaminhamento',
      corpo:  `Seu atendimento foi agendado para ${req.body.data_procedimento_unidade}. Confira os detalhes no app.`,
      url:    `/paciente/solicitacao/${encaminhamento.solicitacao_id}`,
    }).catch(() => {});

    return res.json({ ok: true, status: 'AGUARDANDO_CONFIRMACAO' });
  } catch (err) {
    console.error('[PUT /externa/encaminhamento/:id/agendar]', err);
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

router.put('/encaminhamento/:id/concluir', validateBody(feedbackSchema), async (req, res) => {
  try {
    const encaminhamento = await buscarEncaminhamentoOuResponder(req, res);
    if (!encaminhamento) return undefined;

    if (!['CONFIRMADO_PACIENTE', 'AGENDADO'].includes(encaminhamento.status)) {
      return res.status(409).json({ error: MENSAGENS.PACIENTE.DADOS_INVALIDOS });
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

        // Se o feedback for de cancelamento ou recusa clínica, a solicitação retorna para a regulação da UBS 
        // para que a equipe gestora possa reavaliar o caso e tomar providências (como re-encaminhar para outra unidade).
        const ehCancelamento = ['CANCELADO_AUSENCIA', 'CANCELADO_CONTRAINDICADO'].includes(req.body.feedback_tipo);
        const statusNovoSolicitacao = ehCancelamento ? 'aguardando_regulacao' : 'concluido';
        const dataConclusao = ehCancelamento ? null : trx.fn.now();

        await trx('solicitacoes')
          .where({ id: encaminhamento.solicitacao_id })
          .update({
            status: statusNovoSolicitacao,
            data_conclusao: dataConclusao,
            atualizado_em: trx.fn.now(),
          });

        // GAP 2B: Define o status e a observação amigáveis (linguagem simples) para a timeline do paciente.
        // O status_novo visual vira 'retorno_ubs_pendente' (cancelamento) ou 'retorno_ubs_concluido' (conclusão normal).
        const statusNovoHistorico = ehCancelamento ? 'retorno_ubs_pendente' : 'retorno_ubs_concluido';
        const observacaoHistorico = ehCancelamento
          ? 'Seu encaminhamento foi devolvido pela unidade externa. Sua UBS irá reavaliá-lo em breve.'
          : `Seu atendimento foi realizado com sucesso. Conduta: ${req.body.feedback_conduta}`;

        await trx('historico_status').insert({
          solicitacao_id: encaminhamento.solicitacao_id,
          gestor_id:      null, // Ação disparada pela Unidade Externa
          status_anterior: solicitacao?.status || null,
          status_novo:     statusNovoHistorico,
          observacao:     observacaoHistorico,
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

    // Identifica se foi cancelamento/devolução ou conclusão
    const ehCancelamento = ['CANCELADO_AUSENCIA', 'CANCELADO_CONTRAINDICADO'].includes(req.body.feedback_tipo);
    const tituloNotificacao = ehCancelamento ? 'Encaminhamento devolvido por unidade externa' : 'Atendimento externo concluído';
    const msgNotificacao = ehCancelamento 
      ? `Encaminhamento do paciente #${encaminhamento.paciente_id} devolvido por ${req.user.nome}. Motivo: ${req.body.feedback_tipo}.`
      : `Encaminhamento do paciente #${encaminhamento.paciente_id} concluído por ${req.user.nome}. Conduta enviada.`;

    // Notifica os gestores da UBS sobre o retorno clínico/devolução
    await gestorNotificationService.criarNotificacao(encaminhamento.ubs_id, {
      tipo_evento: 'retorno_externo',
      titulo: tituloNotificacao,
      mensagem: msgNotificacao,
      rota_destino: '/regulacao',
      entidade: 'encaminhamentos',
      entidade_id: encaminhamento.id
    });

    // GAP 1: Verifica prioridade urgente para disparo de alerta imediato ao gestor e push ao paciente
    if (encaminhamento.solicitacao_id && !ehCancelamento) {
      const solicitacaoRetorno = await knex('solicitacoes')
        .where({ id: encaminhamento.solicitacao_id })
        .select('prioridade', 'id')
        .first();

      if (solicitacaoRetorno?.prioridade === 'urgente') {
        // Dispara alerta vermelho pulsante no sino do gestor com rota para agendamentos
        await gestorNotificationService.criarNotificacao(encaminhamento.ubs_id, {
          tipo_evento: 'urgencia_escalada',
          titulo: 'Retorno URGENTE — Agendar imediatamente',
          mensagem: `Paciente #${encaminhamento.paciente_id} retornou da rede externa com prioridade URGENTE. Providencie agendamento imediato na UBS.`,
          rota_destino: '/agendamentos',
          entidade: 'encaminhamentos',
          entidade_id: encaminhamento.id
        });

        // Push direto ao paciente urgente informando que ele deve retornar à UBS
        pushService.enviar(encaminhamento.paciente_id, 'paciente', {
          titulo: 'Retorno à sua UBS necessário',
          corpo:  'Seu atendimento externo foi concluído. Por ser prioritário, sua UBS irá agendar seu retorno em breve. Fique atento ao portal.',
          url:    `/paciente/solicitacao/${encaminhamento.solicitacao_id}`,
        }).catch(() => {});
      }
    }

    // Notifica o paciente de acordo com o resultado real do procedimento externo.
    // Feito fora da transação — falha no push não desfaz a gravação dos dados.
    const tituloPush = ehCancelamento ? 'Encaminhamento retornado à UBS' : 'Atendimento externo concluído';
    const corpoPush = ehCancelamento 
      ? 'Seu encaminhamento foi devolvido para reavaliação da UBS. Acompanhe pelo aplicativo.'
      : 'Seu procedimento foi realizado. A conduta foi enviada à sua UBS. Confira os detalhes no app.';

    pushService.enviar(encaminhamento.paciente_id, 'paciente', {
      titulo: tituloPush,
      corpo:  corpoPush,
      url:    `/paciente/solicitacao/${encaminhamento.solicitacao_id}`,
    }).catch(() => {});

    return res.json({ ok: true, status: 'RETORNO_UBS' });
  } catch (err) {
    console.error('[PUT /externa/encaminhamento/:id/concluir]', err);
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
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
      return res.status(404).json({ error: MENSAGENS.PACIENTE.NAO_ENCONTRADO });
    }

    const paciente = await knex('pacientes')
      .where({ id: req.params.id })
      .select('nome', 'cra', 'data_nascimento', 'tipo_sanguineo', 'alergias', 'comorbidades')
      .first();

    return res.json(paciente);
  } catch (err) {
    console.error('[GET /externa/paciente/:id]', err);
    return res.status(500).json({ error: MENSAGENS.GERAL.ERRO_INTERNO });
  }
});

module.exports = router;
