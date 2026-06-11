/**
 * PONTO DE ENTRADA DO BACKEND (server.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * O servidor Express começa a rodar a partir daqui.
 * O Express é um micro-framework para Node.js que simplifica a criação
 * de rotas (URLs) e APIs.
 *
 * ESTRUTURA DE ROTAS:
 *   /api/auth/*     → rotas públicas de autenticação (sem token)
 *   /api/gestor/*   → rotas protegidas do Portal do Gestor (exige JWT tipo gestor)
 *   /api/paciente/* → rotas protegidas do Portal do Paciente (exige JWT tipo paciente)
 *   /api/ping       → rota de teste de saúde da API
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const cors    = require('cors');
require('dotenv').config(); // Carrega as variáveis do .env (DATABASE_URL, JWT_SECRET, PORT)

// ─── Importações de middleware e rotas ────────────────────────────────────────
const authMiddleware  = require('./src/middleware/auth');
const rotasAuth       = require('./src/routes/auth');
const rotasGestor     = require('./src/routes/gestor');
const rotasPaciente   = require('./src/routes/paciente');

const app = express();

// ─── Middlewares globais ──────────────────────────────────────────────────────
app.use(cors());           // Libera acesso para origens externas (frontend Vite em localhost:5173)
app.use(express.json());   // Permite JSON no corpo das requisições (req.body)

// ─── Rota de verificação de saúde (health check) ─────────────────────────────
// Útil para monitorar se a API está no ar sem precisar autenticar
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'API Gestão Saúde UBS+ funcionando!' });
});

// ─── Rotas públicas (sem autenticação) ───────────────────────────────────────
app.use('/api/auth', rotasAuth);

// ─── Rotas protegidas (exigem JWT válido) ────────────────────────────────────
// O authMiddleware verifica o token antes de qualquer rota abaixo
app.use('/api/gestor',   authMiddleware, rotasGestor);
app.use('/api/paciente', authMiddleware, rotasPaciente);

// ─── Inicialização ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
// '0.0.0.0' expõe o servidor em todas as interfaces de rede (necessário para acesso via smartphone na rede local)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Gestão Saúde UBS+ rodando na porta ${PORT}`);
});
