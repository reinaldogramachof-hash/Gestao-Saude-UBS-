/**
 * PONTO DE ENTRADA DO BACKEND (server.js)
 * -----------------------------------------------------------------------------
 * O servidor Express comeca a rodar a partir daqui.
 * O Express e um micro-framework para Node.js que simplifica a criacao
 * de rotas (URLs) e APIs.
 *
 * ESTRUTURA DE ROTAS:
 *   /api/auth/*     -> rotas publicas de autenticacao (sem token)
 *   /api/admin/*    -> gestao de usuarios da UBS (exige JWT perfil admin)
 *   /api/gestor/*   -> rotas protegidas do Portal do Gestor (exige JWT tipo gestor)
 *   /api/paciente/* -> rotas protegidas do Portal do Paciente (exige JWT tipo paciente)
 *   /api/ping       -> rota de teste de saude da API
 *   /health         -> alias publico para monitoramento externo
 * -----------------------------------------------------------------------------
 */

// -----------------------------------------------------------------------------
// SENTRY - Monitoramento de erros em producao
// Este bloco precisa ser executado antes da inicializacao principal do Express
// para registrar excecoes reais do backend somente em producao.
// O DSN vem de variavel de ambiente para evitar credenciais hardcoded no codigo.
// -----------------------------------------------------------------------------
require('dotenv').config();
const Sentry = require('@sentry/node');

if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN_BACKEND) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN_BACKEND,
    tracesSampleRate: 0.2,
  });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const MENSAGENS = require('./src/utils/mensagens');

// -----------------------------------------------------------------------------
// IMPORTACOES DE MIDDLEWARE E ROTAS
// -----------------------------------------------------------------------------
const authMiddleware = require('./src/middleware/auth');
const rotasAuth = require('./src/routes/auth');
const rotasGestor = require('./src/routes/gestor');
const rotasPaciente = require('./src/routes/paciente');
const rotasExterna = require('./src/routes/externa');
const adminRouter = require('./src/routes/admin');
const auditRouter = require('./src/routes/audit');

const app = express();

// O Vercel/Railway executam a API atras de um reverse proxy que injeta o IP
// real do cliente no header X-Forwarded-For. Sem este setting, o Express
// ignora o header e o express-rate-limit nao consegue identificar o cliente
// real, gerando ValidationError em toda requisicao (ERR_ERL_FORWARDED_HEADER).
// Valor 1 = confia no primeiro proxy da cadeia (o do Vercel/Railway).
app.set('trust proxy', 1);

// Helmet adiciona headers HTTP defensivos sem alterar as rotas de negocio.
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Limite global leve contra abuso de API. Login e cadastro continuam tendo
// limitadores especificos mais restritivos dentro de routes/auth.js.
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: MENSAGENS.GERAL.LIMITE_REQUISICOES },
});

// -----------------------------------------------------------------------------
// CORS: define quais origens podem acessar a API
// Em desenvolvimento: localhost do Vite e IP da rede local.
// Em producao: dominio oficial da Vercel e dominio customizado informado por env.
// -----------------------------------------------------------------------------
const ORIGENS_PERMITIDAS = [
  'http://localhost:5173',
  'http://localhost:3000',
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  'https://gestao-saude-ubs.vercel.app',
];

if (process.env.FRONTEND_URL) {
  ORIGENS_PERMITIDAS.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const permitida = ORIGENS_PERMITIDAS.some((origemPermitida) =>
      typeof origemPermitida === 'string'
        ? origemPermitida === origin
        : origemPermitida.test(origin)
    );

    if (permitida) return callback(null, true);
    callback(new Error(`CORS bloqueado: origem nao permitida - ${origin}`));
  },
  credentials: true,
}));

app.use('/api', apiRateLimiter);
app.use(express.json({ limit: '100kb' }));

// Util para monitorar se a API esta no ar sem precisar autenticar.
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'API Gestao Saude UBS+ funcionando!' });
});

// -----------------------------------------------------------------------------
// ROTA: GET /health
// FUNCAO: Disponibiliza um endpoint publico e estavel para servicos de
//         monitoramento externo, sem exigir autenticacao e sem expor dados
//         internos do sistema.
// -----------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API Gestao Saude UBS+ funcionando!',
    timestamp: new Date().toISOString(),
  });
});

// Rotas publicas (sem autenticacao).
app.use('/api/auth', rotasAuth);

// Rotas protegidas (exigem JWT valido).
// O authMiddleware verifica o token antes de qualquer rota abaixo.
app.use('/api/gestor', authMiddleware, rotasGestor);
app.use('/api/paciente', authMiddleware, rotasPaciente);
app.use('/api/externa', authMiddleware, rotasExterna);
app.use('/api/admin', authMiddleware, adminRouter);
app.use('/api/audit', authMiddleware, auditRouter);

// -----------------------------------------------------------------------------
// SENTRY - Handler de erros do Express
// Encaminha para o Sentry apenas os erros nao tratados que escaparem das
// rotas e middlewares em producao, sem gerar ruido no ambiente local.
// -----------------------------------------------------------------------------
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN_BACKEND) {
  Sentry.setupExpressErrorHandler(app);
}

// Em ambiente Vercel (serverless), nao ha servidor persistente.
// O Vercel injeta VERCEL=1 automaticamente - nesse caso, apenas exportamos
// o app para que a Vercel Function o execute diretamente por request.
// Localmente (sem VERCEL=1), o app.listen() sobe normalmente.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;

  // '0.0.0.0' expoe o servidor em todas as interfaces de rede, permitindo
  // acesso via smartphone na mesma rede local durante testes operacionais.
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Gestao Saude UBS+ rodando na porta ${PORT}`);
  });
}

// Exporta o app para uso como Vercel Serverless Function.
module.exports = app;
