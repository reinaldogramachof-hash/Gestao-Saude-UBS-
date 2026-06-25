// ─────────────────────────────────────────────────────────────────────────────
// SCRIPT: test_notificacoes_gestor.js
// FUNÇÃO: Testes de integração de ponta a ponta para validar o subsistema de
//         notificações operacionais do gestor no backend:
//           1. Instrumentação: Criar caso de vigilância gera notificação na UBS.
//           2. Listagem e Contagem: Rotas GET retornam contratos e contagens corretas.
//           3. Marcação de Leitura: Rota POST marca como lido individualmente.
//           4. Isolamento Multi-tenant: Gestores de outra UBS não acessam nem leem.
//           5. Leitura em Lote: Marcar todas como lidas zera o contador.
//
// USO: node test_notificacoes_gestor.js
//   Requer que o servidor backend esteja rodando em http://localhost:3001
// ─────────────────────────────────────────────────────────────────────────────

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Credenciais de teste presentes nos seeds do banco de dados
const CREDS_GESTOR_UBS_1 = { email: 'centro@gestaoubs.dev', senha: 'senha123' }; // Gestor da UBS Centro
const CREDS_GESTOR_UBS_2 = { email: 'industrial@gestaoubs.dev', senha: 'senha123' }; // Gestor da UBS Vila Industrial

// ─── Helpers HTTP ─────────────────────────────────────────────────────────────
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const resultados = [];

