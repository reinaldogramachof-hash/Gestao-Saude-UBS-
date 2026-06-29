// ─────────────────────────────────────────────────────────────────────────────
// MENSAGENS: Constantes de mensagens de erro e sucesso em PT-BR
// FUNÇÃO: Ponto único para todas as strings exibidas ao usuário final.
//         Evita mensagens em inglês e inconsistência entre rotas.
// ─────────────────────────────────────────────────────────────────────────────
const MENSAGENS = {
  AUTH: {
    CREDENCIAIS_INVALIDAS: 'E-mail ou senha incorretos.',
    TOKEN_EXPIRADO: 'Sua sessão expirou. Faça login novamente.',
    ACESSO_NEGADO: 'Você não tem permissão para acessar este recurso.',
    NAO_AUTENTICADO: 'É necessário fazer login para continuar.',
    EMAIL_JA_CADASTRADO: 'E-mail já cadastrado no sistema.',
  },
  PACIENTE: {
    NAO_ENCONTRADO: 'Paciente não encontrado.',
    CRA_JA_CADASTRADO: 'Este CRA já está cadastrado no sistema.',
    DADOS_INVALIDOS: 'Os dados informados são inválidos. Verifique e tente novamente.',
  },
  GERAL: {
    ERRO_INTERNO: 'Ocorreu um erro interno. Tente novamente em instantes.',
    CAMPO_OBRIGATORIO: (campo) => `O campo "${campo}" é obrigatório.`,
    LIMITE_REQUISICOES: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    NAO_ENCONTRADO: 'Recurso não encontrado.',
  },
  AGENDAMENTO: {
    NAO_ENCONTRADO: 'Agendamento não encontrado.',
    INDISPONIVEL: 'Este horário não está mais disponível.',
    APENAS_RESERVADOS_CANCELAVEIS: 'Apenas agendamentos reservados podem ser cancelados.',
  },
  ENCAMINHAMENTO: {
    NAO_ENCONTRADO: 'Encaminhamento não encontrado.',
    NAO_AGUARDANDO_CONFIRMACAO: 'Este encaminhamento não está aguardando confirmação.',
  },
  SUCESSO: {
    ATUALIZADO: 'Atualizado com sucesso.',
    CRIADO: 'Cadastrado com sucesso.',
    REMOVIDO: 'Removido com sucesso.',
  }
};

module.exports = MENSAGENS;
