/**
 * PONTO DE ENTRADA DO BACKEND (server.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * O servidor Express começa a rodar a partir daqui.
 * O Express é um micro-framework para Node.js que simplifica a criação
 * de rotas (URLs) e APIs.
 *
 * ESTRUTURA DE ROTAS:
 *   /api/auth/*     → rotas públicas de autenticação (sem token)
 *   /api/admin/*    → gestão de usuários da UBS (exige JWT perfil admin)
 *   /api/gestor/*   → rotas protegidas do Portal do Gestor (exige JWT tipo gestor)
 *   /api/paciente/* → rotas protegidas do Portal do Paciente (exige JWT tipo paciente)
 *   /api/ping       → rota de teste de saúde da API
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); // Carrega as variáveis do .env (DATABASE_URL, JWT_SECRET, PORT)

// ─── Importações de middleware e rotas ────────────────────────────────────────
const authMiddleware  = require('./src/middleware/auth');
const rotasAuth       = require('./src/routes/auth');
const rotasGestor     = require('./src/routes/gestor');
const rotasPaciente   = require('./src/routes/paciente');
const rotasExterna    = require('./src/routes/externa');
const adminRouter     = require('./src/routes/admin');

const app = express();

// ─── Trust Proxy ─────────────────────────────────────────────────────────────
// O Vercel/Railway executam a API atrás de um reverse proxy que injeta o IP
// real do cliente no header X-Forwarded-For. Sem este setting, o Express
// ignora o header e o express-rate-limit não consegue identificar o cliente
// real, gerando ValidationError em toda requisição (ERR_ERL_FORWARDED_HEADER).
// Valor 1 = confia no primeiro proxy da cadeia (o do Vercel/Railway).
app.set('trust proxy', 1);

// Helmet adiciona headers HTTP defensivos (ex: bloquear sniffing de MIME e
// reduzir superficie de ataques de navegadores) sem alterar as rotas da API.
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Limite global leve contra abuso de API. Login e cadastro continuam tendo
// limitadores especificos mais restritivos dentro de routes/auth.js.
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisicoes. Aguarde alguns minutos e tente novamente.' },
});

// ─── CORS: define quais origens podem acessar a API ──────────────────────────
// Em desenvolvimento: localhost do Vite (5173) e IP da rede local
// Em produção: domínio oficial da Vercel e domínio customizado informado por env.
const ORIGENS_PERMITIDAS = [
  // Desenvolvimento local
  'http://localhost:5173',
  'http://localhost:3000',
  // Rede local (smartphone na mesma rede Wi-Fi durante testes)
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  // Deploy oficial de produção acadêmica
  'https://gestao-saude-ubs.vercel.app',
];

// Se existir um domínio customizado configurado via variável de ambiente, adiciona também
if (process.env.FRONTEND_URL) {
  ORIGENS_PERMITIDAS.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: curl, Postman, mobile app nativo)
    if (!origin) return callback(null, true);
    // Verifica se a origin bate com alguma entrada da lista (string ou regex)
    const permitida = ORIGENS_PERMITIDAS.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (permitida) return callback(null, true);
    callback(new Error(`CORS bloqueado: origem não permitida — ${origin}`));
  },
  credentials: true,
}));

app.use('/api', apiRateLimiter);
app.use(express.json({ limit: '100kb' }));   // Permite JSON no corpo sem aceitar payloads grandes demais

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
app.use('/api/externa', authMiddleware, rotasExterna);
app.use('/api/admin', authMiddleware, adminRouter);

// ─── Inicialização ────────────────────────────────────────────────────────────
// Em ambiente Vercel (serverless), não há servidor persistente.
// O Vercel injeta VERCEL=1 automaticamente — nesse caso, apenas exportamos
// o app para que a Vercel Function o execute diretamente por request.
// Localmente (sem VERCEL=1), o app.listen() sobe normalmente.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  // '0.0.0.0' expõe o servidor em todas as interfaces de rede (necessário para acesso via smartphone na rede local)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Gestão Saúde UBS+ rodando na porta ${PORT}`);
  });
}

// Exporta o app para uso como Vercel Serverless Function
module.exports = app;
