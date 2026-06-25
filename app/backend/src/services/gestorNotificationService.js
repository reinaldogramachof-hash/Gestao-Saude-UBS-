// ─────────────────────────────────────────────────────────────────────────────
// SERVIÇO: gestorNotificationService.js
// FUNÇÃO: Centraliza a criação e o registro no banco de dados de notificações
//         operacionais destinadas à equipe de gestão de cada UBS.
//
// COMO FUNCIONA:
//   - Alertas operacionais são direcionados à UBS inteira (`ubs_id`).
//   - Cada gestor daquela UBS pode ler as notificações.
//   - O controle de quais notificações foram lidas por cada gestor individualmente
//     é gerenciado na tabela `notificacoes_gestor_leitura`.
// ─────────────────────────────────────────────────────────────────────────────

const knex = require('../db/knex');

/**
 * Registra uma nova notificação operacional no banco de dados.
 * A execução é isolada para assegurar que falhas de log ou escrita de alertas
 * nunca interrompam o fluxo principal de transações das APIs.
 *
 * @param {number} ubsId - ID da UBS destinatária da notificação
 * @param {object} dados - Dados estruturados do alerta operacional
 * @param {string} dados.tipo_evento - Categoria ('novo_paciente', 'novo_encaminhamento', etc.)
 * @param {string} dados.titulo - Título descritivo do alerta
 * @param {string} dados.mensagem - Texto completo de resumo operacional
 * @param {string} [dados.rota_destino] - Rota amigável para navegação no frontend
 * @param {string} [dados.entidade] - Nome da tabela associada para vinculação
 * @param {number} [dados.entidade_id] - ID do registro correspondente
 * @param {object} [dados.metadata_json] - Metadados adicionais de contexto
 * @returns {Promise<object|null>} Notificação criada ou null em caso de falha
 */
async function criarNotificacao(ubsId, dados) {
  try {
    const {
      tipo_evento,
      titulo,
      mensagem,
      rota_destino,
      entidade,
      entidade_id,
      metadata_json
    } = dados;

    if (!ubsId) {
      console.warn('[criarNotificacao] Tentativa de criar notificação sem ubsId especificado.');
      return null;
    }

    // Insere o registro e retorna o objeto gerado
    const [notificacao] = await knex('notificacoes_gestor')
      .insert({
        ubs_id: Number(ubsId),
        tipo_evento,
        titulo,
        mensagem,
        rota_destino: rota_destino || null,
        entidade: entidade || null,
        entidade_id: entidade_id || null,
        metadata_json: metadata_json ? JSON.stringify(metadata_json) : null,
        criado_em: knex.fn.now()
      })
      .returning('*');

    return notificacao;
  } catch (err) {
    // Falha silenciosa para a rota principal — apenas loga o erro de auditoria localmente
    console.error('[gestorNotificationService.criarNotificacao]', err.message);
    return null;
  }
}

module.exports = {
  criarNotificacao
};
