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
  // Evento especial: prioridade elevada para urgente pela equipe gestora
  urgente_escalado:      'Pedido escalado para urgente pela equipe',
  retorno_ubs_pendente:  'Retornando para reavaliação na UBS',
  retorno_ubs_concluido: 'Atendimento externo finalizado',
};

export const STATUS_CORES = {
  em_analise:            'bg-yellow-100 text-yellow-800',
  aguardando_regulacao:  'bg-orange-100 text-orange-800',
  autorizado:            'bg-blue-100 text-blue-800',
  data_marcada:          'bg-purple-100 text-purple-800',
  aguardando_resultado:  'bg-indigo-100 text-indigo-800',
  concluido:             'bg-green-100 text-green-800',
  cancelado:             'bg-gray-100 text-gray-500',
  // Cor vermelha para reforçar a urgência na timeline do paciente
  urgente_escalado:      'bg-red-100 text-red-800',
  retorno_ubs_pendente:  'bg-orange-100 text-orange-800',
  retorno_ubs_concluido: 'bg-green-100 text-green-800',
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÃO: formatarDataBR
// PROBLEMA RESOLVIDO: new Date('YYYY-MM-DD') interpreta a string como UTC
//   meia-noite. Em SJC (UTC-3), isso converte para 21h do dia anterior,
//   fazendo o toLocaleDateString mostrar a data errada.
// SOLUÇÃO: Se a string não contém 'T' (é só data, sem horário), adiciona
//   'T12:00:00' para ancorá-la ao meio-dia local, eliminando o offset.
//
// PARÂMETROS:
//   - iso: string — data em formato ISO ('2026-06-17' ou '2026-06-17T15:30:00Z')
//   - opcoes: object — opções opcionais para toLocaleDateString (default: pt-BR curto)
//
// RETORNO: string formatada em português (ex: '17/06/2026')
// ─────────────────────────────────────────────────────────────────────────────
export function formatarDataBR(iso, opcoes) {
  if (!iso) return '—';
  const dataCorrigida = iso.includes('T') ? new Date(iso) : new Date(iso + 'T12:00:00');
  return dataCorrigida.toLocaleDateString('pt-BR', opcoes || {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Vite HMR trigger: 1
