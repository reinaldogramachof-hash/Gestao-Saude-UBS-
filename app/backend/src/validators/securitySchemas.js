/**
 * SCHEMAS JOI: securitySchemas
 * -----------------------------------------------------------------------------
 * Regras de entrada para rotas sensiveis. A validacao fica separada das rotas
 * para manter os handlers legiveis para a equipe junior do projeto.
 */
const Joi = require('joi');

const idNumerico = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/));

const loginGestorSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().min(1).required(),
});

const loginPacienteSchema = Joi.object({
  cra: Joi.string().trim().min(3).max(20).required(),
  data_nascimento: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

const statusSolicitacaoSchema = Joi.object({
  status_novo: Joi.string().valid(
    'em_analise',
    'aguardando_regulacao',
    'autorizado',
    'data_marcada',
    'aguardando_resultado',
    'concluido',
    'cancelado'
  ).required(),
  observacao: Joi.string().allow('', null).max(1000),
});

const atendimentoSchema = Joi.object({
  data_atendimento: Joi.date().iso(),
  unidade: Joi.string().trim().max(200),
  tipo_unidade: Joi.string().allow('', null).max(30),
  especialidade: Joi.string().allow('', null).max(100),
  profissional: Joi.string().allow('', null).max(150),
  cid_10_principal: Joi.string().allow('', null).max(10),
  cid_10_secundario: Joi.string().allow('', null).max(10),
  conduta: Joi.string().allow('', null).max(4000),
  observacoes: Joi.string().allow('', null).max(4000),
  motivo_exclusao: Joi.string().allow('', null).max(500),
}).unknown(false);

const comunicadoSchema = Joi.object({
  titulo: Joi.string().trim().max(150).required(),
  mensagem: Joi.string().trim().max(4000).required(),
  tipo: Joi.string().valid('geral', 'individual').default('geral'),
  paciente_id: idNumerico.allow('', null),
  urgente: Joi.boolean().default(false),
});

const encaminhamentoSchema = Joi.object({
  paciente_id: idNumerico.required(),
  destino: Joi.string().trim().max(200).required(),
  especialidade: Joi.string().trim().max(100).required(),
  prioridade: Joi.string().valid('VERDE', 'AMARELO', 'VERMELHO').required(),
  observacoes: Joi.string().allow('', null).max(2000),
  solicitacao_id: idNumerico.allow('', null),
});

const vigilanciaSchema = Joi.object({
  agravo: Joi.string().trim().max(150).required(),
  bairro: Joi.string().trim().max(120).required(),
  cep: Joi.string().allow('', null).max(20),
  paciente_id: idNumerico.allow('', null),
});

module.exports = {
  loginGestorSchema,
  loginPacienteSchema,
  statusSolicitacaoSchema,
  atendimentoSchema,
  comunicadoSchema,
  encaminhamentoSchema,
  vigilanciaSchema,
};
