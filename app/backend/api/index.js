/**
 * VERCEL SERVERLESS ENTRY POINT (api/index.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Ponto de entrada para a Vercel Function.
 *         A Vercel exige que a função esteja em /api/*.
 *         Este arquivo importa o app Express configurado em server.js
 *         e o exporta para que a Vercel gerencie cada request como uma função.
 *
 * POR QUE ISSO É NECESSÁRIO:
 *   Em serverless, não existe servidor persistente. A Vercel inicializa uma
 *   função isolada para cada request HTTP, executa e encerra. O Express é
 *   usado aqui como handler de request/response, não como servidor.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const app = require('../server');
module.exports = app;
