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
 *   POST /api/paciente/agendamento/:id/reservar → reserva um horário de atendimento
 *   PUT /api/paciente/agendamento/:id/cancelar → cancela um agendamento reservado
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const jwt     = require('jsonwebtoken');
const knex    = require('../db/knex');
const { registrarAuditoria } = require('../services/auditService');

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


// ─── GET /api/paciente/perfil ───────────────────────────────────────────────
// Retorna todos os dados pessoais (com CPF mascarado e formatado) e os dados
// clínicos do paciente logado. Realiza JOIN com a tabela de UBS para trazer
// as informações da unidade de saúde vinculada e mapeia ubs.bairro para exibição.
router.get('/perfil', async (req, res) => {
  try {
    const resultado = await knex('pacientes')
      .join('ubs', 'pacientes.ubs_id', 'ubs.id')
      .where('pacientes.id', req.user.id)
      .select(
        'pacientes.*',
        'ubs.nome        as ubs_nome',
        'ubs.endereco    as ubs_endereco',
        'ubs.telefone    as ubs_telefone',
        'ubs.bairro      as ubs_bairro'
      )
      .first();

    if (!resultado) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    // Mascara o CPF para segurança (LGPD) mantendo os primeiros 3 e os últimos 2 dígitos
    // Ex: 123.456.789-00 -> 123.***.***-00
    let cpfMascarado = '—';
    if (resultado.cpf) {
      const cpfLimpo = resultado.cpf.replace(/[^\d]/g, '');
      if (cpfLimpo.length === 11) {
        cpfMascarado = `${cpfLimpo.slice(0, 3)}.***.***-${cpfLimpo.slice(9)}`;
      }
    }

    const perfilCompleto = {
      id:                         resultado.id,
      nome:                       resultado.nome,
      cra:                        resultado.cra,
      cpf:                        cpfMascarado,
      data_nascimento:            resultado.data_nascimento,
      telefone:                   resultado.telefone || '—',
      email:                      resultado.email || '—',
      ubs_bairro:                 resultado.ubs_bairro || '—', // Mapeia o bairro do paciente como o bairro da sua UBS de referência
      ubs_nome:                   resultado.ubs_nome,
      // Informações clínicas do paciente
      tipo_sanguineo:             resultado.tipo_sanguineo || '—',
      peso_kg:                    resultado.peso_kg || '—',
      altura_cm:                  resultado.altura_cm || '—',
      alergias:                   resultado.alergias || '—',
      comorbidades:               resultado.comorbidades || '—',
      medicamentos_uso_continuo:  resultado.medicamentos_uso_continuo || '—',
      observacoes_clinicas:       resultado.observacoes_clinicas || '—',
    };

    return res.json(perfilCompleto);
  } catch (err) {
    console.error('[GET /paciente/perfil]', err);
    return res.status(500).json({ error: 'Erro ao buscar perfil completo do paciente.' });
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


// ─── GET /api/paciente/todas-solicitacoes ────────────────────────────────────
// Retorna TODAS as solicitações do paciente, incluindo concluídas e canceladas.
// Usado na página de histórico para que o paciente veja o registro completo.
// Ativas (urgentes/prioritárias) aparecem primeiro; dentro do mesmo status,
// as mais recentes vêm antes.
router.get('/todas-solicitacoes', async (req, res) => {
  try {
    const solicitacoes = await knex('solicitacoes')
      .where({ paciente_id: req.user.id })
      .select([
        ...CAMPOS_SOLICITACAO_PACIENTE,
        knex.raw(`
          (SELECT status FROM encaminhamentos
           WHERE solicitacao_id = solicitacoes.id
           ORDER BY id DESC LIMIT 1) AS encaminhamento_status
        `)
      ])
      .orderByRaw(`
        CASE status
          WHEN 'concluido'  THEN 2
          WHEN 'cancelado'  THEN 3
          ELSE 1
        END ASC,
        CASE prioridade
          WHEN 'urgente'     THEN 1
          WHEN 'prioritario' THEN 2
          ELSE 3
        END ASC
      `)
      .orderBy('data_solicitacao', 'desc');

    return res.json(solicitacoes);
  } catch (err) {
    console.error('[GET /paciente/todas-solicitacoes]', err);
    return res.status(500).json({ error: 'Erro ao buscar histórico de solicitações.' });
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

    // Busca encaminhamento vinculado, se existir (criado pelo gestor via Regulação).
    // Retorna os campos necessários para o DetalheSolicitacao.jsx exibir a seção
    // "Encaminhamento Externo" com status, data agendada e conduta pós-procedimento.
    // feedback_conduta é retornado como "conduta" para simplificar o contrato de UI.
    const encaminhamento = await knex('encaminhamentos')
      .where({ solicitacao_id: req.params.id, paciente_id: req.user.id })
      .select(
        'id',
        'destino',
        'especialidade',
        'status',
        'data_procedimento_unidade',
        'confirmado_paciente',
        'feedback_tipo',
        knex.raw("feedback_conduta AS conduta"),
      )
      .first() || null;

    return res.json({ ...solicitacao, historico, encaminhamento });
  } catch (err) {
    console.error('[GET /paciente/solicitacao/:id]', err);
    return res.status(500).json({ error: 'Erro ao buscar detalhes da solicitação.' });
  }
});


// ─── GET /api/paciente/medicamentos ──────────────────────────────────────────
// Lista medicamentos da UBS do paciente com busca parcial por nome/princípio ativo.
// Query param opcional: ?busca=metform → retorna "Metformina 500mg" (ILIKE)
// Retorna: disponíveis primeiro, depois alfabético, incluindo instruções de retirada.
router.get('/medicamentos', async (req, res) => {
  try {
    const { busca } = req.query;

    const query = knex('medicamentos')
      .where({ ubs_id: req.user.ubs_id })
      .select('id', 'nome', 'principio_ativo', 'disponivel', 'observacao', 'instrucoes_retirada', 'atualizado_em')
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
      // Retorna comunicados gerais (sem segmentacao), individuais do paciente,
      // ou segmentados cujo termo matching (substring case-insensitive) exista nas comorbidades.
      .andWhere(function () {
        this
          // Comunicados gerais sem segmentação
          .where(function () {
            this.where('comunicados.tipo', 'geral')
                .whereNull('comunicados.segmentacao_clinica');
          })
          // Comunicados individuais endereçados a este paciente
          .orWhere(function () {
            this.where('comunicados.tipo', 'individual')
                .where('comunicados.paciente_id', req.user.id);
          })
          // Comunicados segmentados: entrega só se comorbidades do paciente bater (ILIKE)
          .orWhere(function () {
            this.whereNotNull('comunicados.segmentacao_clinica')
                .whereExists(
                  knex('pacientes')
                    .where('pacientes.id', req.user.id)
                    .whereRaw(
                      'pacientes.comorbidades ILIKE \'%\' || comunicados.segmentacao_clinica || \'%\''
                    )
                );
          });
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
        'comunicados.urgente',   // campo explícito — substituiu a heurística de palavras-chave
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
//          Se o paciente for inativo (ativo = false), ativa-o automaticamente,
//          grava auditoria de ativação e gera um novo JWT para atualização rápida
//          do estado de autenticação no frontend sem exigir novo login.
// Body: { motivo }
// ─────────────────────────────────────────────────────────────────────────────
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

    // FLUXO DE ATIVAÇÃO AUTOMÁTICA (PACIENTE NOVO)
    // Se o JWT atual do paciente indica que ele está inativo, realizamos a ativação.
    if (req.user.ativo === false || !req.user.ativo) {
      // 1. Atualiza o status do paciente no banco de dados para ativo (ativo = true)
      await knex('pacientes')
        .where({ id: req.user.id })
        .update({ ativo: true });

      // 2. Coleta os dados mais recentes do paciente no banco de dados
      const pacienteAtualizado = await knex('pacientes')
        .where({ id: req.user.id })
        .first();

      // 3. Registra a ação de ativação na tabela de auditoria operacional
      await registrarAuditoria(req, {
        ator_tipo: 'paciente',
        ator_id: req.user.id,
        ator_ubs_id: req.user.ubs_id,
        acao: 'ativacao_por_agendamento',
        entidade: 'pacientes',
        entidade_id: req.user.id,
        escopo_ubs_id: req.user.ubs_id,
        metadata: { agendamento_id: req.params.id, ubs_id: req.user.ubs_id },
      });

      // 4. Cria o novo payload seguro e assina o novo token JWT ativo
      const payload = {
        id: pacienteAtualizado.id,
        nome: pacienteAtualizado.nome,
        ubs_id: pacienteAtualizado.ubs_id,
        tipo: 'paciente',
        ativo: true,
        token_version: pacienteAtualizado.token_version || 0,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

      // Retorna o agendamento reservado + o novo JWT com payload atualizado para o frontend
      return res.json({
        ...atualizado,
        token,
        ...payload,
      });
    }

    return res.json(atualizado);
  } catch (err) {
    console.error('[POST /paciente/agendamento/:id/reservar]', err);
    return res.status(500).json({ error: 'Erro ao reservar agendamento.' });
  }
});


// ─── PUT /api/paciente/agendamento/:id/cancelar ───────────────────────────────
// Permite que o paciente cancele um agendamento com status 'reservado'.
// Verifica que o agendamento pertence ao paciente logado antes de qualquer ação.
// Ao cancelar: status → 'cancelado', paciente_id → NULL (libera o slot para reuso pelo gestor).
router.put('/agendamento/:id/cancelar', async (req, res) => {
  try {
    // Busca o agendamento garantindo que pertence ao paciente logado
    const agendamento = await knex('agendamentos_gestao')
      .where({ id: req.params.id, paciente_id: req.user.id })
      .first();

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }

    // Impede cancelamento de agendamentos já concluídos ou já cancelados
    if (agendamento.status !== 'reservado') {
      return res.status(409).json({ error: 'Apenas agendamentos reservados podem ser cancelados.' });
    }

    // Cancela: limpa o vínculo com o paciente e marca como cancelado
    await knex('agendamentos_gestao')
      .where({ id: req.params.id })
      .update({
        status:      'cancelado',
        paciente_id: null,
        motivo:      null,
      });

    return res.json({ ok: true, mensagem: 'Agendamento cancelado com sucesso.' });
  } catch (err) {
    console.error('[PUT /paciente/agendamento/:id/cancelar]', err);
    return res.status(500).json({ error: 'Erro ao cancelar agendamento.' });
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

    // LGPD E PRIVACIDADE: Se este endpoint (dispositivo físico) já estiver cadastrado 
    // para qualquer outro usuário (ex: logins anteriores no mesmo navegador), removemos 
    // a associação antiga para evitar que ele continue recebendo notificações cruzadas.
    await knex('push_subscriptions')
      .where({ endpoint })
      .andWhereNot({ usuario_id: req.user.id, tipo_usuario: 'paciente' })
      .delete();

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

// ─── GET /api/paciente/encaminhamentos ───────────────────────────────────────
// Lista encaminhamentos do paciente logado. Aceita query ?status= para filtrar
// por um status específico (ex: ?status=AGUARDANDO_CONFIRMACAO).
// Usado pelo DashboardPaciente.jsx para exibir o card de confirmação de presença.
router.get('/encaminhamentos', async (req, res) => {
  try {
    const { status } = req.query;

    const query = knex('encaminhamentos')
      .where({ paciente_id: req.user.id })
      .select(
        'encaminhamentos.id',
        'encaminhamentos.destino',
        'encaminhamentos.especialidade',
        'encaminhamentos.status',
        'encaminhamentos.prioridade',
        'encaminhamentos.data_solicitacao',
        'encaminhamentos.data_procedimento_unidade',
        'encaminhamentos.confirmado_paciente',
        'encaminhamentos.feedback_tipo',
        knex.raw("encaminhamentos.feedback_conduta AS conduta"),
        'encaminhamentos.solicitacao_id',
        'encaminhamentos.unidade_externa_id',
      )
      .orderBy('encaminhamentos.data_solicitacao', 'desc');

    // Filtra por status específico se o parâmetro for informado
    if (status) {
      query.where('encaminhamentos.status', status);
    }

    const encaminhamentos = await query;
    return res.json(encaminhamentos);
  } catch (err) {
    console.error('[GET /paciente/encaminhamentos]', err);
    return res.status(500).json({ error: 'Erro ao buscar encaminhamentos.' });
  }
});

// ─── PUT /api/paciente/encaminhamento/:id/confirmar ──────────────────────────
// Permite que o paciente confirme presença em procedimento agendado por unidade
// externa. A busca filtra por paciente_id = req.user.id para impedir que um
// paciente confirme encaminhamento de outra pessoa.
router.put('/encaminhamento/:id/confirmar', async (req, res) => {
  try {
    const encaminhamento = await knex('encaminhamentos')
      .where({ id: req.params.id, paciente_id: req.user.id })
      .first();

    if (!encaminhamento) {
      return res.status(404).json({ error: 'Encaminhamento nao encontrado.' });
    }

    if (encaminhamento.status !== 'AGUARDANDO_CONFIRMACAO') {
      return res.status(409).json({ error: 'Este encaminhamento nao esta aguardando confirmacao.' });
    }

    await knex.transaction(async (trx) => {
      await trx('encaminhamentos')
        .where({ id: encaminhamento.id })
        .update({
          status: 'CONFIRMADO_PACIENTE',
          confirmado_paciente: true,
          data_confirmacao_paciente: trx.fn.now(),
          atualizado_em: trx.fn.now(),
        });

      if (encaminhamento.solicitacao_id) {
        await trx('historico_status').insert({
          solicitacao_id: encaminhamento.solicitacao_id,
          gestor_id: null,
          status_anterior: 'data_marcada',
          status_novo: 'data_marcada',
          observacao: 'Paciente confirmou presenca',
        });
      }
    });

    await registrarAuditoria(req, {
      acao: 'paciente_confirmou_presenca',
      entidade: 'encaminhamentos',
      entidade_id: encaminhamento.id,
      escopo_ubs_id: encaminhamento.ubs_id,
      metadata: { unidade_externa_id: encaminhamento.unidade_externa_id },
    });

    return res.json({ ok: true, status: 'CONFIRMADO_PACIENTE' });
  } catch (err) {
    console.error('[PUT /paciente/encaminhamento/:id/confirmar]', err);
    return res.status(500).json({ error: 'Erro ao confirmar presença.' });
  }
});

// ─── GET /api/paciente/vapid-public-key ──────────────────────────────────────
// Expõe a chave pública VAPID para o frontend configurar o service worker.
// Esta chave é pública por natureza — não há risco em expô-la.
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;
;
