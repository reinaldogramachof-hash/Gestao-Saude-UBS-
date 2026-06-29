/**
 * SERVICO: auditService
 * -----------------------------------------------------------------------------
 * FUNCAO: Ponto unico de registro de auditoria para todas as acoes do sistema.
 *         Mantem compatibilidade com a assinatura legado registrarAuditoria(req, dados)
 *         e expõe o contrato moderno registrar({ ... }) ou registrar(req, { ... }).
 *
 * REGRA OPERACIONAL:
 * - Nunca lanca excecao para a rota chamadora.
 * - Sanitiza detalhes para nao persistir senha, token ou CPF completo.
 * - Em desenvolvimento, espelha o resumo no console com prefixo [AUDIT].
 * -----------------------------------------------------------------------------
 */
const knex = require('../db/knex');

const CHAVES_SENSIVEIS = /(senha|password|token|authorization|jwt)/i;

function mascararCpfEmString(texto) {
  return texto.replace(/\b(\d{3})[.\s-]?(\d{3})[.\s-]?(\d{3})[.\s-]?(\d{2})\b/g, '$1.***.***-$4');
}

function mascararTokenEmString(texto) {
  return texto.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+/g, '[token-removido]');
}

function sanitizarTexto(texto) {
  return mascararTokenEmString(mascararCpfEmString(texto));
}

function sanitizar(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  if (Array.isArray(valor)) {
    return valor.map((item) => sanitizar(item));
  }

  if (typeof valor === 'string') {
    return sanitizarTexto(valor);
  }

  if (typeof valor === 'number' || typeof valor === 'boolean') {
    return valor;
  }

  if (typeof valor === 'object') {
    const saida = {};
    for (const [chave, conteudo] of Object.entries(valor)) {
      if (CHAVES_SENSIVEIS.test(chave)) {
        saida[chave] = '[redigido]';
        continue;
      }

      if (/cpf/i.test(chave) && typeof conteudo === 'string') {
        saida[chave] = mascararCpfEmString(conteudo);
        continue;
      }

      saida[chave] = sanitizar(conteudo);
    }
    return saida;
  }

  return String(valor);
}

function extrairIp(req) {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (Array.isArray(forwarded)) {
    return forwarded[0] || req?.ip || null;
  }

  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return req?.ip || null;
}

function derivarResultado(httpStatus) {
  if (!httpStatus) return 'sucesso';
  if (httpStatus >= 500) return 'erro';
  if (httpStatus >= 400) return 'falha';
  return 'sucesso';
}

function derivarResultadoPorAcao(acao) {
  const acaoNormalizada = String(acao || '').toUpperCase();
  if (acaoNormalizada.includes('ERRO')) return 'erro';
  if (acaoNormalizada.includes('FALHA')) return 'falha';
  if (acaoNormalizada.includes('SUCESSO')) return 'sucesso';
  return null;
}

function normalizarAcao(acao) {
  return String(acao || 'ACAO_NAO_INFORMADA')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .toUpperCase();
}

function normalizarEntidade(entidade) {
  return String(entidade || 'sistema')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .toLowerCase();
}

function serializarDetalhe(detalheSanitizado) {
  if (detalheSanitizado === null || detalheSanitizado === undefined) {
    return null;
  }

  if (typeof detalheSanitizado === 'string') {
    return detalheSanitizado;
  }

  return JSON.stringify(detalheSanitizado);
}

function construirPayload(reqOuPayload, dadosLegado) {
  const req = dadosLegado === undefined ? null : reqOuPayload;
  const dados = dadosLegado === undefined ? (reqOuPayload || {}) : (dadosLegado || {});
  const usuario = req?.user || req?.usuario || {};

  const httpStatus = dados.httpStatus ?? dados.http_status ?? null;
  const detalheOriginal = dados.detalhe ?? dados.metadata ?? null;
  const detalheSanitizado = sanitizar(detalheOriginal);
  const metadataSanitizada = typeof detalheSanitizado === 'object' && detalheSanitizado !== null
    ? detalheSanitizado
    : detalheSanitizado
      ? { detalhe: detalheSanitizado }
      : null;

  const payload = {
    usuarioId: dados.usuarioId ?? dados.usuario_id ?? dados.ator_id ?? usuario.id ?? null,
    usuarioTipo: dados.usuarioTipo ?? dados.usuario_tipo ?? dados.ator_tipo ?? usuario.tipo ?? 'sistema',
    usuarioPerfil: dados.usuarioPerfil ?? dados.usuario_perfil ?? dados.ator_perfil ?? usuario.perfil ?? null,
    ubsId: dados.ubsId ?? dados.ubs_id ?? dados.ator_ubs_id ?? dados.escopo_ubs_id ?? usuario.ubs_id ?? null,
    escopoUbsId: dados.escopoUbsId ?? dados.escopo_ubs_id ?? dados.ubs_id ?? usuario.ubs_id ?? null,
    acao: normalizarAcao(dados.acao),
    entidade: normalizarEntidade(dados.entidade),
    entidadeId: dados.entidadeId ?? dados.entidade_id ?? null,
    resultado: dados.resultado ?? derivarResultadoPorAcao(dados.acao) ?? derivarResultado(httpStatus),
    detalheTexto: serializarDetalhe(detalheSanitizado),
    detalheObjeto: detalheSanitizado,
    metadata: metadataSanitizada,
    ipOrigem: dados.ipOrigem ?? dados.ip_origem ?? extrairIp(req),
    userAgent: dados.userAgent ?? dados.user_agent ?? req?.headers?.['user-agent'] ?? null,
    httpStatus,
    createdAt: dados.createdAt ?? dados.created_at ?? null,
    req,
  };

  return payload;
}

async function registrar(reqOuPayload, dadosLegado) {
  const payload = construirPayload(reqOuPayload, dadosLegado);

  try {
    await knex('security_audit_logs').insert({
      created_at: payload.createdAt ?? knex.fn.now(),
      usuario_id: payload.usuarioId,
      usuario_tipo: payload.usuarioTipo,
      ubs_id: payload.ubsId,
      acao: payload.acao,
      entidade: payload.entidade,
      entidade_id: payload.entidadeId,
      resultado: payload.resultado,
      detalhe: payload.detalheTexto,
      ip_origem: payload.ipOrigem,
      http_status: payload.httpStatus,
      ator_tipo: payload.usuarioTipo,
      ator_id: payload.usuarioId,
      ator_perfil: payload.usuarioPerfil,
      ator_ubs_id: payload.ubsId,
      escopo_ubs_id: payload.escopoUbsId,
      ip: payload.ipOrigem,
      user_agent: payload.userAgent,
      metadata: payload.metadata,
      criado_em: payload.createdAt ?? knex.fn.now(),
    });

    if (payload.req) {
      payload.req.__auditJaRegistrado = true;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', JSON.stringify({
        usuarioId: payload.usuarioId,
        usuarioTipo: payload.usuarioTipo,
        ubsId: payload.ubsId,
        acao: payload.acao,
        entidade: payload.entidade,
        entidadeId: payload.entidadeId,
        resultado: payload.resultado,
        httpStatus: payload.httpStatus,
      }));
    }
  } catch (err) {
    console.error('[auditService] falha ao registrar auditoria', err.message);
  }
}

async function registrarAuditoria(req, dados) {
  return registrar(req, dados);
}

module.exports = { registrar, registrarAuditoria };
