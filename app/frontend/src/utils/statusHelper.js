/**
 * UTILITARIO: statusHelper.js
 * ---------------------------------------------------------------------------
 * Centraliza os textos e as cores dos status exibidos ao paciente.
 * Os valores do banco continuam tecnicos, mas a interface sempre apresenta
 * uma explicacao curta e acessivel, conforme a regra de linguagem simples.
 */

export const STATUS_LABELS = {
  em_analise:            'Em análise pela equipe',
  aguardando_regulacao:  'Aguardando aprovação da regulação',
  autorizado:            'Autorizado — aguardando agendamento',
  data_marcada:          'Data agendada',
  aguardando_resultado:  'Aguardando resultado',
  concluido:             'Concluído',
  cancelado:             'Cancelado',
};

export const STATUS_CORES = {
  em_analise:            'bg-yellow-100 text-yellow-800',
  aguardando_regulacao:  'bg-orange-100 text-orange-800',
  autorizado:            'bg-blue-100 text-blue-800',
  data_marcada:          'bg-purple-100 text-purple-800',
  aguardando_resultado:  'bg-indigo-100 text-indigo-800',
  concluido:             'bg-green-100 text-green-800',
  cancelado:             'bg-gray-100 text-gray-500',
};
