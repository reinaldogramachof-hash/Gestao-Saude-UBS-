/**
 * ROTAS DO PORTAL DO GESTOR (routes/gestor.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Todas as operações que a equipe gestora da UBS pode realizar:
 *         ver/buscar pacientes, atualizar status de solicitações, gerenciar
 *         disponibilidade de medicamentos, comunicados e agendamentos.
 *
 * SEGURANÇA: Todas as rotas aqui exigem:
 *   1. Token JWT válido (verificado pelo middleware auth.js no server.js)
 *   2. Que o token seja do tipo 'gestor' (verificado pelo middleware soGestor abaixo)
 *   O gestor só vê dados da sua própria UBS (req.user.ubs_id).
 *
 * ROTAS:
 *   GET    /api/gestor/dashboard/stats           → métricas da UBS (Épico 1)
 *   GET    /api/gestor/pacientes                 → lista paginada de pacientes
 *   GET    /api/gestor/paciente/:id              → perfil completo + solicitações
 *   POST   /api/gestor/paciente                  → cadastra novo paciente
 *   PUT    /api/gestor/paciente/:id              → edita dados do paciente
 *   POST   /api/gestor/paciente/:id/solicitacao  → cria solicitação para paciente
 *   PUT    /api/gestor/solicitacao/:id/status    → atualiza status + grava histórico
 *   GET    /api/gestor/medicamentos              → lista medicamentos da UBS
 *   PUT    /api/gestor/medicamento/:id           → atualiza disponibilidade/observação
 *   POST   /api/gestor/medicamento               → adiciona novo medicamento
 *   GET    /api/gestor/comunicados               → lista comunicados (Épico 3)
 *   POST   /api/gestor/comunicado                → cria comunicado (Épico 3)
 *   DELETE /api/gestor/comunicado/:id            → exclui comunicado (Épico 3)
 *   GET    /api/gestor/agendamentos              → lista agendamentos (Épico 4)
 *   POST   /api/gestor/agendamento               → cria slot disponível (Épico 4)
 *   PUT    /api/gestor/agendamento/:id           → atualiza status (Épico 4)
 *   DELETE /api/gestor/agendamento/:id           → remove slot disponível (Épico 4)
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express      = require('express');
const knex         = require('../db/knex');
const pushService  = require('../services/pushService');

const router = express.Router();

// ─── Middleware local: garante que só gestores acessam estas rotas ────────────
// req.user é populado pelo middleware auth.js (em src/middleware/auth.js)
const soGestor = (req, res, next) => {
  if (req.user?.tipo !== 'gestor') {
    return res.status(403).json({ error: 'Acesso exclusivo para gestores da UBS.' });
  }
  next();
};

// Aplica o middleware em todas as rotas deste arquivo
router.use(soGestor);


// ─── GET /api/gestor/pacientes ────────────────────────────────────────────────
// Retorna lista paginada dos pacientes vinculados à UBS do gestor logado.
// Query params opcionais: ?busca=texto&pagina=1&limite=20
router.get('/pacientes', async (req, res) => {
  try {
    const { busca, pagina = 1, limite = 20 } = req.query;
    const offset = (Number(pagina) - 1) * Number(limite);

    let query = knex('pacientes')
      .where('pacientes.ubs_id', req.user.ubs_id)
      .select('id', 'nome', 'cra', 'cpf', 'telefone', 'data_nascimento')
      .orderBy('nome')
      .limit(Number(limite))
      .offset(offset);

    // Filtra por nome ou CRA se a busca foi enviada
    if (busca) {
      query = query.where(function () {
        this.whereILike('nome', `%${busca}%`).orWhereILike('cra', `%${busca}%`);
      });
    }

    const pacientes = await query;
    return res.json(pacientes);
  } catch (err) {
    console.error('[GET /gestor/pacientes]', err);
    return res.status(500).json({ error: 'Erro ao buscar pacientes.' });
  }
});


// ─── GET /api/gestor/paciente/:id ─────────────────────────────────────────────
// Retorna perfil completo de um paciente + todas as suas solicitações ativas.
// Verifica se o paciente pertence à UBS do gestor (segurança de dados).
router.get('/paciente/:id', async (req, res) => {
  try {
    const paciente = await knex('pacientes')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .first();

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado nesta UBS.' });
    }

    // Remove o CPF da resposta por segurança (LGPD — exibição mínima necessária)
    delete paciente.cpf;

    // Reforça o isolamento por UBS também na coleção relacionada. A checagem
    // anterior já valida o paciente, mas o segundo filtro evita vazamento caso
    // exista algum registro inconsistente no banco.
    const solicitacoes = await knex('solicitacoes')
      .where({ paciente_id: req.params.id, ubs_id: req.user.ubs_id })
      .orderBy('criado_em', 'desc');

    return res.json({ ...paciente, solicitacoes });
  } catch (err) {
    console.error('[GET /gestor/paciente/:id]', err);
    return res.status(500).json({ error: 'Erro ao buscar paciente.' });
  }
});


// ─── PUT /api/gestor/solicitacao/:id/status ───────────────────────────────────
// Atualiza o status de uma solicitação E registra a mudança no histórico.
// O histórico é imutável — cada mudança cria um novo registro (nunca edita).
// Body: { status_novo: string, observacao: string }
router.put('/solicitacao/:id/status', async (req, res) => {
  try {
    const { status_novo, observacao } = req.body;

    if (!status_novo) {
      return res.status(400).json({ error: 'O campo status_novo é obrigatório.' });
    }

    // A leitura, a validação de pertencimento, o update e o histórico ficam na
    // mesma transação. Assim, nenhuma alteração parcial é persistida e a UBS
    // não pode mudar entre a verificação e a escrita.
    const resultado = await knex.transaction(async (trx) => {
      const solicitacao = await trx('solicitacoes')
        .join('pacientes', 'solicitacoes.paciente_id', 'pacientes.id')
        .where('solicitacoes.id', req.params.id)
        .select(
          'solicitacoes.*',
          'pacientes.ubs_id as paciente_ubs_id'
        )
        .first();

      if (!solicitacao) {
        return { tipo: 'nao_encontrada' };
      }

      // O vínculo é validado pelo paciente, que é a fonte de verdade para a
      // unidade responsável pelo atendimento e pelos dados pessoais.
      if (Number(solicitacao.paciente_ubs_id) !== Number(req.user.ubs_id)) {
        return { tipo: 'outra_ubs' };
      }

      await trx('solicitacoes')
        .where('solicitacoes.id', req.params.id)
        .where('solicitacoes.ubs_id', req.user.ubs_id)
        .update({ status: status_novo, atualizado_em: trx.fn.now() });

      await trx('historico_status').insert({
        solicitacao_id: req.params.id,
        gestor_id:      req.user.id,
        status_anterior: solicitacao.status,
        status_novo,
        observacao:     observacao || null,
      });

      const atualizada = await trx('solicitacoes')
        .where({ id: req.params.id, ubs_id: req.user.ubs_id })
        .first();

      return { tipo: 'atualizada', solicitacao: atualizada };
    });

    if (resultado.tipo === 'nao_encontrada') {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }

    if (resultado.tipo === 'outra_ubs') {
      return res.status(403).json({
        error: 'Solicitação pertence a outra UBS e não pode ser alterada.',
      });
    }

    // Dispara push notification para o paciente informando a mudança de status.
    // Feito fora da transação: falha no push não deve reverter a atualização.
    const STATUS_LABELS_PUSH = {
      em_analise:           'Em análise pela equipe',
      aguardando_regulacao: 'Aguardando aprovação da regulação',
      autorizado:           'Autorizado — aguardando agendamento',
      data_marcada:         'Data agendada',
      aguardando_resultado: 'Aguardando resultado',
      concluido:            'Concluído',
      cancelado:            'Cancelado',
    };

    pushService.enviar(
      resultado.solicitacao.paciente_id,
      'paciente',
      {
        titulo: 'Atualização no seu pedido',
        corpo:  STATUS_LABELS_PUSH[resultado.solicitacao.status] || 'Seu pedido foi atualizado.',
        url:    `/paciente/solicitacao/${resultado.solicitacao.id}`,
      }
    ).catch(() => {}); // Erro de push não afeta a resposta da API

    return res.json(resultado.solicitacao);
  } catch (err) {
    console.error('[PUT /gestor/solicitacao/:id/status]', err);
    // Erro de constraint: status inválido tentado ser gravado
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Status inválido. Verifique os valores permitidos.' });
    }
    return res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
});


// ─── GET /api/gestor/medicamentos ─────────────────────────────────────────────
// Lista todos os medicamentos da UBS do gestor, ordenados alfabeticamente.
router.get('/medicamentos', async (req, res) => {
  try {
    const medicamentos = await knex('medicamentos')
      .where({ ubs_id: req.user.ubs_id })
      .orderBy('nome');
    return res.json(medicamentos);
  } catch (err) {
    console.error('[GET /gestor/medicamentos]', err);
    return res.status(500).json({ error: 'Erro ao buscar medicamentos.' });
  }
});


// ─── PUT /api/gestor/medicamento/:id ─────────────────────────────────────────
// Atualiza a disponibilidade e/ou observação de um medicamento.
// O toggle de disponibilidade na tela do gestor chama esta rota.
// Body: { disponivel: boolean, observacao: string }
router.put('/medicamento/:id', async (req, res) => {
  try {
    const { disponivel, observacao } = req.body;

    // Garante que o gestor só edita medicamentos da própria UBS
    const existente = await knex('medicamentos')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .first();

    if (!existente) {
      return res.status(404).json({ error: 'Medicamento não encontrado nesta UBS.' });
    }

    await knex('medicamentos')
      .where({ id: req.params.id })
      .update({
        disponivel,
        observacao:    observacao ?? existente.observacao,
        atualizado_em: knex.fn.now(),
        atualizado_por: req.user.id,
      });

    const atualizado = await knex('medicamentos').where({ id: req.params.id }).first();
    return res.json(atualizado);
  } catch (err) {
    console.error('[PUT /gestor/medicamento/:id]', err);
    return res.status(500).json({ error: 'Erro ao atualizar medicamento.' });
  }
});


// ─── POST /api/gestor/medicamento ─────────────────────────────────────────────
// Adiciona um novo medicamento ao catálogo da UBS.
// Body: { nome: string, principio_ativo: string, disponivel: boolean, observacao: string }
router.post('/medicamento', async (req, res) => {
  try {
    const { nome, principio_ativo, disponivel = false, observacao } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'O nome do medicamento é obrigatório.' });
    }

    const [inserido] = await knex('medicamentos')
      .insert({
        ubs_id:         req.user.ubs_id,
        nome,
        principio_ativo: principio_ativo || null,
        disponivel,
        observacao:      observacao || null,
        atualizado_por:  req.user.id,
      })
      .returning('*');

    return res.status(201).json(inserido);
  } catch (err) {
    console.error('[POST /gestor/medicamento]', err);
    return res.status(500).json({ error: 'Erro ao adicionar medicamento.' });
  }
});

// ─── POST /api/gestor/paciente ────────────────────────────────────────────────
// Cadastra um novo paciente na UBS do gestor logado.
// Body: { nome, cra, data_nascimento, cpf, telefone, email }
router.post('/paciente', async (req, res) => {
  try {
    const { nome, cra, data_nascimento, cpf, telefone, email } = req.body;

    // Validação de campos obrigatórios
    if (!nome || !cra || !data_nascimento) {
      return res.status(400).json({ error: 'Nome, CRA e Data de Nascimento são obrigatórios.' });
    }

    const [paciente] = await knex('pacientes')
      .insert({
        ubs_id: req.user.ubs_id,
        nome,
        cra,
        data_nascimento,
        cpf: cpf || null,
        telefone: telefone || null,
        email: email || null,
        ativo: true
      })
      .returning('*');

    return res.status(201).json(paciente);
  } catch (err) {
    console.error('[POST /gestor/paciente]', err);
    // Erro de constraint única no PostgreSQL (Ex: CRA já cadastrado)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'CRA já cadastrado neste sistema.' });
    }
    return res.status(500).json({ error: 'Erro ao cadastrar paciente.' });
  }
});


// ─── PUT /api/gestor/paciente/:id ─────────────────────────────────────────────
// Edita dados básicos de um paciente. Só permite se o paciente for da UBS do gestor.
// Body (opcionais): { nome, telefone, email, ativo }
router.put('/paciente/:id', async (req, res) => {
  try {
    const { nome, telefone, email, ativo } = req.body;

    // Verifica se o paciente existe e pertence à UBS do gestor
    const existente = await knex('pacientes')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .first();

    if (!existente) {
      return res.status(404).json({ error: 'Paciente não encontrado nesta UBS.' });
    }

    const [atualizado] = await knex('pacientes')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .update({
        nome: nome ?? existente.nome,
        telefone: telefone ?? existente.telefone,
        email: email ?? existente.email,
        ativo: ativo ?? existente.ativo,
        atualizado_em: knex.fn.now()
      })
      .returning('*');

    return res.json(atualizado);
  } catch (err) {
    console.error('[PUT /gestor/paciente/:id]', err);
    return res.status(500).json({ error: 'Erro ao atualizar dados do paciente.' });
  }
});


// ─── POST /api/gestor/paciente/:id/solicitacao ────────────────────────────────
// Cria uma nova solicitação para um paciente específico.
// Body: { tipo, descricao_interna, descricao_paciente, data_prevista }
router.post('/paciente/:id/solicitacao', async (req, res) => {
  try {
    const { tipo, descricao_interna, descricao_paciente, data_prevista, data_solicitacao, prioridade, local_executor } = req.body;

    if (!tipo || !descricao_interna || !descricao_paciente) {
      return res.status(400).json({ error: 'Tipo, descrição interna e descrição para o paciente são obrigatórios.' });
    }

    // Verifica se o paciente pertence à UBS do gestor
    const paciente = await knex('pacientes')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .first();

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado nesta UBS.' });
    }

    // A solicitação e seu primeiro evento são uma única operação de negócio.
    // Se o histórico falhar, a transação desfaz também a solicitação.
    const solicitacao = await knex.transaction(async (trx) => {
      const [novaSolicitacao] = await trx('solicitacoes')
        .insert({
          paciente_id:      req.params.id,
          ubs_id:           req.user.ubs_id,
          tipo,
          descricao:        descricao_interna,
          descricao_paciente,
          prioridade:       prioridade || 'rotina',
          status:           'em_analise',
          // data_solicitacao é DATE NOT NULL — enviada pelo frontend ou gerada aqui
          data_solicitacao: data_solicitacao || new Date().toISOString().split('T')[0],
          data_prevista:    data_prevista || null,
          // Local onde o serviço será executado (NULL = própria UBS)
          local_executor:   local_executor || null,
        })
        .returning('*');

      await trx('historico_status').insert({
        solicitacao_id: novaSolicitacao.id,
        gestor_id: req.user.id,
        status_anterior: null,
        status_novo: novaSolicitacao.status,
        observacao: 'Solicitação registrada no sistema',
        alterado_em: trx.fn.now(),
      });

      return novaSolicitacao;
    });

    return res.status(201).json(solicitacao);
  } catch (err) {
    console.error('[POST /gestor/paciente/:id/solicitacao]', err);
    return res.status(500).json({ error: 'Erro ao criar solicitação.' });
  }
});


// ─── GET /api/gestor/dashboard/stats ──────────────────────────────────────────
// Épico 1: Retorna métricas reais da UBS para exibição no Painel Principal.
// Usa Promise.all para buscar todas as contagens em paralelo (mais eficiente).
router.get('/dashboard/stats', async (req, res) => {
  try {
    const ubsId = req.user.ubs_id;

    // Busca todas as métricas ao mesmo tempo (paralelismo de queries)
    const [
      totalPacientes,
      emAnalise,
      autorizados,
      dataMarcada,
      medsIndisponiveis,
      atividadeRecente,
    ] = await Promise.all([
      // COUNT de pacientes ativos da UBS
      knex('pacientes').where({ ubs_id: ubsId, ativo: true }).count('id as total').first(),
      // COUNT de solicitações em análise
      knex('solicitacoes').where({ ubs_id: ubsId, status: 'em_analise' }).count('id as total').first(),
      // COUNT de solicitações autorizadas
      knex('solicitacoes').where({ ubs_id: ubsId, status: 'autorizado' }).count('id as total').first(),
      // COUNT de solicitações com data marcada
      knex('solicitacoes').where({ ubs_id: ubsId, status: 'data_marcada' }).count('id as total').first(),
      // COUNT de medicamentos indisponíveis
      knex('medicamentos').where({ ubs_id: ubsId, disponivel: false }).count('id as total').first(),
      // 6 solicitações mais recentes com nome do paciente (JOIN)
      knex('solicitacoes')
        .join('pacientes', 'solicitacoes.paciente_id', 'pacientes.id')
        .where('solicitacoes.ubs_id', ubsId)
        .select(
          'solicitacoes.id',
          'solicitacoes.descricao_paciente',
          'solicitacoes.status',
          'solicitacoes.atualizado_em',
          'pacientes.nome as paciente_nome'
        )
        .orderBy('solicitacoes.atualizado_em', 'desc')
        .limit(6),
    ]);

    return res.json({
      total_pacientes:           Number(totalPacientes.total),
      em_analise:                Number(emAnalise.total),
      autorizados:               Number(autorizados.total),
      data_marcada:              Number(dataMarcada.total),
      medicamentos_indisponiveis: Number(medsIndisponiveis.total),
      atividade_recente:         atividadeRecente,
    });
  } catch (err) {
    console.error('[GET /gestor/dashboard/stats]', err);
    return res.status(500).json({ error: 'Erro ao buscar métricas do painel.' });
  }
});


// ─── GET /api/gestor/alertas ──────────────────────────────────────────────────
// Épico 2: Triagem de Urgência. Retorna alertas para o gestor.
router.get('/alertas', async (req, res) => {
  try {
    const alertas = await knex('solicitacoes')
      .join('pacientes', 'solicitacoes.paciente_id', 'pacientes.id')
      .where('solicitacoes.ubs_id', req.user.ubs_id)
      .whereNotIn('solicitacoes.status', ['concluido', 'cancelado'])
      .andWhere(function() {
        // Regra A — Solicitações urgentes paradas há mais de 48 horas
        this.where(function() {
          this.where('solicitacoes.prioridade', 'urgente')
              .andWhereRaw("solicitacoes.atualizado_em < NOW() - INTERVAL '48 hours'");
        })
        // Regra B — Solicitações prioritárias paradas há mais de 7 dias
        .orWhere(function() {
          this.where('solicitacoes.prioridade', 'prioritario')
              .andWhereRaw("solicitacoes.atualizado_em < NOW() - INTERVAL '7 days'");
        })
        // Regra C — Solicitações em análise há mais de 10 dias
        .orWhere(function() {
          this.where('solicitacoes.status', 'em_analise')
              .andWhereRaw("solicitacoes.atualizado_em < NOW() - INTERVAL '10 days'");
        });
      })
      .select(
        'solicitacoes.id',
        'solicitacoes.tipo',
        'solicitacoes.descricao',
        'solicitacoes.status',
        'solicitacoes.prioridade',
        'solicitacoes.atualizado_em',
        'pacientes.id as paciente_id',
        'pacientes.nome as paciente_nome',
        knex.raw('EXTRACT(DAY FROM NOW() - solicitacoes.atualizado_em) AS dias_parado'),
        knex.raw(`
          CASE 
            WHEN solicitacoes.prioridade = 'urgente' THEN 'A'
            WHEN solicitacoes.prioridade = 'prioritario' THEN 'B'
            ELSE 'C'
          END AS regra_acionada
        `)
      )
      .orderBy('dias_parado', 'desc');

    return res.json({ total: alertas.length, alertas });
  } catch (err) {
    console.error('[GET /gestor/alertas]', err);
    return res.status(500).json({ error: 'Erro ao buscar alertas.' });
  }
});


// ─── GET /api/gestor/comunicados ──────────────────────────────────────────────
// Épico 3: Lista todos os comunicados da UBS, do mais recente ao mais antigo.
// Faz LEFT JOIN com pacientes para trazer o nome quando for comunicado individual.
router.get('/comunicados', async (req, res) => {
  try {
    const comunicados = await knex('comunicados')
      .leftJoin('pacientes', 'comunicados.paciente_id', 'pacientes.id')
      .where('comunicados.ubs_id', req.user.ubs_id)
      .select(
        'comunicados.id',
        'comunicados.titulo',
        'comunicados.mensagem',
        'comunicados.tipo',
        'comunicados.criado_em',
        'comunicados.paciente_id',
        'pacientes.nome as paciente_nome'
      )
      .orderBy('comunicados.criado_em', 'desc');

    return res.json(comunicados);
  } catch (err) {
    console.error('[GET /gestor/comunicados]', err);
    return res.status(500).json({ error: 'Erro ao buscar comunicados.' });
  }
});


// ─── POST /api/gestor/comunicado ──────────────────────────────────────────────
// Épico 3: Cria um novo comunicado (geral para todos ou individual para um paciente).
// Body: { titulo, mensagem, tipo, paciente_id }
router.post('/comunicado', async (req, res) => {
  try {
    const { titulo, mensagem, tipo = 'geral', paciente_id } = req.body;

    // Campos obrigatórios
    if (!titulo || !mensagem) {
      return res.status(400).json({ error: 'Título e mensagem são obrigatórios.' });
    }

    // Se for individual, verifica se o paciente pertence à UBS do gestor
    if (tipo === 'individual' && paciente_id) {
      const paciente = await knex('pacientes')
        .where({ id: paciente_id, ubs_id: req.user.ubs_id })
        .first();
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente não encontrado nesta UBS.' });
      }
    }

    const [comunicado] = await knex('comunicados')
      .insert({
        ubs_id:     req.user.ubs_id,
        gestor_id:  req.user.id,
        paciente_id: tipo === 'individual' ? (paciente_id || null) : null,
        titulo,
        mensagem,
        tipo,
      })
      .returning('*');

    // Push para comunicado individual: notifica apenas o destinatário
    if (tipo === 'individual' && paciente_id) {
      pushService.enviar(paciente_id, 'paciente', {
        titulo: 'Nova mensagem da sua UBS',
        corpo:  titulo,
        url:    '/paciente/comunicados',
      }).catch(() => {});
    }

    return res.status(201).json(comunicado);
  } catch (err) {
    console.error('[POST /gestor/comunicado]', err);
    return res.status(500).json({ error: 'Erro ao criar comunicado.' });
  }
});


// ─── DELETE /api/gestor/comunicado/:id ────────────────────────────────────────
// Épico 3: Exclui um comunicado. Só permite se pertencer à UBS do gestor.
router.delete('/comunicado/:id', async (req, res) => {
  try {
    const comunicado = await knex('comunicados')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .first();

    if (!comunicado) {
      return res.status(404).json({ error: 'Comunicado não encontrado.' });
    }

    await knex('comunicados').where({ id: req.params.id }).del();
    return res.status(204).send();
  } catch (err) {
    console.error('[DELETE /gestor/comunicado/:id]', err);
    return res.status(500).json({ error: 'Erro ao excluir comunicado.' });
  }
});


// ─── GET /api/gestor/agendamentos ─────────────────────────────────────────────
// Épico 4: Lista todos os slots de agendamento da UBS, ordenados por data_hora.
// Query param opcional: ?status=disponivel (filtra por status)
router.get('/agendamentos', async (req, res) => {
  try {
    const { status } = req.query;

    let query = knex('agendamentos_gestao')
      .leftJoin('pacientes', 'agendamentos_gestao.paciente_id', 'pacientes.id')
      .where('agendamentos_gestao.ubs_id', req.user.ubs_id)
      .select(
        'agendamentos_gestao.id',
        'agendamentos_gestao.data_hora',
        'agendamentos_gestao.duracao_minutos',
        'agendamentos_gestao.status',
        'agendamentos_gestao.motivo',
        'agendamentos_gestao.paciente_id',
        'pacientes.nome as paciente_nome'
      )
      .orderBy('agendamentos_gestao.data_hora', 'asc');

    // Filtro opcional por status (ex: ?status=disponivel)
    if (status) {
      query = query.where('agendamentos_gestao.status', status);
    }

    const agendamentos = await query;
    return res.json(agendamentos);
  } catch (err) {
    console.error('[GET /gestor/agendamentos]', err);
    return res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
  }
});


// ─── POST /api/gestor/agendamento ─────────────────────────────────────────────
// Épico 4: Cria um slot de horário disponível para agendamento de pacientes.
// Body: { data_hora, duracao_minutos, gestor_responsavel_id }
router.post('/agendamento', async (req, res) => {
  try {
    const { data_hora, duracao_minutos = 30, gestor_responsavel_id } = req.body;

    if (!data_hora) {
      return res.status(400).json({ error: 'A data e hora são obrigatórias.' });
    }

    const [agendamento] = await knex('agendamentos_gestao')
      .insert({
        ubs_id:                 req.user.ubs_id,
        gestor_responsavel_id:  gestor_responsavel_id || req.user.id,
        data_hora,
        duracao_minutos,
        status:      'disponivel', // Sempre começa como disponível
        paciente_id: null,          // Nenhum paciente vinculado inicialmente
      })
      .returning('*');

    return res.status(201).json(agendamento);
  } catch (err) {
    console.error('[POST /gestor/agendamento]', err);
    return res.status(500).json({ error: 'Erro ao criar agendamento.' });
  }
});


// ─── PUT /api/gestor/agendamento/:id ──────────────────────────────────────────
// Épico 4: Atualiza o status de um slot de agendamento.
// Body: { status, motivo }
router.put('/agendamento/:id', async (req, res) => {
  try {
    const { status, motivo } = req.body;

    // Verifica se o agendamento pertence à UBS do gestor
    const agendamento = await knex('agendamentos_gestao')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .first();

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }

    const [atualizado] = await knex('agendamentos_gestao')
      .where({ id: req.params.id })
      .update({ status, motivo: motivo || agendamento.motivo })
      .returning('*');

    return res.json(atualizado);
  } catch (err) {
    console.error('[PUT /gestor/agendamento/:id]', err);
    return res.status(500).json({ error: 'Erro ao atualizar agendamento.' });
  }
});


// ─── DELETE /api/gestor/agendamento/:id ───────────────────────────────────────
// Épico 4: Remove um slot de agendamento. Só permite se status = 'disponivel'.
// Impede exclusão de consultas já reservadas ou concluídas.
router.delete('/agendamento/:id', async (req, res) => {
  try {
    const agendamento = await knex('agendamentos_gestao')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .first();

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }

    // Segurança: não permite excluir slots já comprometidos com pacientes
    if (agendamento.status !== 'disponivel') {
      return res.status(400).json({
        error: `Não é possível excluir um agendamento com status "${agendamento.status}". Cancele-o primeiro.`
      });
    }

    await knex('agendamentos_gestao').where({ id: req.params.id }).del();
    return res.status(204).send();
  } catch (err) {
    console.error('[DELETE /gestor/agendamento/:id]', err);
    return res.status(500).json({ error: 'Erro ao excluir agendamento.' });
  }
});


module.exports = router;
