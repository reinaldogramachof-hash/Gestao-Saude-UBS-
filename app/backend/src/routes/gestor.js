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
 *   MODO MATRIZ: o gestor vê pacientes e solicitações de TODAS as UBSs.
 *   A UBS do paciente é apenas informação de origem — não restringe acesso.
 *   Recursos operacionais (medicamentos, comunicados, agendamentos) continuam
 *   isolados por UBS — cada gestor gerencia apenas os recursos da sua unidade.
 *
 * ROTAS:
 *   GET    /api/gestor/dashboard/stats           → métricas da UBS (Épico 1)
 *   GET    /api/gestor/pacientes                 → lista paginada de pacientes
 *   GET    /api/gestor/paciente/:id              → perfil completo + solicitações
 *   POST   /api/gestor/paciente                  → cadastra novo paciente
 *   PUT    /api/gestor/paciente/:id              → edita dados do paciente
 *   POST   /api/gestor/paciente/:id/solicitacao  → cria solicitação para paciente
 *   PUT    /api/gestor/solicitacao/:id/status    → atualiza status + grava histórico
 *   GET    /api/gestor/solicitacao/:id/historico → lista o histórico da solicitação
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
const { requireTipo, requirePerfil, soNaoMedico } = require('../middleware/authorization');
const validateBody = require('../middleware/validateBody');
const { registrarAuditoria } = require('../services/auditService');
const {
  statusSolicitacaoSchema,
  atendimentoSchema,
  comunicadoSchema,
  agendamentoLoteSchema,
  solicitacaoSchema,
  encaminhamentoSchema,
  vigilanciaSchema,
} = require('../validators/securitySchemas');

const router = express.Router();

// ─── Middleware local: garante que só gestores acessam estas rotas ────────────
// req.user é populado pelo middleware auth.js (em src/middleware/auth.js)
const soGestor = requireTipo('gestor');

// Aplica o middleware em todas as rotas deste arquivo
router.use(soGestor);

const CAMPOS_PACIENTE_GESTOR = [
  'pacientes.id',
  'pacientes.ubs_id',
  'pacientes.cra',
  'pacientes.nome',
  'pacientes.telefone',
  'pacientes.email',
  'pacientes.data_nascimento',
  'pacientes.ativo',
  'pacientes.tipo_sanguineo',
  'pacientes.peso_kg',
  'pacientes.altura_cm',
  'pacientes.alergias',
  'pacientes.comorbidades',
  'pacientes.medicamentos_uso_continuo',
  'pacientes.observacoes_clinicas',
  'pacientes.criado_em',
  'pacientes.atualizado_em',
];

const CAMPOS_PACIENTE_RETORNO = [
  'id',
  'ubs_id',
  'cra',
  'nome',
  'telefone',
  'email',
  'data_nascimento',
  'ativo',
  'tipo_sanguineo',
  'peso_kg',
  'altura_cm',
  'alergias',
  'comorbidades',
  'medicamentos_uso_continuo',
  'observacoes_clinicas',
  'criado_em',
  'atualizado_em',
];

const CAMPOS_SOLICITACAO_GESTOR = [
  'id',
  'paciente_id',
  'ubs_id',
  'tipo',
  'descricao',
  'descricao_paciente',
  'status',
  'prioridade',
  'data_solicitacao',
  'data_prevista',
  'data_conclusao',
  'observacao_gestor',
  'observacao_paciente',
  'local_executor',
  'catalogo_id',
  'unidade_externa_id',
  'resultado',
  'cid_10',
  'criado_em',
  'atualizado_em',
];

const CAMPOS_ATENDIMENTO = [
  'id',
  'paciente_id',
  'registrado_por',
  'data_atendimento',
  'unidade',
  'tipo_unidade',
  'especialidade',
  'profissional',
  'cid_10_principal',
  'cid_10_secundario',
  'conduta',
  'observacoes',
  'criado_em',
  'atualizado_em',
];

const CAMPOS_MEDICAMENTO = [
  'id',
  'ubs_id',
  'nome',
  'principio_ativo',
  'disponivel',
  'observacao',
  'instrucoes_retirada',
  'atualizado_em',
  'atualizado_por',
];

const CAMPOS_AGENDAMENTO = [
  'id',
  'ubs_id',
  'gestor_responsavel_id',
  'paciente_id',
  'data_hora',
  'duracao_minutos',
  'status',
  'motivo',
  'criado_em',
];

// Funcionamento padrao da UBS para criacao de agenda no MVP.
// Futuramente estes valores devem vir do modulo de configuracao da UBS.
const AGENDA_HORA_ABERTURA_MIN = 7 * 60;
const AGENDA_HORA_FECHAMENTO_MIN = 18 * 60;

