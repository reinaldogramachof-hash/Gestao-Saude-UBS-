/**
 * PONTO DE ENTRADA DO BACKEND (server.js)
 * ---------------------------------------------------------
 * O servidor Express começa a rodar a partir daqui.
 * O Express é um micro-framework para Node.js que simplifica a criação
 * de rotas (URLs) e APIs. Aqui configuramos o CORS (para o frontend 
 * poder acessar a API sem frescuras), importamos as rotas e damos "listen"
 * na porta principal!
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carrega as variáveis do .env

const rotas = require('./src/routes/index');

const app = express();

// Configurações globais (middlewares base):
app.use(cors()); // Libera o acesso para origens externas (como o nosso Vite frontend)
app.use(express.json()); // Permite que o servidor entenda JSON no corpo das requisições (req.body)

// Aplicar as rotas da aplicação
app.use('/api', rotas);

// Iniciar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});