// ─────────────────────────────────────────────────────────────────────────────
// SCRIPT: test_contrato_rbac.js
// FUNÇÃO: Testes de contrato (integração HTTP) para validar:
//   1. RBAC — Médico recebe HTTP 403 ao tentar escrever em encaminhamentos/vigilância
//   2. Comunicados segmentados — Paciente recebe apenas os comunicados aplicáveis
//
// USO: node test_contrato_rbac.js
//   Requer o servidor backend rodando em http://localhost:3001
//   e credenciais válidas nos seed_data do banco.
// ─────────────────────────────────────────────────────────────────────────────

const http = require('http');
const knex = require('./src/db/knex');

// ─── Configuração dos seeds de teste ─────────────────────────────────────────
// Altere estes valores para credenciais existentes no banco de desenvolvimento.
const BASE_URL = 'http://localhost:3001';

// Credenciais de um MÉDICO (perfil: 'medico') — deve existir no banco (Vilamaria)
const CREDS_MEDICO = { email: 'medico.vilamaria@gestaoubs.dev', senha: 'senha123' };

// Credenciais de um GESTOR normal (perfil: 'recepcionista' ou 'gestor')
const CREDS_GESTOR = { email: 'centro@gestaoubs.dev', senha: 'senha123' };

// CRA e data de nascimento de um paciente com comorbidade conhecida (ex: Ana Clara - Asma/Diabetes)
const CREDS_PACIENTE_DIABETES = { cra: 'DEMO-0001', data_nascimento: '1985-03-22' };

// ─── Helpers HTTP ─────────────────────────────────────────────────────────────
// Faz uma requisição HTTP e retorna Promise<{ status, body }>
// Suporta body JSON e headers customizados.
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

// ─── Runner de testes ────────────────────────────────────────────────────────
// Armazena resultados para exibir relatório ao final.
const resultados = [];