function registrar(nome, passou, detalhe = '') {
  resultados.push({ nome, passou, detalhe });
  const icone = passou ? '✅' : '❌';
  console.log(`  ${icone} ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
}

function assert(nome, condicao, mensagem) {
  registrar(nome, Boolean(condicao), mensagem);
}

// Obtenção de tokens de autenticação
async function obterToken(creds) {
  const res = await request('POST', '/api/auth/login-gestor', creds);
  if (res.status !== 200 || !res.body?.token) {
    throw new Error(`Falha de login para ${creds.email}: HTTP ${res.status}`);
  }
  return res.body.token;
}

// Suite principal de testes de integração
async function rodarTestes() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🔬 TESTES DE INTEGRAÇÃO — Notificações Operacionais do Gestor');
  console.log('  Alvo: ' + BASE_URL);
  console.log('═══════════════════════════════════════════════════════════════');

  let tokenUbs1, tokenUbs2;

  try {
    tokenUbs1 = await obterToken(CREDS_GESTOR_UBS_1);
    tokenUbs2 = await obterToken(CREDS_GESTOR_UBS_2);
    registrar('Login dos gestores das UBSs 1 e 2', true, 'tokens JWT obtidos');
  } catch (e) {
    registrar('Login dos gestores', false, e.message);
    process.exit(1);
  }

  try {
    // 1. Validar estado inicial de contagem de notificações não lidas para o Gestor 1
    const resCountInicial = await request('GET', '/api/gestor/notificacoes/nao-lidas-count', null, tokenUbs1);
    assert(
      'GET /notificacoes/nao-lidas-count retorna 200 e estrutura correta',
      resCountInicial.status === 200 && typeof resCountInicial.body.total === 'number',
      `HTTP ${resCountInicial.status} — total: ${resCountInicial.body.total}`
    );
    const totalInicial = resCountInicial.body.total;

    // 2. Disparar uma ação que deve instrumentar uma notificação (ex: cadastrar agravo de vigilância)
    const agravoAleatorio = `Agravo Teste ${Math.floor(Math.random() * 1000)}`;
    const resVigilancia = await request('POST', '/api/gestor/vigilancia', {
      agravo: agravoAleatorio,
      bairro: 'Centro das Flores',
    }, tokenUbs1);
    
    assert(
      'POST /vigilancia (Criar agravo) retorna 201',
      resVigilancia.status === 201,
      `HTTP ${resVigilancia.status}`
    );

    // 3. Validar se a contagem de não lidas incrementou para 1
    const resCountPosCriacao = await request('GET', '/api/gestor/notificacoes/nao-lidas-count', null, tokenUbs1);
    assert(
      'Contagem de não lidas incrementada após evento operacional',
      resCountPosCriacao.body.total === totalInicial + 1,
      `Anterior: ${totalInicial} — Atual: ${resCountPosCriacao.body.total}`
    );

    // 4. Buscar a lista de notificações do Gestor 1 e validar se o novo alerta está presente
    const resLista = await request('GET', '/api/gestor/notificacoes', null, tokenUbs1);
    assert(
      'GET /notificacoes retorna lista com notificações no formato correto',
      resLista.status === 200 && Array.isArray(resLista.body) && resLista.body.length > 0,
      `Tamanho: ${resLista.body?.length}`
    );

    const novaNotif = resLista.body.find(n => n.tipo_evento === 'vigilancia_epidemiologica' && n.titulo === 'Novo caso de vigilância');
    assert(
      'Notificação recém-criada encontrada na listagem da UBS 1',
      !!novaNotif,
      novaNotif ? 'Encontrada' : 'Não encontrada na listagem'
    );
    
    if (novaNotif) {
      assert(
        'Notificação gerada possui o status de lida = false',
        novaNotif.lida === false,
        `Lida: ${novaNotif.lida}`
      );

      // 5. TESTE DE ISOLAMENTO MULTI-TENANT: Gestor da UBS 2 não deve enxergar a notificação da UBS 1
      const resListaUbs2 = await request('GET', '/api/gestor/notificacoes', null, tokenUbs2);
      const notifNaUbs2 = resListaUbs2.body.find(n => n.id === novaNotif.id);
      assert(
        'ISOLAMENTO MULTI-TENANT: Gestor da UBS 2 não lista notificação da UBS 1',
        !notifNaUbs2,
        notifNaUbs2 ? 'Vazamento detectado: gestor da UBS 2 enxergou' : 'Isolamento OK'
      );

      // Gestor da UBS 2 tenta marcar como lida notificação da UBS 1 — Deve retornar 404/403
      const resLidaUbs2 = await request('POST', `/api/gestor/notificacao/${novaNotif.id}/lida`, null, tokenUbs2);
      assert(
        'ISOLAMENTO MULTI-TENANT: Gestor da UBS 2 recebe 404 ao tentar marcar leitura na UBS 1',
        resLidaUbs2.status === 404,
        `HTTP ${resLidaUbs2.status} (esperado: 404)`
      );

      // 6. Marcar como lida pelo Gestor 1 (UBS correta)
      const resLidaUbs1 = await request('POST', `/api/gestor/notificacao/${novaNotif.id}/lida`, null, tokenUbs1);
      assert(
        'POST /notificacao/:id/lida pelo gestor autorizado retorna 200',
        resLidaUbs1.status === 200,
        `HTTP ${resLidaUbs1.status}`
      );

      // 7. Verificar se o contador reduziu
      const resCountPosLida = await request('GET', '/api/gestor/notificacoes/nao-lidas-count', null, tokenUbs1);
      assert(
        'Contagem de não lidas decrementada após leitura do alerta',
        resCountPosLida.body.total === totalInicial,
        `Antes da leitura: ${totalInicial + 1} — Após leitura: ${resCountPosLida.body.total}`
      );

      // Verificar se a notificação na lista agora retorna lida = true
      const resListaPosLida = await request('GET', '/api/gestor/notificacoes', null, tokenUbs1);
      const notifLida = resListaPosLida.body.find(n => n.id === novaNotif.id);
      assert(
        'Notificação atualizada na lista com status lida = true',
        notifLida && notifLida.lida === true,
        `Lida: ${notifLida ? notifLida.lida : 'não encontrada'}`
      );
    }

    // 8. Testar a leitura em lote (Marcar todas como lidas)
    // Primeiro cria outra notificação operacional disparando outro caso de vigilância
    await request('POST', '/api/gestor/vigilancia', {
      agravo: 'Gripe A',
      bairro: 'Jardim Florido',
    }, tokenUbs1);

    const resCountAntesLote = await request('GET', '/api/gestor/notificacoes/nao-lidas-count', null, tokenUbs1);
    assert(
      'Contagem re-incrementada após nova notificação',
      resCountAntesLote.body.total > 0,
      `Não lidas: ${resCountAntesLote.body.total}`
    );

    // Dispara a marcação em lote
    const resLote = await request('POST', '/api/gestor/notificacoes/marcar-todas-lidas', null, tokenUbs1);
    assert(
      'POST /notificacoes/marcar-todas-lidas retorna 200',
      resLote.status === 200,
      `HTTP ${resLote.status}`
    );

    // Verifica que o contador zerou
    const resCountPosLote = await request('GET', '/api/gestor/notificacoes/nao-lidas-count', null, tokenUbs1);
    assert(
      'Contagem de não lidas zerada após marcação em lote',
      resCountPosLote.body.total === 0,
      `Total: ${resCountPosLote.body.total}`
    );

  } catch (err) {
    console.error('💥 Falha inesperada durante execução dos testes:', err);
    process.exit(1);
  }

  // Relatório Final
  const total = resultados.length;
  const passou = resultados.filter(r => r.passou).length;
  const falhou = total - passou;

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  RESULTADO FINAL: ${passou}/${total} testes passaram — ${falhou} falha(s)`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (falhou > 0) {
    console.log('\n  Falhas detalhadas:');
    resultados.filter(r => !r.passou).forEach(r => {
      console.log(`    ❌ ${r.nome} — ${r.detalhe}`);
    });
    process.exit(1);
  } else {
    console.log('\n  🎉 Todos os testes de contrato e integração passaram com sucesso.');
    process.exit(0);
  }
}

rodarTestes().catch(err => {
  console.error('\n💥 Erro fatal no script de testes:', err.message);
  process.exit(1);
});
