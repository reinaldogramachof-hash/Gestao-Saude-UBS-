/**
 * CONSOLIDADOR DE ROTAS (routes/index.js)
 * ---------------------------------------------------------
 * Para não poluir o server.js, juntamos todas as "sub-rotas" aqui.
 * Qualquer rota declarada aqui será acessada colocando '/api' antes,
 * conforme estruturamos lá no server.js ( app.use('/api', rotas) ).
 */
const express = require('express');
const router = express.Router();

router.get('/ping', (req, res) => {
  res.json({ message: 'API funcionando corretamente!' });
});

module.exports = router;