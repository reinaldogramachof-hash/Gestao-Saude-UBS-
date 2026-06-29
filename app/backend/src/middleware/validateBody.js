/**
 * MIDDLEWARE: validateBody
 * -----------------------------------------------------------------------------
 * Valida req.body com schemas Joi antes da regra de negocio. Retorna todos os
 * erros encontrados para facilitar correcao por desenvolvedores e pela UI.
 */
const MENSAGENS = require('../utils/mensagens');

module.exports = function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: MENSAGENS.PACIENTE.DADOS_INVALIDOS,
        detalhes: error.details.map((detail) => detail.message),
      });
    }

    req.body = value;
    next();
  };
};