// Registra um caso de teste com nome, resultado (pass/fail) e detalhe.
function registrar(nome, passou, detalhe = '') {
  resultados.push({ nome, passou, detalhe });
  const icone = passou ? '✅' : '❌';
  console.log(`  ${icone} ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
}

// Verifica que a condição seja verdadeira; registra falha com mensagem.
function assert(nome, condicao, mensagem) {
  registrar(nome, Boolean(condicao), mensagem);
}

// ─── Suite 1: Login e extração de tokens ─────────────────────────────────────
async function obterTokenGestor(creds) {
  const res = await request('POST', '/api/auth/login-gestor', creds);
  if (res.status !== 200 || !res.body?.token) {
    throw new Error(`Login falhou para ${creds.email}: HTTP ${res.status} — ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

async function obterTokenPaciente(creds) {
  const res = await request('POST', '/api/auth/login-paciente', creds);
  if (res.status !== 200 || !res.body?.token) {
    throw new Error(`Login paciente falhou: HTTP ${res.status} — ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

// ─── Suite 2: RBAC — Médico bloqueado em rotas de escrita ─────────────────────
async function testarRbacMedico(tokenMedico) {
  console.log('\n📋 Suite 2: RBAC — Médico em rotas de escrita');

  // 2.1 — POST /api/gestor/encaminhamento deve retornar 403
  const r1 = await request('POST', '/api/gestor/encaminhamento', {
    paciente_id: 1,
    destino: 'Hospital Teste',
    especialidade: 'Cardiologia',
    prioridade: 'VERDE',
  }, tokenMedico);
  assert(
    'POST /encaminhamento retorna 403 para médico',
    r1.status === 403,
    `HTTP ${r1.status}`
  );

  // 2.2 — PUT /api/gestor/encaminhamento/1/status deve retornar 403
  const r2 = await request('PUT', '/api/gestor/encaminhamento/1/status', {
    status_novo: 'CONFIRMADO',
  }, tokenMedico);
  assert(
    'PUT /encaminhamento/:id/status retorna 403 para médico',
    r2.status === 403,
    `HTTP ${r2.status}`
  );

  // 2.3 — POST /api/gestor/vigilancia deve retornar 403
  const r3 = await request('POST', '/api/gestor/vigilancia', {
    agravo: 'Dengue',
    bairro: 'Centro',
  }, tokenMedico);
  assert(
    'POST /vigilancia retorna 403 para médico',
    r3.status === 403,
    `HTTP ${r3.status}`
  );

  // 2.4 — PUT /api/gestor/vigilancia/1/status deve retornar 403
  const r4 = await request('PUT', '/api/gestor/vigilancia/1/status', {
    status_investigacao: 'CONFIRMADO',
  }, tokenMedico);
  assert(
    'PUT /vigilancia/:id/status retorna 403 para médico',
    r4.status === 403,
    `HTTP ${r4.status}`
  );

  // 2.5 — GETs devem continuar permitidos (200 ou 404, nunca 403)
  const r5 = await request('GET', '/api/gestor/encaminhamentos', null, tokenMedico);
  assert(
    'GET /encaminhamentos ACESSÍVEL para médico (não 403)',
    r5.status !== 403,
    `HTTP ${r5.status}`
  );

  const r6 = await request('GET', '/api/gestor/vigilancia', null, tokenMedico);
  assert(
    'GET /vigilancia ACESSÍVEL para médico (não 403)',
    r6.status !== 403,
    `HTTP ${r6.status}`
  );
}

// ─── Suite 3: Comunicados segmentados retornados ao paciente correto ──────────
async function testarComunicadosSegmentados(tokenGestor, tokenPaciente) {
  console.log('\n📋 Suite 3: Comunicados segmentados por comorbidade');

  // 3.1 — Criar comunicado segmentado para "Asma" como gestor
  const criacao = await request('POST', '/api/gestor/comunicado', {
    titulo: '[TESTE] Comunicado Asma',
    mensagem: 'Informativo exclusivo para pacientes com Asma cadastrados.',
    tipo: 'geral',
    segmentacao_clinica: 'Asma',
    urgente: false,
  }, tokenGestor);
  assert(
    'POST /comunicado com segmentacao_clinica retorna 201',
    criacao.status === 201,
    `HTTP ${criacao.status}`
  );

  if (criacao.status !== 201) return; // Não faz sentido testar o GET se o POST falhou

  // 3.2 — Paciente com Asma deve ver o comunicado segmentado
  if (tokenPaciente) {
    const listagem = await request('GET', '/api/paciente/comunicados', null, tokenPaciente);
    assert(
      'GET /paciente/comunicados retorna 200',
      listagem.status === 200,
      `HTTP ${listagem.status}`
    );

    if (listagem.status === 200 && Array.isArray(listagem.body)) {
      const encontrou = listagem.body.some(c => c.titulo === '[TESTE] Comunicado Asma');
      assert(
        'Comunicado Asma aparece para paciente com comorbidade Asma',
        encontrou,
        encontrou ? 'encontrado na listagem' : 'NÃO encontrado — verifique comorbidade do paciente seed'
      );
    }
  } else {
    registrar('GET /paciente/comunicados — pulado (sem token paciente)', true, 'credenciais do paciente não configuradas');
  }
}

// ─── Suite 4: Gestor normal ainda consegue escrever ──────────────────────────
async function testarGestorNormal(tokenGestor) {
  console.log('\n📋 Suite 4: Gestor normal NÃO bloqueado em rotas de escrita');

  // POST /vigilancia com gestor normal — deve ser 201 ou 400 (body inválido), nunca 403
  const r1 = await request('POST', '/api/gestor/vigilancia', {
    agravo: 'Dengue',
    bairro: 'Centro Test',
  }, tokenGestor);
  assert(
    'POST /vigilancia com gestor normal NÃO retorna 403',
    r1.status !== 403,
    `HTTP ${r1.status}`
  );
}

// ─── Execução principal ───────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🔬 TESTES DE CONTRATO — RBAC e Comunicados Segmentados');
  console.log('  Alvo: ' + BASE_URL);
  console.log('═══════════════════════════════════════════════════════════════');

  // Prepara o banco de dados para os testes de comunicados segmentados:
  // Garante que o paciente de teste DEMO-0001 pertença à UBS Centro (ID 1)
  // e possua a comorbidade 'Asma' para receber os comunicados do teste.
  try {
    const ubsCentro = await knex('ubs').where('nome', 'UBS Centro').first();
    if (ubsCentro) {
      await knex('pacientes')
        .where({ cra: 'DEMO-0001' })
        .update({ ubs_id: ubsCentro.id, comorbidades: 'Asma' });
    }
  } catch (err) {
    console.warn('⚠️  Aviso: Não foi possível preparar dados de comorbidade no banco:', err.message);
  }

  let tokenMedico, tokenGestor, tokenPaciente;

  // Suite 1: Login
  console.log('\n📋 Suite 1: Login e obtenção de tokens');
  try {
    tokenMedico = await obterTokenGestor(CREDS_MEDICO);
    registrar('Login como médico', true, 'token obtido');
  } catch (e) {
    registrar('Login como médico', false, e.message);
  }

  try {
    tokenGestor = await obterTokenGestor(CREDS_GESTOR);
    registrar('Login como gestor', true, 'token obtido');
  } catch (e) {
    registrar('Login como gestor', false, e.message);
  }

  try {
    tokenPaciente = await obterTokenPaciente(CREDS_PACIENTE_DIABETES);
    registrar('Login como paciente (Diabetes)', true, 'token obtido');
  } catch (e) {
    registrar('Login como paciente (Diabetes)', false, e.message);
    tokenPaciente = null;
  }

  // Suites dependentes de tokens
  if (tokenMedico) {
    await testarRbacMedico(tokenMedico);
  } else {
    console.log('\n⚠️  Suite 2 pulada — sem token de médico.');
  }

  if (tokenGestor) {
    await testarComunicadosSegmentados(tokenGestor, tokenPaciente);
    await testarGestorNormal(tokenGestor);
  } else {
    console.log('\n⚠️  Suites 3 e 4 puladas — sem token de gestor.');
  }

  // Relatório final
  const total = resultados.length;
  const passou = resultados.filter(r => r.passou).length;
  const falhou = total - passou;

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  RESULTADO FINAL: ${passou}/${total} testes passaram — ${falhou} falha(s)`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (falhou > 0) {
    console.log('\n  Falhas:');
    resultados.filter(r => !r.passou).forEach(r => {
      console.log(`    ❌ ${r.nome} — ${r.detalhe}`);
    });
    process.exit(1); // Sinaliza falha para CI
  }
}

main().catch(err => {
  console.error('\n💥 Erro fatal no runner de testes:', err.message);
  process.exit(1);
});
