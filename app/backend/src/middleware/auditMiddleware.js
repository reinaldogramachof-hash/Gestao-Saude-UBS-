/**
 * MIDDLEWARE: auditMiddleware
 * -----------------------------------------------------------------------------
 * FUNCAO: Intercepta respostas JSON das rotas criticas e registra auditoria
 *         automaticamente usando o status real devolvido ao cliente.
 *
 * REGRAS:
 * - Aplicado por grupo de rotas, nunca de forma global.
 * - Respeita logs manuais existentes: se a rota ja registrou auditoria
 *   explicitamente, o middleware nao duplica o evento.
 * - Nunca altera o corpo da resposta original.
 * -----------------------------------------------------------------------------
 */
const { registrar } = require('../services/auditService');

const ENTIDADES = {
  paciente: 'paciente',
  pacientes: 'paciente',
  solicitacao: 'solicitacao',
  solicitacoes: 'solicitacao',
  medicamento: 'medicamento',
  medicamentos: 'medicamento',
  comunicado: 'comunicado',
  comunicados: 'comunicado',
  agendamento: 'agendamento',
  agendamentos: 'agendamento',
  atendimento: 'atendimento',
  atendimentos: 'atendimento',
  encaminhamento: 'encaminhamento',
  encaminhamentos: 'encaminhamento',
  usuario: 'gestor',
  usuarios: 'gestor',
  notificacao: 'notificacao',
  notificacoes: 'notificacao',
  vigilancia: 'vigilancia',
  relatorios: 'relatorio',
  dashboard: 'dashboard',
  perfil: 'perfil',
  auth: 'autenticacao',
};

const ACOES_ESPECIAIS = {
  'login-gestor': 'LOGIN_GESTOR',
  'login-paciente': 'LOGIN_PACIENTE',
  'login-externa': 'LOGIN_EXTERNA',
  'cadastro-paciente': 'CREATE_PACIENTE',
  ativar: 'ATIVAR_PACIENTE',
  rejeitar: 'REJEITAR_PACIENTE',
  transferir: 'TRANSFERIR_PACIENTE',
  reservar: 'RESERVAR_AGENDAMENTO',
  cancelar: 'CANCELAR_AGENDAMENTO',
  confirmar: 'CONFIRMAR_ENCAMINHAMENTO',
  escalar: 'ESCALAR_SOLICITACAO',
  resultado: 'ATUALIZAR_RESULTADO_SOLICITACAO',
  status: 'ATUALIZAR_STATUS',
  receber: 'RECEBER_ENCAMINHAMENTO',
  agendar: 'AGENDAR_ENCAMINHAMENTO',
  concluir: 'CONCLUIR_ENCAMINHAMENTO',
  lido: 'MARCAR_COMO_LIDO',
  lida: 'MARCAR_COMO_LIDA',
  'marcar-todas-lidas': 'MARCAR_TODAS_COMO_LIDAS',
  historico: 'VISUALIZAR_HISTORICO',
};

const VERBOS = {
  GET: 'VISUALIZAR',
  POST: 'CRIAR',
  PUT: 'ATUALIZAR',
  PATCH: 'ATUALIZAR',
  DELETE: 'EXCLUIR',
};

function extrairSegmentos(req) {
  const rota = `${req.baseUrl || ''}${req.route?.path || req.path || ''}`;
  return rota.split('/').filter(Boolean).filter((segmento) => !segmento.startsWith(':'));
}

function inferirEntidade(req, config) {
  const segmentos = extrairSegmentos(req);
  const ultimo = segmentos.at(-1);
  const penultimo = segmentos.at(-2);

  if (ultimo && ENTIDADES[ultimo]) {
    return ENTIDADES[ultimo];
  }

  if (penultimo && ENTIDADES[penultimo]) {
    return ENTIDADES[penultimo];
  }

  return config.modulo || 'sistema';
}

function inferirAcao(req, entidade) {
  const segmentos = extrairSegmentos(req);
  const ultimo = segmentos.at(-1);

  if (ultimo && ACOES_ESPECIAIS[ultimo]) {
    return ACOES_ESPECIAIS[ultimo];
  }

  const verbo = VERBOS[req.method] || 'OPERAR';
  return `${verbo}_${String(entidade || 'SISTEMA').toUpperCase()}`;
}

function inferirEntidadeId(req, entidade) {
  if (req.method === 'POST' && !req.route?.path?.includes('/:')) {
    return null;
  }

  if (req.params?.pacienteId && entidade === 'paciente') {
    return Number(req.params.pacienteId);
  }

  if (req.params?.id && ['paciente', 'solicitacao', 'medicamento', 'comunicado', 'agendamento', 'atendimento', 'encaminhamento', 'gestor', 'notificacao', 'vigilancia'].includes(entidade)) {
    return Number(req.params.id);
  }

  return null;
}

function extrairIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || null;
}

module.exports = function auditMiddleware(config = {}) {
  return (req, res, next) => {
    const jsonOriginal = res.json.bind(res);

    res.json = function auditJsonInterceptor(body) {
      if (!req.__auditJaRegistrado) {
        const entidade = inferirEntidade(req, config);
        const detalhe = {
          metodo: req.method,
          rota: `${req.baseUrl || ''}${req.route?.path || req.path || ''}`,
          params: req.params || {},
          query: req.query || {},
          retorno: body?.error || body?.message || body?.mensagem || null,
        };

        void registrar(req, {
          usuarioId: req.user?.id ?? null,
          usuarioTipo: req.user?.tipo ?? 'sistema',
          ubsId: req.user?.ubs_id ?? null,
          acao: inferirAcao(req, entidade),
          entidade,
          entidadeId: inferirEntidadeId(req, entidade),
          resultado: res.statusCode >= 500 ? 'erro' : res.statusCode >= 400 ? 'falha' : 'sucesso',
          detalhe,
          ipOrigem: extrairIp(req),
          httpStatus: res.statusCode,
        });
      }

      return jsonOriginal(body);
    };

    next();
  };
};
