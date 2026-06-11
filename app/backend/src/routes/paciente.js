/**
 * ROTAS DO PORTAL DO PACIENTE (routes/paciente.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Permite que o paciente logado consulte seus próprios dados.
 *         O paciente NUNCA vê dados de outros pacientes (LGPD).
 *         Conforme Decreto Municipal 18.855/2021 de SJC.
 *
 * SEGURANÇA: Todas as rotas exigem:
 *   1. Token JWT válido (middleware auth.js)
 *   2. Token do tipo 'paciente' (middleware soPaciente abaixo)
 *   O paciente só acessa dados vinculados ao seu próprio ID (req.user.id).
 *
 * ROTAS:
 *   GET /api/paciente/meus-dados            → dados básicos do paciente logado
 *   GET /api/paciente/minhas-solicitacoes   → solicitações ativas do paciente
 *   GET /api/paciente/solicitacao/:id       → detalhe + histórico de status
 *   GET /api/paciente/medicamentos          → medicamentos da UBS de referência
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const knex    = require('../db/knex');

const router = express.Router();

// Campos de solicitação autorizados para o Portal do Paciente.
// A lista central evita que notas internas, como observacao_gestor e descricao
// técnica, sejam incluídas acidentalmente por um select implícito.
const CAMPOS_SOLICITACAO_PACIENTE = [
  'id',
  'tipo',
  'descricao_paciente',
  'status',
  'prioridade',
  'data_solicitacao',
  'data_prevista',
  'data_conclusao',
  'observacao_paciente',
  'local_executor',   // Onde o serviço será executado (ex: "Hospital Municipal de SJC")
  'criado_em',
  'atualizado_em',
];

// ─── Middleware local: garante que só pacientes acessam estas rotas ────────────
const soPaciente = (req, res, next) => {
  if (req.user?.tipo !== 'paciente') {
    return res.status(403).json({ error: 'Acesso exclusivo para pacientes.' });
  }
  next();
};

router.use(soPaciente);


// ─── GET /api/paciente/meus-dados ─────────────────────────────────────────────
// Retorna dados do paciente logado incluindo o nome e endereço da UBS vinculada.
// Não retorna CPF (redução de exposição de dados sensíveis — LGPD).
router.get('/meus-dados', async (req, res) => {
  try {
    const resultado = await knex('pacientes')
      .join('ubs', 'pacientes.ubs_id', 'ubs.id')
      .where('pacientes.id', req.user.id)
      .select(
        'pacientes.id',
        'pacientes.nome',
        'pacientes.cra',
        'pacientes.telefone',
        'pacientes.ubs_id',
        'ubs.nome        as ubs_nome',
        'ubs.endereco    as ubs_endereco',
        'ubs.telefone    as ubs_telefone',
        'ubs.bairro      as ubs_bairro'
      )
      .first();

    if (!resultado) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    // Organiza os dados da UBS como sub-objeto para o frontend usar resultado.ubs.nome
    const paciente = {
      id:       resultado.id,
      nome:     resultado.nome,
      cra:      resultado.cra,
      telefone: resultado.telefone,
      ubs_id:   resultado.ubs_id,
      ubs: {
        nome:     resultado.ubs_nome,
        endereco: resultado.ubs_endereco,
        telefone: resultado.ubs_telefone,
        bairro:   resultado.ubs_bairro,
      },
    };

    return res.json(paciente);
  } catch (err) {
    console.error('[GET /paciente/meus-dados]', err);
    return res.status(500).json({ error: 'Erro ao buscar dados do paciente.' });
  }
});


// ─── GET /api/paciente/minhas-solicitacoes ────────────────────────────────────
// Retorna somente solicitações ativas. Urgências aparecem primeiro e, dentro
// da mesma prioridade, o pedido mais recente vem antes.
router.get('/minhas-solicitacoes', async (req, res) => {
  try {
    const solicitacoes = await knex('solicitacoes')
      .where({ paciente_id: req.user.id })
      .whereNotIn('status', ['concluido', 'cancelado'])
      .select(CAMPOS_SOLICITACAO_PACIENTE)
      .orderByRaw(`
        CASE prioridade
          WHEN 'urgente' THEN 1
          WHEN 'prioritario' THEN 2
          ELSE 3
        END ASC
      `)
      .orderBy('data_solicitacao', 'desc');

    return res.json(solicitacoes);
  } catch (err) {
    console.error('[GET /paciente/minhas-solicitacoes]', err);
    return res.status(500).json({ error: 'Erro ao buscar solicitações.' });
  }
});


// ─── GET /api/paciente/solicitacao/:id ────────────────────────────────────────
// Retorna o detalhe completo de UMA solicitação + o histórico de mudanças de
// status (a "linha do tempo" exibida na tela de detalhe do paciente).
// Verifica se a solicitação pertence ao paciente logado (segurança).
router.get('/solicitacao/:id', async (req, res) => {
  try {
    const solicitacao = await knex('solicitacoes')
      .where({ id: req.params.id, paciente_id: req.user.id })
      .select(CAMPOS_SOLICITACAO_PACIENTE)
      .first();

    if (!solicitacao) {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }

    // Busca o histórico de mudanças de status, ordenado do mais antigo para o mais novo
    // Isso cria a linha do tempo cronológica exibida na tela de detalhe
    const historico = await knex('historico_status')
      .where({ solicitacao_id: req.params.id })
      .orderBy('alterado_em', 'asc');

    return res.json({ ...solicitacao, historico });
  } catch (err) {
    console.error('[GET /paciente/solicitacao/:id]', err);
    return res.status(500).json({ error: 'Erro ao buscar detalhes da solicitação.' });
  }
});


// ─── GET /api/paciente/medicamentos ──────────────────────────────────────────
// Lista medicamentos da UBS do paciente com busca parcial por nome/princípio ativo.
// Query param opcional: ?busca=metform → retorna "Metformina 500mg" (ILIKE)
// Retorna: disponíveis primeiro, depois alfabético.
router.get('/medicamentos', async (req, res) => {
  try {
    const { busca } = req.query;

    const query = knex('medicamentos')
      .where({ ubs_id: req.user.ubs_id })
      .select('id', 'nome', 'principio_ativo', 'disponivel', 'observacao', 'atualizado_em')
      .orderBy([{ column: 'disponivel', order: 'desc' }, { column: 'nome' }]);

    // Aplica busca parcial se o parâmetro foi enviado
    if (busca && busca.trim().length > 0) {
      const termo = `%${busca.trim()}%`;
      query.where(function () {
        this.whereILike('nome', termo).orWhereILike('principio_ativo', termo);
      });
    }

    const medicamentos = await query;
    return res.json(medicamentos);
  } catch (err) {
    console.error('[GET /paciente/medicamentos]', err);
    return res.status(500).json({ error: 'Erro ao buscar medicamentos.' });
  }
});

// ─── GET /api/paciente/comunicados ────────────────────────────────────────────
// Épico 3: Retorna comunicados visíveis para o paciente logado.
// Inclui comunicados gerais da UBS e comunicados individuais destinados a ele.
router.get('/comunicados', async (req, res) => {
  try {
    const comunicados = await knex('comunicados')
      .where('comunicados.ubs_id', req.user.ubs_id)
      // Retorna: comunicados gerais OU comunicados endereçados especificamente ao paciente
      .andWhere(function () {
        this.where('comunicados.tipo', 'geral').orWhere('comunicados.paciente_id', req.user.id);
      })
      .leftJoin('comunicados_leitura', function() {
        this.on('comunicados_leitura.comunicado_id', '=', 'comunicados.id')
            .andOn('comunicados_leitura.paciente_id', '=', knex.raw('?', [req.user.id]));
      })
      .select(
        'comunicados.id', 
        'comunicados.titulo', 
        'comunicados.mensagem', 
        'comunicados.tipo', 
        'comunicados.criado_em', 
        'comunicados.paciente_id',
        knex.raw('CASE WHEN comunicados_leitura.id IS NOT NULL THEN true ELSE false END as lido')
      )
      .orderBy('comunicados.criado_em', 'desc');

    return res.json(comunicados);
  } catch (err) {
    console.error('[GET /paciente/comunicados]', err);
    return res.status(500).json({ error: 'Erro ao buscar comunicados.' });
  }
});


// ─── POST /api/paciente/comunicado/:id/lido ──────────────────────────────────
// Épico 2: Marca o comunicado como lido pelo paciente logado.
router.post('/comunicado/:id/lido', async (req, res) => {
  try {
    // Insere ignorando conflito (se já leu, não faz nada)
    await knex.raw(`
      INSERT INTO comunicados_leitura (comunicado_id, paciente_id)
      VALUES (?, ?)
      ON CONFLICT (comunicado_id, paciente_id) DO NOTHING
    `, [req.params.id, req.user.id]);

    return res.json({ ok: true });
  } catch (err) {
    console.error('[POST /paciente/comunicado/:id/lido]', err);
    return res.status(500).json({ error: 'Erro ao marcar comunicado como lido.' });
  }
});


// ─── GET /api/paciente/agendamentos/disponiveis ───────────────────────────────
// Épico 4: Lista os slots disponíveis para agendamento na UBS do paciente.
// O paciente usa esta tela para escolher um horário e reservar.
router.get('/agendamentos/disponiveis', async (req, res) => {
  try {
    const disponiveis = await knex('agendamentos_gestao')
      .where({ ubs_id: req.user.ubs_id, status: 'disponivel' })
      // Só mostra horários futuros (data_hora maior que agora)
      .andWhere('data_hora', '>', knex.fn.now())
      .select('id', 'data_hora', 'duracao_minutos')
      .orderBy('data_hora', 'asc');

    return res.json(disponiveis);
  } catch (err) {
    console.error('[GET /paciente/agendamentos/disponiveis]', err);
    return res.status(500).json({ error: 'Erro ao buscar horários disponíveis.' });
  }
});


// ─── GET /api/paciente/agendamentos/meus ─────────────────────────────────────
// Épico 4: Lista os agendamentos já reservados pelo paciente logado.
router.get('/agendamentos/meus', async (req, res) => {
  try {
    const meus = await knex('agendamentos_gestao')
      .where({ paciente_id: req.user.id })
      .select('id', 'data_hora', 'duracao_minutos', 'status', 'motivo')
      .orderBy('data_hora', 'desc');

    return res.json(meus);
  } catch (err) {
    console.error('[GET /paciente/agendamentos/meus]', err);
    return res.status(500).json({ error: 'Erro ao buscar seus agendamentos.' });
  }
});


// ─── POST /api/paciente/agendamento/:id/reservar ──────────────────────────────
// Épico 4: Reserva um slot disponível para o paciente logado.
// Body: { motivo }
router.post('/agendamento/:id/reservar', async (req, res) => {
  try {
    const { motivo } = req.body;

    // Busca o agendamento garantindo que pertence à UBS do paciente
    const agendamento = await knex('agendamentos_gestao')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .first();

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }

    // Impede reserva de slot já ocupado (race condition protection)
    if (agendamento.status !== 'disponivel') {
      return res.status(409).json({ error: 'Este horário não está mais disponível.' });
    }

    // Vincula o paciente ao slot e marca como reservado
    const [atualizado] = await knex('agendamentos_gestao')
      .where({ id: req.params.id })
      .update({
        paciente_id: req.user.id,
        status:      'reservado',
        motivo:      motivo || null,
      })
      .returning('*');

    return res.json(atualizado);
  } catch (err) {
    console.error('[POST /paciente/agendamento/:id/reservar]', err);
    return res.status(500).json({ error: 'Erro ao reservar agendamento.' });
  }
});


// ─── POST /api/paciente/push-subscribe ───────────────────────────────────────
// Salva a subscription de push notification do dispositivo do paciente.
// Chamado automaticamente pelo frontend após o usuário aceitar as notificações.
// Um paciente pode ter múltiplos dispositivos inscritos (celular + desktop).
router.post('/push-subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Dados de subscription inválidos.' });
    }

    // Salva ou ignora se já existir (upsert via ON CONFLICT DO NOTHING)
    await knex('push_subscriptions')
      .insert({
        usuario_id:   req.user.id,
        tipo_usuario: 'paciente',
        endpoint,
        p256dh: keys.p256dh,
        auth:   keys.auth,
      })
      .onConflict(['usuario_id', 'tipo_usuario', 'endpoint'])
      .ignore();

    return res.json({ ok: true });
  } catch (err) {
    console.error('[POST /paciente/push-subscribe]', err);
    return res.status(500).json({ error: 'Erro ao salvar subscription.' });
  }
});


// ─── DELETE /api/paciente/push-subscribe ─────────────────────────────────────
// Remove a subscription do dispositivo atual (quando usuário revoga permissão).
router.delete('/push-subscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await knex('push_subscriptions')
        .where({ usuario_id: req.user.id, tipo_usuario: 'paciente', endpoint })
        .delete();
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /paciente/push-subscribe]', err);
    return res.status(500).json({ error: 'Erro ao remover subscription.' });
  }
});


// ─── GET /api/paciente/vapid-public-key ──────────────────────────────────────
// Expõe a chave pública VAPID para o frontend configurar o service worker.
// Esta chave é pública por natureza — não há risco em expô-la.
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});


module.exports = router;
