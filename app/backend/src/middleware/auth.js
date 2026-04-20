/**
 * MIDDLEWARE DE AUTENTICAÇÃO (auth.js)
 * ---------------------------------------------------------
 * Middlewares são funções que "ficam no meio" do caminho da requisição (daí o nome).
 * Antes de chegar na lógica principal (Controller), o router passa por aqui.
 * O JWT (JSON Web Token) é um "crachá digital".
 * Aqui nós pegamos o token enviado pelo frontend, abrimos ele com nossa chave secreta
 * e verificamos se ele é autêntico. Se for inválido, barramos a requisição.
 */
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extrai do formato "Bearer TOKEN_AQUI"

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido!' });
  }

  try {
    // Tenta decodificar. Se o token foi adulterado, ele atira um erro caindo no 'catch'
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Guarda o ID no request para o controller usar
    
    // next() libera a passagem. O request pode seguir viagem!
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido!' });
  }
};