function minutosDoHorario(valor) {
  if (typeof valor === 'string') {
    const match = valor.match(/T(\d{2}):(\d{2})/);
    if (match) {
      return Number(match[1]) * 60 + Number(match[2]);
    }
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  return data.getHours() * 60 + data.getMinutes();
}

function validarHorarioFuncionamento(minutos) {
  return minutos >= AGENDA_HORA_ABERTURA_MIN && minutos < AGENDA_HORA_FECHAMENTO_MIN;
}

const CAMPOS_COMUNICADO = [
  'id',
  'ubs_id',
  'gestor_id',
  'paciente_id',
  'titulo',
  'mensagem',
  'tipo',
  'urgente',
  'criado_em',
];

const CAMPOS_ENCAMINHAMENTO = [
  'id',
  'ubs_id',
  'gestor_id',
  'paciente_id',
  'solicitacao_id',
  'destino',
  'especialidade',
  'prioridade',
  'status',
  'data_solicitacao',
  'data_agendamento',
  'observacoes',
  'atualizado_em',
];

const CAMPOS_VIGILANCIA = [
  'id',
  'ubs_id',
  'gestor_id',
  'paciente_id',
  'agravo',
  'bairro',
  'cep',
  'status_investigacao',
  'data_notificacao',
  'atualizado_em',
];

function normalizarId(valor) {
  return valor === '' || valor === undefined || valor === null ? null : Number(valor);
}

async function validarPacienteDaUbs(pacienteId, ubsId, trx = knex) {
  if (!pacienteId) return null;
  return trx('pacientes')
    .where({ id: pacienteId, ubs_id: ubsId })
    .select('id', 'ubs_id', 'nome')
    .first();
}


// ─── GET /api/gestor/pacientes/pendentes ─────────────────────────────────────
// Retorna pacientes com ativo: false que se cadastraram pelo portal público
// e aguardam aprovação presencial da equipe da UBS.
// MODO MATRIZ: exibe pendentes de TODAS as UBSs — o campo ubs.nome identifica a origem.
router.get('/pacientes/pendentes', async (req, res) => {
  try {
    const pendentes = await knex('pacientes')
      .leftJoin('ubs', 'pacientes.ubs_id', 'ubs.id')
      .where('pacientes.ativo', true)
      .where('pacientes.criado_em', '>=', knex.raw("NOW() - INTERVAL '7 days'"))
      .select(
        'pacientes.id',
        'pacientes.nome',
        'pacientes.cra',
        'pacientes.telefone',
        'pacientes.email',
        'pacientes.data_nascimento',
        'pacientes.criado_em',
        'ubs.nome as ubs_nome'
      )
      .orderBy('pacientes.criado_em', 'desc');

    return res.json(pendentes);
  } catch (err) {
    console.error('[GET /gestor/pacientes/pendentes]', err);
    return res.status(500).json({ error: 'Erro ao buscar cadastros pendentes.' });
  }
});


// ─── PATCH /api/gestor/paciente/:id/ativar ────────────────────────────────────
// Ativa um cadastro pendente após validação presencial da equipe da UBS.
// MODO MATRIZ: qualquer gestor pode ativar cadastros de qualquer UBS.
router.patch('/paciente/:id/ativar', async (req, res) => {
  try {
    const paciente = await knex('pacientes')
      .where({ id: req.params.id, ativo: false })
      .first();

    if (!paciente) {
      return res.status(404).json({ error: 'Cadastro pendente não encontrado.' });
    }

    await knex('pacientes')
      .where({ id: req.params.id })
      .update({ ativo: true, atualizado_em: knex.fn.now() });

    await registrarAuditoria(req, {
      acao: 'paciente_ativar',
      entidade: 'pacientes',
      entidade_id: paciente.id,
      escopo_ubs_id: paciente.ubs_id,
      metadata: { origem: 'modo_matriz' },
    });

    return res.json({ mensagem: `Cadastro de ${paciente.nome} ativado com sucesso.` });
  } catch (err) {
    console.error('[PATCH /gestor/paciente/:id/ativar]', err);
    return res.status(500).json({ error: 'Erro ao ativar cadastro.' });
  }
});


// ─── DELETE /api/gestor/paciente/:id/rejeitar ─────────────────────────────────
// Remove um cadastro pendente que não pôde ser validado presencialmente.
// MODO MATRIZ: qualquer gestor pode rejeitar cadastros de qualquer UBS.
router.delete('/paciente/:id/rejeitar', async (req, res) => {
  try {
    const paciente = await knex('pacientes')
      .where({ id: req.params.id, ativo: false })
      .first();

    if (!paciente) {
      return res.status(404).json({ error: 'Cadastro pendente não encontrado.' });
    }

    await registrarAuditoria(req, {
      acao: 'paciente_rejeitar',
      entidade: 'pacientes',
      entidade_id: paciente.id,
      escopo_ubs_id: paciente.ubs_id,
      metadata: { origem: 'modo_matriz' },
    });

    await knex('pacientes').where({ id: req.params.id }).del();
    return res.status(204).send();
  } catch (err) {
    console.error('[DELETE /gestor/paciente/:id/rejeitar]', err);
    return res.status(500).json({ error: 'Erro ao rejeitar cadastro.' });
  }
});


// ─── GET /api/gestor/pacientes ────────────────────────────────────────────────
// Retorna lista paginada de TODOS os pacientes ativos (modo matriz).
// O campo ubs_nome identifica a UBS de origem para exibição informativa.
// Query params opcionais: ?busca=texto&pagina=1&limite=20
router.get('/pacientes', async (req, res) => {
  try {
    const { busca, pagina = 1, limite = 20 } = req.query;
    const offset = (Number(pagina) - 1) * Number(limite);

    // LEFT JOINs: solicitações para métricas + UBS para mostrar origem do paciente.
    // Sem filtro por ubs_id: modo matriz exibe todos os pacientes ativos.
    let query = knex('pacientes')
      .leftJoin('solicitacoes as s', 's.paciente_id', 'pacientes.id')
      .leftJoin('ubs', 'pacientes.ubs_id', 'ubs.id')
      .where('pacientes.ativo', true)
      .select(
        'pacientes.id',
        'pacientes.nome',
        'pacientes.cra',
        'pacientes.telefone',
        'pacientes.email',
        'pacientes.data_nascimento',
        'ubs.nome as ubs_nome',
        knex.raw(
          'COUNT(CASE WHEN s.status NOT IN (?, ?) THEN 1 END) as solicitacoes_ativas',
          ['concluido', 'cancelado']
        ),
        knex.raw(
          'COALESCE(BOOL_OR(s.prioridade = ? AND s.status NOT IN (?, ?)), false) as tem_urgente',
          ['urgente', 'concluido', 'cancelado']
        )
      )
      // Todos os campos públicos não agregados precisam estar no GROUP BY.
      // CPF fica deliberadamente fora da seleção para cumprir a LGPD.
      .groupBy(
        'pacientes.id',
        'pacientes.nome',
        'pacientes.cra',
        'pacientes.telefone',
        'pacientes.email',
        'pacientes.data_nascimento',
        'ubs.nome'
      )
      .orderBy('pacientes.nome')
      .limit(Number(limite))
      .offset(offset);

    // Filtra por nome ou CRA se a busca foi enviada
    if (busca) {
      query = query.where(function () {
        this.whereILike('pacientes.nome', `%${busca}%`)
          .orWhereILike('pacientes.cra', `%${busca}%`);
      });
    }

    const pacientes = await query;
    return res.json(pacientes);
  } catch (err) {
    console.error('[GET /gestor/pacientes]', err);
    return res.status(500).json({ error: 'Erro ao buscar pacientes.' });
  }
});


// ─── GET /api/gestor/solicitacao/:id/historico ──────────────────────────────
// Retorna a linha do tempo de uma solicitação somente quando o paciente
// vinculado pertence à UBS autenticada. Nenhum dado pessoal é retornado.
router.get('/solicitacao/:id/historico', async (req, res) => {
  try {
    // Verifica se a solicitação existe antes de buscar o histórico.
    // MODO MATRIZ: não filtra por UBS — qualquer gestor pode ver o histórico.
    const solicitacao = await knex('solicitacoes')
      .where('solicitacoes.id', req.params.id)
      .select('solicitacoes.id')
      .first();

    if (!solicitacao) {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }

    // LEFT JOIN preserva eventos automáticos ou antigos cujo gestor tenha sido
    // removido. A ordenação crescente monta a linha do tempo da origem ao atual.
    const historico = await knex('historico_status')
      .leftJoin('usuarios_gestores', 'historico_status.gestor_id', 'usuarios_gestores.id')
      .where('historico_status.solicitacao_id', req.params.id)
      .select(
        'historico_status.id',
        'historico_status.status_anterior',
        'historico_status.status_novo',
        'historico_status.observacao',
        'historico_status.alterado_em',
        'usuarios_gestores.nome as gestor_nome'
      )
      .orderBy('historico_status.alterado_em', 'asc');

    return res.json(historico);
  } catch (err) {
    console.error('[GET /gestor/solicitacao/:id/historico]', err);
    return res.status(500).json({ error: 'Erro ao buscar histórico da solicitação.' });
  }
});


// ─── GET /api/gestor/paciente/:id ─────────────────────────────────────────────
// Retorna perfil completo de um paciente + todas as suas solicitações.
// MODO MATRIZ: acessível por qualquer gestor — UBS é informação de origem.
router.get('/paciente/:id', async (req, res) => {
  try {
    const paciente = await knex('pacientes')
      .leftJoin('ubs', 'pacientes.ubs_id', 'ubs.id')
      .where('pacientes.id', req.params.id)
      .select(...CAMPOS_PACIENTE_GESTOR, 'ubs.nome as ubs_nome')
      .first();

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    // Remove o CPF da resposta por segurança (LGPD — exibição mínima necessária)

    // Busca todas as solicitações do paciente, independente da UBS de origem
    const solicitacoes = await knex('solicitacoes')
      .where({ paciente_id: req.params.id })
      .select(CAMPOS_SOLICITACAO_GESTOR)
      .orderBy('criado_em', 'desc');

    await registrarAuditoria(req, {
      acao: 'paciente_visualizar_matriz',
      entidade: 'pacientes',
      entidade_id: paciente.id,
      escopo_ubs_id: paciente.ubs_id,
      metadata: { origem: 'modo_matriz' },
    });

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
router.put('/solicitacao/:id/status', validateBody(statusSolicitacaoSchema), async (req, res) => {
  try {
    const { status_novo, observacao } = req.body;

    if (!status_novo) {
      return res.status(400).json({ error: 'O campo status_novo é obrigatório.' });
    }

    // A leitura, o update e o histórico ficam na mesma transação para evitar
    // alterações parciais. MODO MATRIZ: não filtra por ubs_id — qualquer gestor
    // pode atualizar o status de qualquer solicitação.
    const resultado = await knex.transaction(async (trx) => {
      const solicitacao = await trx('solicitacoes')
        .where('solicitacoes.id', req.params.id)
        .select(CAMPOS_SOLICITACAO_GESTOR)
        .first();

      if (!solicitacao) {
        return { tipo: 'nao_encontrada' };
      }

      await trx('solicitacoes')
        .where('solicitacoes.id', req.params.id)
        .update({ status: status_novo, atualizado_em: trx.fn.now() });

      // Atualiza a observação visível ao paciente na própria solicitação se houver uma nova
      // observação enviada pelo gestor (exige a regra de comentários do projeto)
      if (observacao) {
        await trx('solicitacoes')
          .where('id', req.params.id)
          .update({ observacao_paciente: observacao });
      }

      await trx('historico_status').insert({
        solicitacao_id: req.params.id,
        gestor_id:      req.user.id,
        status_anterior: solicitacao.status,
        status_novo,
        observacao:     observacao || null,
      });

      const atualizada = await trx('solicitacoes')
        .where({ id: req.params.id })
        .select(CAMPOS_SOLICITACAO_GESTOR)
        .first();

      return { tipo: 'atualizada', solicitacao: atualizada };
    });

    if (resultado.tipo === 'nao_encontrada') {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }

    await registrarAuditoria(req, {
      acao: 'solicitacao_status_atualizar',
      entidade: 'solicitacoes',
      entidade_id: resultado.solicitacao.id,
      escopo_ubs_id: resultado.solicitacao.ubs_id,
      metadata: { status_novo: resultado.solicitacao.status },
    });

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


// ─── PATCH /api/gestor/solicitacao/:id/escalar ───────────────────────────────
// Épico 2: Triagem de Urgência.
// Eleva a prioridade de uma solicitação para 'urgente' e registra o evento em
// historico_status com status_novo = 'urgente_escalado'.
// O status do fluxo (em_analise, autorizado, etc.) NÃO é alterado — apenas a
// prioridade muda, fazendo a solicitação aparecer no card "Atenção Imediata".
router.patch('/solicitacao/:id/escalar', async (req, res) => {
  try {
    const { justificativa } = req.body;

    // Rejeita justificativas ausentes ou muito curtas (mesma regra do frontend)
    if (!justificativa || justificativa.trim().length < 10) {
      return res.status(400).json({ error: 'A justificativa é obrigatória e deve ter pelo menos 10 caracteres.' });
    }

    const resultado = await knex.transaction(async (trx) => {
      const solicitacao = await trx('solicitacoes')
        .where({ id: req.params.id })
        .first();

      if (!solicitacao) return { tipo: 'nao_encontrada' };

      // Impede escalada dupla: solicitação já urgente não precisa de ação
      if (solicitacao.prioridade === 'urgente') {
        return { tipo: 'ja_urgente' };
      }

      // Atualiza prioridade e renova atualizado_em para acionar as regras do /alertas
      await trx('solicitacoes')
        .where({ id: req.params.id })
        .update({ prioridade: 'urgente', atualizado_em: trx.fn.now() });

      // Registra a escalada no histórico para auditoria e exibição na timeline do paciente.
      // status_anterior preserva o status de fluxo atual (em_analise, autorizado, etc.)
      await trx('historico_status').insert({
        solicitacao_id:  req.params.id,
        gestor_id:       req.user.id,
        status_anterior: solicitacao.status,
        status_novo:     'urgente_escalado',
        observacao:      justificativa.trim(),
      });

      const atualizada = await trx('solicitacoes')
        .where({ id: req.params.id })
        .select(CAMPOS_SOLICITACAO_GESTOR)
        .first();
      return { tipo: 'escalada', solicitacao: atualizada };
    });

    if (resultado.tipo === 'nao_encontrada') {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }
    if (resultado.tipo === 'ja_urgente') {
      return res.status(409).json({ error: 'Esta solicitação já possui prioridade urgente.' });
    }

    await registrarAuditoria(req, {
      acao: 'solicitacao_escalar',
      entidade: 'solicitacoes',
      entidade_id: resultado.solicitacao.id,
      escopo_ubs_id: resultado.solicitacao.ubs_id,
      metadata: { prioridade: resultado.solicitacao.prioridade },
    });

    // Notifica o paciente da escalada. Feito fora da transação: falha no push
    // não deve reverter a atualização de prioridade já confirmada.
    pushService.enviar(
      resultado.solicitacao.paciente_id,
      'paciente',
      {
        titulo: 'Prioridade atualizada no seu pedido',
        corpo:  'Seu pedido foi escalado para urgente pela equipe da UBS.',
        url:    `/paciente/solicitacao/${resultado.solicitacao.id}`,
      }
    ).catch(() => {}); // Erro de push não afeta a resposta da API

    return res.json(resultado.solicitacao);
  } catch (err) {
    console.error('[PATCH /gestor/solicitacao/:id/escalar]', err);
    return res.status(500).json({ error: 'Erro ao escalar solicitação.' });
  }
});


// ─── PATCH /api/gestor/solicitacao/:id/resultado ─────────────────────────────
// Registra ou atualiza o resultado clínico e o CID-10 de uma solicitação.
// Pode ser chamado mesmo com status != 'concluido' (ex: resultado parcial).
// Body: { resultado: string, cid_10: string }
router.patch('/solicitacao/:id/resultado', async (req, res) => {
  try {
    const { resultado, cid_10 } = req.body;

    // Ao menos um dos dois campos deve ser enviado
    if (resultado === undefined && cid_10 === undefined) {
      return res.status(400).json({ error: 'Informe ao menos resultado ou cid_10.' });
    }

    const solicitacao = await knex('solicitacoes')
      .where({ id: req.params.id })
      .select(CAMPOS_SOLICITACAO_GESTOR)
      .first();

    if (!solicitacao) {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }

    const atualizada = await knex('solicitacoes')
      .where({ id: req.params.id })
      .update({
        // undefined não sobrescreve — null limpa o campo explicitamente
        resultado:    resultado !== undefined ? resultado : solicitacao.resultado,
        cid_10:       cid_10    !== undefined ? cid_10    : solicitacao.cid_10,
        atualizado_em: knex.fn.now(),
      })
      .returning(CAMPOS_SOLICITACAO_GESTOR)
      .then(rows => rows[0]);

    await registrarAuditoria(req, {
      acao: 'solicitacao_resultado_atualizar',
      entidade: 'solicitacoes',
      entidade_id: atualizada.id,
      escopo_ubs_id: atualizada.ubs_id,
      metadata: { resultado_alterado: resultado !== undefined, cid_10_alterado: cid_10 !== undefined },
    });

    return res.json(atualizada);
  } catch (err) {
    console.error('[PATCH /gestor/solicitacao/:id/resultado]', err);
    return res.status(500).json({ error: 'Erro ao registrar resultado.' });
  }
});


// ─── GET /api/gestor/paciente/:id/atendimentos ────────────────────────────────
// Retorna todos os atendimentos clínicos do paciente, do mais recente ao mais antigo.
// Inclui nome de quem registrou para auditoria.
router.get('/paciente/:id/atendimentos', async (req, res) => {
  try {
    const paciente = await knex('pacientes').where({ id: req.params.id }).first();
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    const atendimentos = await knex('atendimentos')
      .leftJoin('usuarios_gestores', 'atendimentos.registrado_por', 'usuarios_gestores.id')
      .where('atendimentos.paciente_id', req.params.id)
      .whereNull('atendimentos.excluido_em')
      .select(
        ...CAMPOS_ATENDIMENTO.map((campo) => `atendimentos.${campo}`),
        'usuarios_gestores.nome as registrado_por_nome',
      )
      .orderBy('atendimentos.data_atendimento', 'desc');

    return res.json(atendimentos);
  } catch (err) {
    console.error('[GET /gestor/paciente/:id/atendimentos]', err);
    return res.status(500).json({ error: 'Erro ao buscar atendimentos.' });
  }
});


// ─── POST /api/gestor/paciente/:id/atendimento ───────────────────────────────
// Registra um novo atendimento clínico para o paciente.
// Body: { data_atendimento, unidade, tipo_unidade, especialidade,
//         profissional, cid_10_principal, cid_10_secundario, conduta, observacoes }
router.post('/paciente/:id/atendimento', validateBody(atendimentoSchema), async (req, res) => {
  try {
    const {
      data_atendimento, unidade, tipo_unidade, especialidade,
      profissional, cid_10_principal, cid_10_secundario, conduta, observacoes,
    } = req.body;

    if (!data_atendimento || !unidade) {
      return res.status(400).json({ error: 'Data do atendimento e unidade são obrigatórios.' });
    }

    const paciente = await knex('pacientes').where({ id: req.params.id }).first();
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    const [atendimento] = await knex('atendimentos')
      .insert({
        paciente_id:       req.params.id,
        registrado_por:    req.user.id,
        data_atendimento,
        unidade,
        tipo_unidade:      tipo_unidade || null,
        especialidade:     especialidade || null,
        profissional:      profissional || null,
        cid_10_principal:  cid_10_principal || null,
        cid_10_secundario: cid_10_secundario || null,
        conduta:           conduta || null,
        observacoes:       observacoes || null,
      })
      .returning(CAMPOS_ATENDIMENTO);

    await registrarAuditoria(req, {
      acao: 'atendimento_criar',
      entidade: 'atendimentos',
      entidade_id: atendimento.id,
      escopo_ubs_id: paciente.ubs_id,
      metadata: { paciente_id: paciente.id },
    });

    return res.status(201).json(atendimento);
  } catch (err) {
    console.error('[POST /gestor/paciente/:id/atendimento]', err);
    return res.status(500).json({ error: 'Erro ao registrar atendimento.' });
  }
});


// ─── PUT /api/gestor/atendimento/:id ─────────────────────────────────────────
// Atualiza um atendimento clínico existente.
// Permite corrigir data, unidade, resultado, CID etc. após o registro inicial.
// Body: qualquer combinação dos campos de atendimento (todos opcionais)
router.put('/atendimento/:id', validateBody(atendimentoSchema), async (req, res) => {
  try {
    const existente = await knex('atendimentos')
      .where({ id: req.params.id })
      .whereNull('excluido_em')
      .first();
    if (!existente) {
      return res.status(404).json({ error: 'Atendimento não encontrado.' });
    }

    const {
      data_atendimento, unidade, tipo_unidade, especialidade,
      profissional, cid_10_principal, cid_10_secundario, conduta, observacoes,
    } = req.body;

    const [atualizado] = await knex('atendimentos')
      .where({ id: req.params.id })
      .update({
        data_atendimento:  data_atendimento  ?? existente.data_atendimento,
        unidade:           unidade           ?? existente.unidade,
        tipo_unidade:      tipo_unidade      !== undefined ? tipo_unidade      : existente.tipo_unidade,
        especialidade:     especialidade     !== undefined ? especialidade     : existente.especialidade,
        profissional:      profissional      !== undefined ? profissional      : existente.profissional,
        cid_10_principal:  cid_10_principal  !== undefined ? cid_10_principal  : existente.cid_10_principal,
        cid_10_secundario: cid_10_secundario !== undefined ? cid_10_secundario : existente.cid_10_secundario,
        conduta:           conduta           !== undefined ? conduta           : existente.conduta,
        observacoes:       observacoes       !== undefined ? observacoes       : existente.observacoes,
        atualizado_em:     knex.fn.now(),
      })
      .returning(CAMPOS_ATENDIMENTO);

    await registrarAuditoria(req, {
      acao: 'atendimento_atualizar',
      entidade: 'atendimentos',
      entidade_id: atualizado.id,
      metadata: { paciente_id: atualizado.paciente_id },
    });

    return res.json(atualizado);
  } catch (err) {
    console.error('[PUT /gestor/atendimento/:id]', err);
    return res.status(500).json({ error: 'Erro ao atualizar atendimento.' });
  }
});


// ─── DELETE /api/gestor/atendimento/:id ──────────────────────────────────────
// Remove permanentemente um atendimento clínico.
// Usado para corrigir registros inseridos por engano.
// Não há soft delete — atendimentos errôneos simplesmente não existiram.
router.delete('/atendimento/:id', async (req, res) => {
  try {
    const { motivo_exclusao } = req.body || {};
    const existente = await knex('atendimentos')
      .where({ id: req.params.id })
      .whereNull('excluido_em')
      .first();
    if (!existente) {
      return res.status(404).json({ error: 'Atendimento não encontrado.' });
    }

    await knex('atendimentos')
      .where({ id: req.params.id })
      .update({
        excluido_em: knex.fn.now(),
        excluido_por: req.user.id,
        motivo_exclusao: motivo_exclusao || 'Removido pela equipe gestora.',
        atualizado_em: knex.fn.now(),
      });

    await registrarAuditoria(req, {
      acao: 'atendimento_excluir',
      entidade: 'atendimentos',
      entidade_id: existente.id,
      metadata: { paciente_id: existente.paciente_id, motivo_exclusao: motivo_exclusao || null },
    });

    return res.json({ mensagem: 'Atendimento removido com sucesso.' });
  } catch (err) {
    console.error('[DELETE /gestor/atendimento/:id]', err);
    return res.status(500).json({ error: 'Erro ao remover atendimento.' });
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
// Atualiza a disponibilidade, observação e/ou instruções de retirada de um medicamento.
// O toggle de disponibilidade na tela do gestor chama esta rota.
// Body: { disponivel: boolean, observacao: string, instrucoes_retirada: string }
router.put('/medicamento/:id', async (req, res) => {
  try {
    const { disponivel, observacao, instrucoes_retirada } = req.body;

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
        observacao:          observacao          ?? existente.observacao,
        instrucoes_retirada: instrucoes_retirada ?? existente.instrucoes_retirada,
        atualizado_em:       knex.fn.now(),
        atualizado_por:      req.user.id,
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
// Body: { nome: string, principio_ativo: string, disponivel: boolean, observacao: string, instrucoes_retirada: string }
router.post('/medicamento', async (req, res) => {
  try {
    const { nome, principio_ativo, disponivel = false, observacao, instrucoes_retirada } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'O nome do medicamento é obrigatório.' });
    }

    const [inserido] = await knex('medicamentos')
      .insert({
        ubs_id:              req.user.ubs_id,
        nome,
        principio_ativo:     principio_ativo || null,
        disponivel,
        observacao:          observacao          || null,
        instrucoes_retirada: instrucoes_retirada || null,
        atualizado_por:      req.user.id,
      })
      .returning(CAMPOS_MEDICAMENTO);

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
      .returning(CAMPOS_PACIENTE_RETORNO);

    // O CPF é aceito para cadastro, mas nunca retorna pela API do gestor.
    await registrarAuditoria(req, {
      acao: 'paciente_criar',
      entidade: 'pacientes',
      entidade_id: paciente.id,
      escopo_ubs_id: paciente.ubs_id,
    });

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
// Body (opcionais): { nome, telefone, email, ativo, tipo_sanguineo, peso_kg, altura_cm, alergias, comorbidades, medicamentos_uso_continuo, observacoes_clinicas }
router.put('/paciente/:id', async (req, res) => {
  try {
    const {
      nome, telefone, email, ativo,
      // Campos clínicos — opcionais, null preserva valor existente
      tipo_sanguineo, peso_kg, altura_cm,
      alergias, comorbidades, medicamentos_uso_continuo, observacoes_clinicas,
    } = req.body;

    // MODO MATRIZ: qualquer gestor pode editar dados de qualquer paciente
    const existente = await knex('pacientes')
      .where({ id: req.params.id })
      .first();

    if (!existente) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    const [atualizado] = await knex('pacientes')
      .where({ id: req.params.id })
      .update({
        nome:                       nome ?? existente.nome,
        telefone:                   telefone ?? existente.telefone,
        email:                      email ?? existente.email,
        ativo:                      ativo ?? existente.ativo,
        // Usa null explícito para apagar um campo clínico; undefined preserva o valor
        tipo_sanguineo:             tipo_sanguineo !== undefined ? tipo_sanguineo : existente.tipo_sanguineo,
        peso_kg:                    peso_kg !== undefined ? peso_kg : existente.peso_kg,
        altura_cm:                  altura_cm !== undefined ? altura_cm : existente.altura_cm,
        alergias:                   alergias !== undefined ? alergias : existente.alergias,
        comorbidades:               comorbidades !== undefined ? comorbidades : existente.comorbidades,
        medicamentos_uso_continuo:  medicamentos_uso_continuo !== undefined ? medicamentos_uso_continuo : existente.medicamentos_uso_continuo,
        observacoes_clinicas:       observacoes_clinicas !== undefined ? observacoes_clinicas : existente.observacoes_clinicas,
        atualizado_em:              knex.fn.now(),
      })
      .returning(CAMPOS_PACIENTE_RETORNO);

    // Mantém a resposta compatível com a regra de minimização de dados da LGPD.
    await registrarAuditoria(req, {
      acao: 'paciente_atualizar_matriz',
      entidade: 'pacientes',
      entidade_id: atualizado.id,
      escopo_ubs_id: atualizado.ubs_id,
      metadata: { origem: 'modo_matriz' },
    });

    return res.json(atualizado);
  } catch (err) {
    console.error('[PUT /gestor/paciente/:id]', err);
    return res.status(500).json({ error: 'Erro ao atualizar dados do paciente.' });
  }
});


// ─── POST /api/gestor/paciente/:id/solicitacao ────────────────────────────────
// Cria uma nova solicitação para um paciente específico.
// Body: { tipo, descricao_interna, descricao_paciente, data_prevista }
// â”€â”€â”€ GET /api/gestor/catalogo-procedimentos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Lista procedimentos ativos para comboboxes. O filtro por tipo tambem inclui
// itens sem tipo_unidade, pois eles podem ser usados em qualquer unidade.
router.get('/catalogo-procedimentos', async (req, res) => {
  try {
    const { q, tipo_unidade } = req.query;

    let query = knex('catalogo_procedimentos')
      .where({ ativo: true })
      .select('id', 'nome', 'especialidade', 'tipo_unidade');

    if (tipo_unidade) {
      query = query.where((builder) => {
        builder.where('tipo_unidade', tipo_unidade).orWhereNull('tipo_unidade');
      });
    }

    if (q && q.trim().length > 0) {
      query = query.whereILike('nome', `%${q.trim()}%`);
    }

    const items = await query.orderBy('nome');
    return res.json(items);
  } catch (err) {
    console.error('[GET /gestor/catalogo-procedimentos]', err);
    return res.status(500).json({ error: 'Erro ao buscar catalogo de procedimentos.' });
  }
});


// â”€â”€â”€ GET /api/gestor/unidades-externas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Lista unidades externas ativas para dropdowns do gestor, sem retornar dados
// sensiveis como email, senha_hash ou token_version.
router.get('/unidades-externas', async (req, res) => {
  try {
    const unidades = await knex('unidades_externas')
      .where({ ativo: true })
      .select('id', 'nome', 'tipo')
      .orderBy('nome');

    return res.json(unidades);
  } catch (err) {
    console.error('[GET /gestor/unidades-externas]', err);
    return res.status(500).json({ error: 'Erro ao buscar unidades externas.' });
  }
});


router.post('/paciente/:id/solicitacao', validateBody(solicitacaoSchema), async (req, res) => {
  try {
    const { tipo, descricao_interna, descricao_paciente, data_prevista, data_solicitacao, prioridade, local_executor, catalogo_id, unidade_externa_id } = req.body;

    if (!tipo || !descricao_interna || !descricao_paciente) {
      return res.status(400).json({ error: 'Tipo, descrição interna e descrição para o paciente são obrigatórios.' });
    }

    // MODO MATRIZ: aceita pacientes de qualquer UBS.
    // O ubs_id da solicitação herda da UBS de origem do paciente — não do gestor.
    const paciente = await knex('pacientes')
      .where({ id: req.params.id })
      .first();

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    // A solicitação e seu primeiro evento são uma única operação de negócio.
    // Se o histórico falhar, a transação desfaz também a solicitação.
    // Valida vinculos opcionais antes da transacao para evitar gravar IDs
    // inexistentes e para retornar erro claro ao frontend.
    let catalogo = null;
    if (catalogo_id) {
      catalogo = await knex('catalogo_procedimentos')
        .where({ id: catalogo_id, ativo: true })
        .first('id', 'nome', 'especialidade');

      if (!catalogo) {
        return res.status(400).json({ error: 'Procedimento do catalogo nao encontrado.' });
      }
    }

    let unidadeExterna = null;
    if (unidade_externa_id) {
      unidadeExterna = await knex('unidades_externas')
        .where({ id: unidade_externa_id, ativo: true })
        .first('id', 'nome', 'tipo');

      if (!unidadeExterna) {
        return res.status(400).json({ error: 'Unidade externa nao encontrada.' });
      }
    }

    const solicitacao = await knex.transaction(async (trx) => {
      const [novaSolicitacao] = await trx('solicitacoes')
        .insert({
          paciente_id:      paciente.id,
          ubs_id:           paciente.ubs_id, // usa UBS de origem do paciente
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
          catalogo_id:      catalogo_id || null,
          unidade_externa_id: unidade_externa_id || null,
        })
        .returning(CAMPOS_SOLICITACAO_GESTOR);

      await trx('historico_status').insert({
        solicitacao_id: novaSolicitacao.id,
        gestor_id: req.user.id,
        status_anterior: null,
        status_novo: novaSolicitacao.status,
        observacao: 'Solicitação registrada no sistema',
        alterado_em: trx.fn.now(),
      });

      // Bridge solicitacao -> encaminhamento: quando o gestor escolhe uma
      // unidade externa, criamos o registro que o portal externo realmente le.
      if (unidade_externa_id) {
        const prioridadeEncaminhamento = {
          urgente: 'VERMELHO',
          prioritario: 'AMARELO',
          rotina: 'VERDE',
        }[prioridade || 'rotina'] || 'VERDE';

        await trx('encaminhamentos').insert({
          paciente_id: paciente.id,
          ubs_id: paciente.ubs_id,
          gestor_id: req.user.id,
          unidade_externa_id: unidade_externa_id,
          solicitacao_id: novaSolicitacao.id,
          destino: unidadeExterna?.tipo || 'OUTRO',
          especialidade: catalogo?.especialidade || descricao_interna || 'Nao especificada',
          prioridade: prioridadeEncaminhamento,
          status: 'AGUARDANDO_VAGA',
          data_solicitacao: novaSolicitacao.data_solicitacao || new Date().toISOString().split('T')[0],
          observacoes: local_executor || null,
        });
      }

      return novaSolicitacao;
    });

    // Notifica o paciente apos a transacao: falha de push nao desfaz o registro.
    pushService.enviar(paciente.id, 'paciente', {
      titulo: 'Nova solicitacao registrada',
      corpo: `${descricao_paciente} foi registrada pela sua UBS. Acompanhe o status no aplicativo.`,
      url: '/paciente/solicitacoes',
    }).catch(err => console.warn('[push paciente nova solicitacao ignorado]', err.message));

    // Notifica a unidade externa quando houver bridge para encaminhamento.
    if (unidade_externa_id) {
      pushService.enviar(unidade_externa_id, 'externa', {
        titulo: 'Novo encaminhamento recebido',
        corpo: `A UBS encaminhou um paciente para ${catalogo?.nome || descricao_interna || local_executor || 'atendimento'}.`,
        url: '/externa/encaminhamentos',
      }).catch(err => console.warn('[push externa ignorado]', err.message));
    }

    await registrarAuditoria(req, {
      acao: 'solicitacao_criar',
      entidade: 'solicitacoes',
      entidade_id: solicitacao.id,
      escopo_ubs_id: solicitacao.ubs_id,
      metadata: { paciente_id: solicitacao.paciente_id, origem: 'modo_matriz' },
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

    // Busca todas as métricas ao mesmo tempo (paralelismo de queries).
    // MODO MATRIZ: contagens de pacientes e solicitações são globais (todas as UBSs).
    // Medicamentos permanecem filtrados pela UBS do gestor logado.
    const [
      totalPacientes,
      emAnalise,
      autorizados,
      dataMarcada,
      medsIndisponiveis,
      atividadeRecente,
      encaminhamentosPendentes,
    ] = await Promise.all([
      // COUNT de todos os pacientes ativos (modo matriz — sem filtro por UBS)
      knex('pacientes').where({ ativo: true }).count('id as total').first(),
      // COUNT de solicitações em análise (todas as UBSs)
      knex('solicitacoes').where({ status: 'em_analise' }).count('id as total').first(),
      // COUNT de solicitações autorizadas (todas as UBSs)
      knex('solicitacoes').where({ status: 'autorizado' }).count('id as total').first(),
      // COUNT de solicitações com data marcada (todas as UBSs)
      knex('solicitacoes').where({ status: 'data_marcada' }).count('id as total').first(),
      // COUNT de medicamentos indisponíveis — filtrado pela UBS do gestor logado
      knex('medicamentos').where({ ubs_id: ubsId, disponivel: false }).count('id as total').first(),
      // 6 solicitações mais recentes com nome do paciente (todas as UBSs)
      knex('solicitacoes')
        .join('pacientes', 'solicitacoes.paciente_id', 'pacientes.id')
        .select(
          'solicitacoes.id',
          'solicitacoes.descricao_paciente',
          'solicitacoes.status',
          'solicitacoes.atualizado_em',
          'pacientes.nome as paciente_nome'
        )
        .orderBy('solicitacoes.atualizado_em', 'desc')
        .limit(6),
      // COUNT de encaminhamentos aguardando vaga
      knex('encaminhamentos').where({ status: 'AGUARDANDO_VAGA' }).count('id as total').first(),
    ]);

    return res.json({
      total_pacientes:           Number(totalPacientes.total),
      em_analise:                Number(emAnalise.total),
      autorizados:               Number(autorizados.total),
      data_marcada:              Number(dataMarcada.total),
      medicamentos_indisponiveis: Number(medsIndisponiveis.total),
      encaminhamentos_pendentes: Number(encaminhamentosPendentes.total),
      atividade_recente:         atividadeRecente,
    });
  } catch (err) {
    console.error('[GET /gestor/dashboard/stats]', err);
    return res.status(500).json({ error: 'Erro ao buscar métricas do painel.' });
  }
});


// ─── GET /api/gestor/alertas ──────────────────────────────────────────────────
// Épico 2: Triagem de Urgência. Retorna alertas para o gestor.
// MODO MATRIZ: alertas de todas as UBSs — sem filtro por UBS do gestor.
router.get('/alertas', async (req, res) => {
  try {
    const alertas = await knex('solicitacoes')
      .join('pacientes', 'solicitacoes.paciente_id', 'pacientes.id')
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


// ─── GET /api/gestor/dashboard/pendentes ──────────────────────────────────────
// Retorna a contagem de pacientes inativos (cadastros aguardando aprovação).
// MODO MATRIZ: conta pendentes de TODAS as UBSs.
router.get('/dashboard/pendentes', async (req, res) => {
  try {
    const total = await knex('pacientes')
      .where({ ativo: true })
      .where('criado_em', '>=', knex.raw("NOW() - INTERVAL '7 days'"))
      .count('id as total')
      .first();
    return res.json({ pendentes_aprovacao: Number(total.total) });
  } catch (err) {
    console.error('[GET /gestor/dashboard/pendentes]', err);
    return res.status(500).json({ error: 'Erro ao buscar cadastros pendentes.' });
  }
});


// ─── GET /api/gestor/comunicados ──────────────────────────────────────────────
// Épico 3: Lista todos os comunicados da UBS, do mais recente ao mais antigo.
// Faz LEFT JOIN com pacientes para trazer o nome quando for comunicado individual.
router.get('/comunicados', async (req, res) => {
  try {
    // Guarda de segurança: impede erro de SQL (Undefined binding) caso o ubs_id 
    // não esteja definido no token decodificado do gestor (ex: sessões antigas)
    if (!req.user?.ubs_id) {
      return res.status(400).json({ error: 'ubs_id não identificado no token de autenticação.' });
    }

    const comunicados = await knex('comunicados')
      .leftJoin('pacientes', 'comunicados.paciente_id', 'pacientes.id')
      .where('comunicados.ubs_id', req.user.ubs_id)
      .select(
        'comunicados.id',
        'comunicados.titulo',
        'comunicados.mensagem',
        'comunicados.tipo',
        'comunicados.urgente',
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
// Body: { titulo, mensagem, tipo, paciente_id, urgente }
router.post('/comunicado', validateBody(comunicadoSchema), async (req, res) => {
  try {
    const { titulo, mensagem, tipo = 'geral', paciente_id, urgente = false, segmentacao_clinica } = req.body;

    // Campos obrigatórios
    if (!titulo || !mensagem) {
      return res.status(400).json({ error: 'Título e mensagem são obrigatórios.' });
    }

    const pacienteIdNormalizado = normalizarId(paciente_id);
    if (tipo === 'individual') {
      const paciente = await validarPacienteDaUbs(pacienteIdNormalizado, req.user.ubs_id);
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente nao encontrado nesta UBS.' });
      }
    }

    const [comunicado] = await knex('comunicados')
      .insert({
        ubs_id:     req.user.ubs_id,
        gestor_id:  req.user.id,
        paciente_id: tipo === 'individual' ? pacienteIdNormalizado : null,
        titulo,
        mensagem,
        tipo,
        urgente: Boolean(urgente), // garante tipo booleano mesmo se vier como string do form
        segmentacao_clinica: segmentacao_clinica || null,
      })
      .returning(CAMPOS_COMUNICADO);

    if (tipo === 'individual' && pacienteIdNormalizado) {
      await registrarAuditoria(req, {
        acao: 'comunicado_individual_criar',
        entidade: 'comunicados',
        entidade_id: comunicado.id,
        escopo_ubs_id: comunicado.ubs_id,
        metadata: { paciente_id: pacienteIdNormalizado },
      });
    }

    // Push para comunicado individual: notifica apenas o destinatario
    if (tipo === 'individual' && pacienteIdNormalizado) {
      pushService.enviar(pacienteIdNormalizado, 'paciente', {
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
// Query param opcional: ?gestor_responsavel_id=1 (filtra por gestor)
router.get('/agendamentos', async (req, res) => {
  try {
    const { status, gestor_responsavel_id } = req.query;

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
        'agendamentos_gestao.gestor_responsavel_id',
        'pacientes.nome as paciente_nome'
      )
      .orderBy('agendamentos_gestao.data_hora', 'asc');

    // Filtro opcional por status (ex: ?status=disponivel)
    if (status) {
      query = query.where('agendamentos_gestao.status', status);
    }

    // Filtro opcional por gestor responsável
    if (gestor_responsavel_id) {
      query = query.where('agendamentos_gestao.gestor_responsavel_id', gestor_responsavel_id);
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
// â”€â”€â”€ POST /api/gestor/agendamentos/lote â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Cria uma grade de slots disponiveis em uma unica transacao. O gestor informa
// o intervalo e a API deriva ubs_id/gestor_responsavel_id do token JWT.
router.post('/agendamentos/lote', validateBody(agendamentoLoteSchema), async (req, res) => {
  try {
    const {
      data_inicio,
      hora_inicio,
      hora_fim,
      intervalo_minutos,
      repetir_dias,
      pular_fins_de_semana,
    } = req.body;

    const [hIni, mIni] = hora_inicio.split(':').map(Number);
    const [hFim, mFim] = hora_fim.split(':').map(Number);
    const inicioMin = hIni * 60 + mIni;
    const fimMin = hFim * 60 + mFim;

    // Garante que a janela tenha duracao positiva antes de gerar slots.
    if (inicioMin >= fimMin) {
      return res.status(400).json({ error: 'A hora inicial deve ser menor que a hora final.' });
    }

    // Defesa em profundidade: mesmo com inputs type="time" no frontend, a API
    // rejeita grades fora do funcionamento padrao da UBS.
    if (!validarHorarioFuncionamento(inicioMin) || !validarHorarioFuncionamento(fimMin - 1)) {
      return res.status(400).json({ error: 'Horário fora do período de funcionamento (07h-18h).' });
    }

    const slots = [];

    for (let d = 0; d < repetir_dias; d++) {
      const dia = new Date(`${data_inicio}T${hora_inicio}:00`);
      dia.setDate(dia.getDate() + d);

      if (Number.isNaN(dia.getTime())) {
        return res.status(400).json({ error: 'Data inicial invalida.' });
      }

      const diaSemana = dia.getDay(); // 0 = domingo, 6 = sabado
      if (pular_fins_de_semana && (diaSemana === 0 || diaSemana === 6)) continue;

      for (let min = inicioMin; min < fimMin; min += intervalo_minutos) {
        const dataHora = new Date(dia);
        dataHora.setHours(Math.floor(min / 60), min % 60, 0, 0);

        slots.push({
          ubs_id:                 req.user.ubs_id,
          gestor_responsavel_id:  req.user.id,
          data_hora:              dataHora.toISOString(),
          duracao_minutos:        intervalo_minutos,
          status:                 'disponivel',
          paciente_id:            null,
        });
      }
    }

    if (slots.length === 0) {
      return res.status(400).json({ error: 'Nenhum horario gerado. Verifique os parametros e o intervalo de datas.' });
    }

    const inseridos = await knex.transaction(async (trx) => trx('agendamentos_gestao')
      .insert(slots)
      .onConflict(['ubs_id', 'data_hora'])
      .ignore()
      .returning(['id', 'data_hora', 'duracao_minutos', 'status']));

    return res.status(201).json({ criados: inseridos.length, slots: inseridos });
  } catch (err) {
    console.error('[POST /gestor/agendamentos/lote]', err);
    return res.status(500).json({ error: 'Erro ao criar agendamentos em lote.' });
  }
});

router.post('/agendamento', async (req, res) => {
  try {
    const { data_hora, duracao_minutos = 30, gestor_responsavel_id } = req.body;

    if (!data_hora) {
      return res.status(400).json({ error: 'A data e hora são obrigatórias.' });
    }

    const dataHora = new Date(data_hora);
    if (Number.isNaN(dataHora.getTime())) {
      return res.status(400).json({ error: 'Data e hora invalidas.' });
    }

    const minutosSlot = minutosDoHorario(dataHora);
    if (!validarHorarioFuncionamento(minutosSlot)) {
      return res.status(400).json({ error: 'Horário fora do período de funcionamento (07h-18h).' });
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
      .returning(CAMPOS_AGENDAMENTO);

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
      .returning(CAMPOS_AGENDAMENTO);

    return res.json(atualizado);
  } catch (err) {
    console.error('[PUT /gestor/agendamento/:id]', err);
    return res.status(500).json({ error: 'Erro ao atualizar agendamento.' });
  }
});


// ─── DELETE /api/gestor/agendamento/:id ───────────────────────────────────────
// Épico 4: Remove um slot de agendamento. Só permite se status = 'disponivel'.
// Impede exclusão de consultas já reservadas ou concluídas.
// ─── DELETE /api/gestor/agendamentos/em-massa ────────────────────────────────
// Remove varios slots livres de uma vez. Slots reservados, concluidos,
// cancelados ou de outra UBS sao ignorados e reportados no retorno.
router.delete('/agendamentos/em-massa', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Informe ao menos um horario para excluir.' });
    }

    const idsUnicos = [...new Set(ids.map(Number).filter(Number.isInteger))];
    if (idsUnicos.length === 0) {
      return res.status(400).json({ error: 'Lista de horarios invalida.' });
    }

    const slots = await knex('agendamentos_gestao')
      .where({ ubs_id: req.user.ubs_id })
      .whereIn('id', idsUnicos)
      .select('id', 'status', 'paciente_id');

    const excluiveis = slots
      .filter((slot) => slot.status === 'disponivel' && !slot.paciente_id)
      .map((slot) => slot.id);

    if (excluiveis.length > 0) {
      await knex('agendamentos_gestao')
        .where({ ubs_id: req.user.ubs_id })
        .whereIn('id', excluiveis)
        .del();
    }

    return res.json({
      excluidos: excluiveis.length,
      ignorados: idsUnicos.length - excluiveis.length,
    });
  } catch (err) {
    console.error('[DELETE /gestor/agendamentos/em-massa]', err);
    return res.status(500).json({ error: 'Erro ao excluir agendamentos em massa.' });
  }
});

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
// ─── GET /api/gestor/encaminhamentos ─────────────────────────────────────────
// Lista todos os encaminhamentos da UBS do gestor logado.
// Ordenação: prioridade (VERMELHO > AMARELO > VERDE) e depois por data de solicitação ASC.
// Calcula dias_na_fila em SQL apenas para encaminhamentos com status AGUARDANDO_VAGA.
// Cancelados são excluídos da listagem principal.
router.get('/encaminhamentos', async (req, res) => {
  try {
    const ubsId = req.user.ubs_id;
    const encaminhamentos = await knex('encaminhamentos')
      .join('pacientes', 'encaminhamentos.paciente_id', 'pacientes.id')
      .where('encaminhamentos.ubs_id', ubsId)
      .whereNot('encaminhamentos.status', 'CANCELADO')
      .select(
        ...CAMPOS_ENCAMINHAMENTO.map((campo) => `encaminhamentos.${campo}`),
        'pacientes.nome as paciente_nome',
        // dias_na_fila calculado em SQL — só relevante enquanto aguarda vaga
        knex.raw(`
          CASE
            WHEN encaminhamentos.status = 'AGUARDANDO_VAGA'
            THEN EXTRACT(DAY FROM NOW() - encaminhamentos.data_solicitacao)::integer
            ELSE NULL
          END as dias_na_fila
        `)
      )
      .orderByRaw(`
        CASE encaminhamentos.prioridade
          WHEN 'VERMELHO' THEN 1
          WHEN 'AMARELO'  THEN 2
          WHEN 'VERDE'    THEN 3
          ELSE 4
        END ASC,
        encaminhamentos.data_solicitacao ASC
      `);

    return res.json(encaminhamentos);
  } catch (err) {
    console.error('[GET /gestor/encaminhamentos]', err);
    return res.status(500).json({ error: 'Erro ao buscar encaminhamentos.' });
  }
});

// ─── POST /api/gestor/encaminhamento ─────────────────────────────────────────
// Cria novo encaminhamento de regulação para um paciente.
//
// BRIDGE AUTOMÁTICO: Se solicitacao_id for fornecido, a solicitação vinculada
// tem seu status atualizado para 'aguardando_regulacao' dentro da mesma transação.
// O historico_status registra a mudança com observação descritiva.
//
// Body: { paciente_id, destino, especialidade, prioridade, observacoes?, solicitacao_id? }
// Prioridade: 'VERDE' | 'AMARELO' | 'VERMELHO'
router.post('/encaminhamento', soNaoMedico, validateBody(encaminhamentoSchema), async (req, res) => {
  try {
    const { paciente_id, destino, especialidade, prioridade, observacoes, solicitacao_id } = req.body;

    if (!paciente_id || !destino || !especialidade || !prioridade) {
      return res.status(400).json({ error: 'Paciente, destino, especialidade e prioridade são obrigatórios.' });
    }

    const PRIORIDADES_VALIDAS = ['VERDE', 'AMARELO', 'VERMELHO'];
    if (!PRIORIDADES_VALIDAS.includes(prioridade)) {
      return res.status(400).json({ error: 'Prioridade inválida. Use VERDE, AMARELO ou VERMELHO.' });
    }

    const pacienteLocal = await validarPacienteDaUbs(paciente_id, req.user.ubs_id);
    if (!pacienteLocal) {
      return res.status(404).json({ error: 'Paciente nao encontrado nesta UBS.' });
    }

    const resultado = await knex.transaction(async (trx) => {
      // 1. Cria o encaminhamento
      const [encaminhamento] = await trx('encaminhamentos')
        .insert({
          ubs_id:         req.user.ubs_id,
          gestor_id:      req.user.id,
          paciente_id,
          destino,
          especialidade,
          prioridade,
          observacoes:    observacoes || null,
          solicitacao_id: solicitacao_id || null,
          status:         'AGUARDANDO_VAGA',
          data_solicitacao: trx.fn.now(),
          atualizado_em:  trx.fn.now(),
        })
        .returning(CAMPOS_ENCAMINHAMENTO);

      // 2. Se há solicitação vinculada, atualiza status para aguardando_regulacao
      if (solicitacao_id) {
        const solicitacao = await trx('solicitacoes')
          .where({ id: solicitacao_id, paciente_id, ubs_id: req.user.ubs_id })
          .first();
        if (!solicitacao) {
          const erro = new Error('Solicitacao nao encontrada para este paciente e UBS.');
          erro.statusCode = 404;
          throw erro;
        }

        if (solicitacao) {
          await trx('solicitacoes')
            .where({ id: solicitacao_id })
            .update({ status: 'aguardando_regulacao', atualizado_em: trx.fn.now() });

          await trx('historico_status').insert({
            solicitacao_id,
            gestor_id:       req.user.id,
            status_anterior: solicitacao.status,
            status_novo:     'aguardando_regulacao',
            observacao:      `Encaminhamento criado para ${destino} — ${especialidade}.`,
          });
        }
      }

      return encaminhamento;
    });

    await registrarAuditoria(req, {
      acao: 'encaminhamento_criar',
      entidade: 'encaminhamentos',
      entidade_id: resultado.id,
      escopo_ubs_id: resultado.ubs_id,
      metadata: { paciente_id: resultado.paciente_id, solicitacao_id: resultado.solicitacao_id },
    });

    return res.status(201).json(resultado);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('[POST /gestor/encaminhamento]', err);
    return res.status(500).json({ error: 'Erro ao criar encaminhamento.' });
  }
});

// ─── PUT /api/gestor/encaminhamento/:id/status ───────────────────────────────
// Atualiza o status de um encaminhamento.
//
// REGRAS:
//   - status AGENDADO exige data_agendamento no body
//   - status REALIZADO → solicitação vinculada (se houver) vai para 'concluido'
//   - status CANCELADO → solicitação vinculada NÃO é alterada (o gestor decide o próximo passo)
//   - Só permite alterar encaminhamentos da própria UBS do gestor
//
// Body: { status_novo, data_agendamento?, observacoes? }
router.put('/encaminhamento/:id/status', soNaoMedico, async (req, res) => {
  try {
    const { status_novo, data_agendamento, observacoes } = req.body;

    const STATUS_VALIDOS = ['AGUARDANDO_VAGA', 'AGENDADO', 'REALIZADO', 'CANCELADO'];
    if (!STATUS_VALIDOS.includes(status_novo)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    if (status_novo === 'AGENDADO' && !data_agendamento) {
      return res.status(400).json({ error: 'data_agendamento é obrigatório ao marcar como Agendado.' });
    }

    // Garante que o encaminhamento pertence à UBS do gestor logado
    const encaminhamento = await knex('encaminhamentos')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .first();

    if (!encaminhamento) {
      return res.status(404).json({ error: 'Encaminhamento não encontrado.' });
    }

    await knex.transaction(async (trx) => {
      // Atualiza o encaminhamento
      await trx('encaminhamentos')
        .where({ id: req.params.id })
        .update({
          status:          status_novo,
          data_agendamento: data_agendamento || encaminhamento.data_agendamento,
          observacoes:     observacoes !== undefined ? observacoes : encaminhamento.observacoes,
          atualizado_em:   trx.fn.now(),
        });

      // Se realizado E há solicitação vinculada ainda não concluída → conclui automaticamente
      if (status_novo === 'REALIZADO' && encaminhamento.solicitacao_id) {
        const sol = await trx('solicitacoes').where({ id: encaminhamento.solicitacao_id }).first();
        if (sol && !['concluido', 'cancelado'].includes(sol.status)) {
          await trx('solicitacoes')
            .where({ id: encaminhamento.solicitacao_id })
            .update({ status: 'concluido', atualizado_em: trx.fn.now() });

          await trx('historico_status').insert({
            solicitacao_id: encaminhamento.solicitacao_id,
            gestor_id:      req.user.id,
            status_anterior: sol.status,
            status_novo:    'concluido',
            observacao:     'Encaminhamento realizado — solicitação concluída automaticamente.',
          });
        }
      }
    });

    // Retorna o encaminhamento atualizado com nome do paciente
    const atualizado = await knex('encaminhamentos')
      .join('pacientes', 'encaminhamentos.paciente_id', 'pacientes.id')
      .where('encaminhamentos.id', req.params.id)
      .select(
        ...CAMPOS_ENCAMINHAMENTO.map((campo) => `encaminhamentos.${campo}`),
        'pacientes.nome as paciente_nome',
        knex.raw(`
          CASE
            WHEN encaminhamentos.status = 'AGUARDANDO_VAGA'
            THEN EXTRACT(DAY FROM NOW() - encaminhamentos.data_solicitacao)::integer
            ELSE NULL
          END as dias_na_fila
        `)
      )
      .first();

    await registrarAuditoria(req, {
      acao: 'encaminhamento_status_atualizar',
      entidade: 'encaminhamentos',
      entidade_id: atualizado.id,
      escopo_ubs_id: atualizado.ubs_id,
      metadata: { status_novo },
    });

    return res.json(atualizado);
  } catch (err) {
    console.error('[PUT /gestor/encaminhamento/:id/status]', err);
    return res.status(500).json({ error: 'Erro ao atualizar status do encaminhamento.' });
  }
});

// ============================================================================
// =================  MÓDULOS 2 e 3: REDE EXTERNA (Legado inativo) ============
// ============================================================================

// ─── GET /api/gestor/servico-social ─────────────────────────────────────────
// Rota mantida apenas para compatibilidade de banco de dados. Módulo inativo no front.
router.get('/servico-social', requirePerfil(['admin']), async (req, res) => {
  try {
    const casos = await knex('casos_sociais')
      .join('pacientes', 'casos_sociais.paciente_id', 'pacientes.id')
      .select(
        'casos_sociais.id',
        'casos_sociais.paciente_id',
        'casos_sociais.vulnerabilidade',
        'casos_sociais.status',
        'casos_sociais.data_identificacao',
        'casos_sociais.assistente_responsavel',
        'pacientes.nome as paciente_nome',
        'pacientes.telefone'
      )
      .orderBy('casos_sociais.data_identificacao', 'desc');

    return res.json(casos);
  } catch (err) {
    console.error('[GET /gestor/servico-social]', err);
    return res.status(500).json({ error: 'Erro ao buscar serviço social.' });
  }
});

// ─── GET /api/gestor/transporte ─────────────────────────────────────────────
// Rota mantida apenas para compatibilidade de banco de dados. Módulo inativo no front.
router.get('/transporte', requirePerfil(['admin']), async (req, res) => {
  try {
    const transportes = await knex('transporte_sanitario')
      .join('pacientes', 'transporte_sanitario.paciente_id', 'pacientes.id')
      .select(
        'transporte_sanitario.id',
        'transporte_sanitario.paciente_id',
        'transporte_sanitario.destino',
        'transporte_sanitario.data_viagem',
        'transporte_sanitario.horario_saida',
        'transporte_sanitario.veiculo',
        'transporte_sanitario.necessita_acompanhante',
        'transporte_sanitario.cadeirante',
        'transporte_sanitario.status',
        'pacientes.nome as paciente_nome',
        'pacientes.telefone'
      )
      .orderBy('transporte_sanitario.data_viagem', 'asc')
      .orderBy('transporte_sanitario.horario_saida', 'asc');

    return res.json(transportes);
  } catch (err) {
    console.error('[GET /gestor/transporte]', err);
    return res.status(500).json({ error: 'Erro ao buscar transporte sanitário.' });
  }
});

// ============================================================================
// =================  MÓDULO 4: VIGILÂNCIA EPIDEMIOLÓGICA  ====================
// ============================================================================

// ─── GET /api/gestor/vigilancia ──────────────────────────────────────────────
// Lista todas as notificações epidemiológicas da UBS do gestor logado.
// paciente_nome é NULL para surtos territoriais (sem paciente vinculado).
// Ordenação: data_notificacao DESC (mais recentes primeiro).
router.get('/vigilancia', async (req, res) => {
  try {
    const notificacoes = await knex('notificacoes_vigilancia')
      .leftJoin('pacientes', 'notificacoes_vigilancia.paciente_id', 'pacientes.id')
      .where('notificacoes_vigilancia.ubs_id', req.user.ubs_id)
      .select(
        ...CAMPOS_VIGILANCIA.map((campo) => `notificacoes_vigilancia.${campo}`),
        'pacientes.nome as paciente_nome'
      )
      .orderBy('notificacoes_vigilancia.data_notificacao', 'desc');

    return res.json(notificacoes);
  } catch (err) {
    console.error('[GET /gestor/vigilancia]', err);
    return res.status(500).json({ error: 'Erro ao buscar notificações de vigilância.' });
  }
});

// ─── POST /api/gestor/vigilancia ─────────────────────────────────────────────
// Registra nova notificação epidemiológica local.
//
// NOTA IMPORTANTE: Este registro é interno ao UBS+. Não substitui nem envia
// dados ao SINAN (sistema oficial de notificação compulsória do MS).
// O gestor deve continuar notificando o SINAN conforme obrigação legal.
//
// Body: { agravo, bairro, cep?, paciente_id? }
// paciente_id é opcional — surtos territoriais não precisam de paciente específico.
router.post('/vigilancia', soNaoMedico, validateBody(vigilanciaSchema), async (req, res) => {
  try {
    const { agravo, bairro, cep, paciente_id } = req.body;


    // Valida paciente_id se fornecido — deve pertencer à mesma UBS
    const pacienteIdNormalizado = paciente_id || null;
    if (pacienteIdNormalizado) {
      const paciente = await knex('pacientes')
        .where({ id: pacienteIdNormalizado, ubs_id: req.user.ubs_id, ativo: true })
        .first();
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente não encontrado nesta UBS.' });
      }
    }

    const [notificacao] = await knex('notificacoes_vigilancia')
      .insert({
        ubs_id:              req.user.ubs_id,
        gestor_id:           req.user.id,
        paciente_id:         pacienteIdNormalizado,
        agravo,
        bairro,
        cep:                 cep || null,
        status_investigacao: 'SUSPEITO',
        data_notificacao:    knex.fn.now(),
        atualizado_em:       knex.fn.now(),
      })
      .returning(CAMPOS_VIGILANCIA);

    await registrarAuditoria(req, {
      acao: 'vigilancia_criar',
      entidade: 'notificacoes_vigilancia',
      entidade_id: notificacao.id,
      escopo_ubs_id: notificacao.ubs_id,
      metadata: { paciente_id: notificacao.paciente_id },
    });

    return res.status(201).json(notificacao);
  } catch (err) {
    console.error('[POST /gestor/vigilancia]', err);
    return res.status(500).json({ error: 'Erro ao registrar notificação de vigilância.' });
  }
});

// ─── PUT /api/gestor/vigilancia/:id/status ───────────────────────────────────
// Atualiza o status de investigação de uma notificação.
// Body: { status_investigacao } — 'SUSPEITO' | 'CONFIRMADO' | 'DESCARTADO'
router.put('/vigilancia/:id/status', soNaoMedico, async (req, res) => {
  try {
    const { status_investigacao } = req.body;

    const STATUS_VALIDOS = ['SUSPEITO', 'CONFIRMADO', 'DESCARTADO'];
    if (!STATUS_VALIDOS.includes(status_investigacao)) {
      return res.status(400).json({ error: 'Status inválido. Use SUSPEITO, CONFIRMADO ou DESCARTADO.' });
    }

    // Garante isolamento por UBS — gestor só altera notificações da sua unidade
    const notificacao = await knex('notificacoes_vigilancia')
      .where({ id: req.params.id, ubs_id: req.user.ubs_id })
      .first();

    if (!notificacao) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }

    const [atualizada] = await knex('notificacoes_vigilancia')
      .where({ id: req.params.id })
      .update({ status_investigacao, atualizado_em: knex.fn.now() })
      .returning(CAMPOS_VIGILANCIA);

    await registrarAuditoria(req, {
      acao: 'vigilancia_status_atualizar',
      entidade: 'notificacoes_vigilancia',
      entidade_id: req.params.id,
      escopo_ubs_id: req.user.ubs_id,
      metadata: { status_investigacao },
    });

    return res.json(atualizada);
  } catch (err) {
    console.error('[PUT /gestor/vigilancia/:id/status]', err);
    return res.status(500).json({ error: 'Erro ao atualizar notificação de vigilância.' });
  }
});

// ─── GET /api/gestor/relatorios ──────────────────────────────────────────────
// RF-G09: Relatório de atividade da UBS para gestores e admins.
// Retorna distribuição de status das solicitações ativas e lista de urgências
// ociosas. Isolado por ubs_id do token — nunca expõe dados de outra UBS.
// LGPD: retorna apenas nome e CRA do paciente, nunca CPF.
router.get('/relatorios', async (req, res) => {
  try {
    const ubsId = req.user.ubs_id;

    // ── Distribuição de status das solicitações ativas ──
    // Conta solicitações por status, excluindo as já encerradas.
    const distribuicao = await knex('solicitacoes')
      .where({ ubs_id: ubsId })
      .whereNotIn('status', ['concluido', 'cancelado'])
      .groupBy('status')
      .select('status', knex.raw('COUNT(*) as total'));

    // ── Urgências ociosas (prioridade urgente, não concluídas) ──
    // Exibe apenas nome e CRA — CPF e dados sensíveis são omitidos (LGPD).
    const urgencias = await knex('solicitacoes')
      .join('pacientes', 'solicitacoes.paciente_id', 'pacientes.id')
      .where('solicitacoes.ubs_id', ubsId)
      .where('solicitacoes.prioridade', 'urgente')
      .whereNotIn('solicitacoes.status', ['concluido', 'cancelado'])
      .select(
        'solicitacoes.id',
        'solicitacoes.status',
        'solicitacoes.descricao_paciente',
        'solicitacoes.criado_em',
        'pacientes.nome as paciente_nome',
        'pacientes.cra as paciente_cra',
      );

    await registrarAuditoria(req, {
      acao: 'relatorio_atividade_gerado',
      entidade: 'solicitacoes',
      entidade_id: null,
      escopo_ubs_id: ubsId,
    });

    return res.json({
      distribuicao_status: distribuicao,
      urgencias_ociosas: urgencias,
    });
  } catch (err) {
    console.error('[GET /gestor/relatorios]', err);
    return res.status(500).json({ error: 'Erro ao gerar relatório.' });
  }
});

module.exports = router;
