/**
 * PÁGINA: CadastroPaciente.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Formulário de auto-cadastro para munícipes de SJC.
 *         O cidadão escolhe sua UBS pelo bairro, preenche dados básicos e
 *         recebe um número de CRA gerado automaticamente.
 *
 * FLUXO:
 *   1. Seleciona a UBS pela região/bairro (lista carregada da API)
 *   2. Preenche nome, data de nascimento e contato
 *   3. Recebe o CRA na tela de confirmação
 *   4. Ja pode fazer login; a validacao presencial fica como etapa complementar
 *
 * LGPD:
 *   - CPF é opcional e armazenado apenas para identificação na UBS
 *   - Nenhum dado é exibido publicamente
 *   - Cadastro fica ativo imediatamente, com orientacao para validar documentos na UBS
 *
 * API:
 *   GET  /api/auth/ubs                 → lista UBSs ativas ordenadas por bairro
 *   POST /api/auth/cadastro-paciente   → cria o cadastro com acesso imediato
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

// Estados do formulário de múltiplas etapas
const ETAPA = {
  ESCOLHER_UBS:   1,
  DADOS_PESSOAIS: 2,
  CONFIRMACAO:    3,
};

export default function CadastroPaciente() {
  const [etapa, setEtapa] = useState(ETAPA.ESCOLHER_UBS);

  // ── Modo de Seleção ───────────────────────────────────────────────────────
  const [modoSelecao, setModoSelecao] = useState('busca_bairro'); // 'busca_bairro' | 'lista_completa'

  // ── Estado da lista de UBSs (lista completa) ──────────────────────────────
  const [ubsLista, setUbsLista] = useState([]);
  const [ubsLoading, setUbsLoading] = useState(true);
  const [ubsErro, setUbsErro] = useState('');
  const [buscaUbs, setBuscaUbs] = useState('');

  // ── Estado da busca por Bairro ────────────────────────────────────────────
  const [buscaBairroStr, setBuscaBairroStr] = useState('');
  const [bairroResultados, setBairroResultados] = useState([]);
  const [bairroLoading, setBairroLoading] = useState(false);

  // ── Formulário ────────────────────────────────────────────────────────────
  const [ubsSelecionada, setUbsSelecionada] = useState(null);
  const [form, setForm] = useState({
    nome:            '',
    data_nascimento: '',
    cpf:             '',
    telefone:        '',
    email:           '',
  });

  // ── Submissão ─────────────────────────────────────────────────────────────
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmacao, setConfirmacao] = useState(null); // { cra, nome, ubs }

  // Carrega a lista de UBSs ativas ao montar o componente
  useEffect(() => {
    setUbsLoading(true);
    api.get('/auth/ubs')
      .then(r => setUbsLista(r.data))
      .catch(() => setUbsErro('Não foi possível carregar as unidades de saúde.'))
      .finally(() => setUbsLoading(false));
  }, []);

  // Debounce para busca de bairro
  useEffect(() => {
    if (modoSelecao !== 'busca_bairro') return;
    
    if (buscaBairroStr.trim().length < 2) {
      setBairroResultados([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setBairroLoading(true);
      api.get(`/auth/buscar-bairro?q=${buscaBairroStr}`)
        .then(r => setBairroResultados(r.data))
        .catch(() => {})
        .finally(() => setBairroLoading(false));
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [buscaBairroStr, modoSelecao]);

  // Filtra UBSs em tempo real pela busca de bairro ou nome
  const ubsFiltradas = ubsLista.filter(u =>
    u.bairro.toLowerCase().includes(buscaUbs.toLowerCase()) ||
    u.nome.toLowerCase().includes(buscaUbs.toLowerCase())
  );

  const handleSelecionarUbs = (ubs) => {
    setUbsSelecionada(ubs);
    setEtapa(ETAPA.DADOS_PESSOAIS);
    setBuscaUbs('');
  };

  // Aplica máscara de data DD/MM/AAAA ao digitar no campo do formulário, removendo caracteres não numéricos
  const aplicarMascaraData = (value) => {
    let v = value.replace(/\D/g, ''); // Remove caracteres que não sejam dígitos
    if (v.length > 8) v = v.substring(0, 8); // Limita tamanho da data em DDMMAAAA
    if (v.length > 4) {
      v = `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4)}`;
    } else if (v.length > 2) {
      v = `${v.substring(0, 2)}/${v.substring(2)}`;
    }
    return v;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErro('');

    // Valida se o formato está preenchido completamente (10 caracteres)
    if (form.data_nascimento.length !== 10) {
      setErro('Por favor, informe a data de nascimento completa no formato DD/MM/AAAA.');
      setEnviando(false);
      return;
    }

    try {
      // Converte data de nascimento de DD/MM/AAAA para YYYY-MM-DD exigido pelas tabelas do PostgreSQL
      const [dia, mes, ano] = form.data_nascimento.split('/');
      const dataNascimentoISO = `${ano}-${mes}-${dia}`;

      const res = await api.post('/auth/cadastro-paciente', {
        ...form,
        data_nascimento: dataNascimentoISO,
        ubs_id: ubsSelecionada.id,
        bairro: ubsSelecionada.bairro,
      });
      setConfirmacao(res.data);
      setEtapa(ETAPA.CONFIRMACAO);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center p-4 text-on-surface">

      {/* ── Logo ── */}
      <div className="w-full max-w-lg mb-6 text-center">
        <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-on-background">Gestão Saúde</h1>
        <p className="text-on-surface-variant text-sm font-medium">Cadastro de Paciente — São José dos Campos</p>
      </div>

      {/* ── Indicador de etapas ── */}
      <div className="w-full max-w-lg flex items-center gap-2 mb-6 px-1">
        {[
          { num: 1, label: 'Escolher UBS' },
          { num: 2, label: 'Seus dados' },
          { num: 3, label: 'Confirmação' },
        ].map((item, idx) => (
          <div key={item.num} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${etapa >= item.num ? 'text-primary' : 'text-on-surface-variant'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                etapa > item.num  ? 'bg-primary text-white' :
                etapa === item.num ? 'bg-primary text-white ring-4 ring-primary/20' :
                'bg-surface-container-high text-on-surface-variant'
              }`}>
                {etapa > item.num
                  ? <span className="material-symbols-outlined text-sm">check</span>
                  : item.num}
              </div>
              <span className="text-xs font-bold hidden sm:block">{item.label}</span>
            </div>
            {/* Linha conectora entre etapas */}
            {idx < 2 && <div className={`flex-1 h-0.5 mx-2 ${etapa > item.num ? 'bg-primary' : 'bg-surface-variant'}`} />}
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ETAPA 1 — Escolher a UBS pelo bairro
          ════════════════════════════════════════════════════════════════════ */}
      {etapa === ETAPA.ESCOLHER_UBS && (
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-md overflow-hidden">
          {modoSelecao === 'busca_bairro' ? (
            // ── MODO 1: Busca por Bairro (Padrão) ──
            <>
              <div className="p-6 border-b border-surface-variant">
                <h2 className="text-lg font-extrabold text-on-background">Qual é o seu bairro?</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Digite seu bairro para encontrarmos a UBS que atende sua região.
                </p>
              </div>

              <div className="p-4 border-b border-surface-variant">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
                  <input
                    type="text"
                    placeholder="Digite seu bairro..."
                    value={buscaBairroStr}
                    onChange={e => setBuscaBairroStr(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-surface-container-high rounded-xl outline-none font-medium text-sm border-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-[50vh] overflow-y-auto divide-y divide-surface-variant">
                {bairroLoading ? (
                  Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="h-4 bg-surface-container-high rounded w-3/4 mb-2" />
                      <div className="h-3 bg-surface-container-high rounded w-1/2" />
                    </div>
                  ))
                ) : buscaBairroStr.trim().length < 2 ? (
                  <div className="p-10 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-3 opacity-30">location_on</span>
                    <p className="font-semibold text-sm">Digite pelo menos 2 letras do seu bairro</p>
                  </div>
                ) : bairroResultados.length > 0 ? (
                  bairroResultados.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelecionarUbs({
                        id: item.ubs_id,
                        nome: item.ubs_nome,
                        bairro: item.bairro, // usamos o bairro encontrado como o bairro do paciente
                        endereco: item.ubs_endereco,
                        telefone: item.ubs_telefone
                      })}
                      className="w-full p-4 text-left hover:bg-primary/5 transition-colors flex items-start gap-3 group"
                    >
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 mt-0.5">
                        <span className="material-symbols-outlined text-primary text-lg">location_city</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-background text-sm leading-tight">{item.bairro}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
                          → atendido pela <span className="font-bold">{item.ubs_nome}</span>
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-xl flex-shrink-0 mt-1">chevron_right</span>
                    </button>
                  ))
                ) : (
                  <div className="p-10 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-3 opacity-30">search_off</span>
                    <p className="font-semibold text-sm mb-3">Bairro não encontrado.</p>
                    <button onClick={() => setModoSelecao('lista_completa')} className="text-primary font-bold text-sm underline">
                      Ver lista completa →
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // ── MODO 2: Lista Completa (Fallback) ──
            <>
              <div className="p-4 bg-surface-container-high border-b border-surface-variant flex items-center">
                <button 
                  onClick={() => setModoSelecao('busca_bairro')}
                  className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Buscar pelo meu bairro
                </button>
              </div>

              <div className="p-6 border-b border-surface-variant">
                <h2 className="text-lg font-extrabold text-on-background">Lista de Unidades de Saúde</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Selecione manualmente a UBS mais próxima de você.
                </p>
              </div>

              {/* Campo de busca por nome na lista completa */}
              <div className="p-4 border-b border-surface-variant">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
                  <input
                    type="text"
                    placeholder="Digite o nome da UBS..."
                    value={buscaUbs}
                    onChange={e => setBuscaUbs(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-surface-container-high rounded-xl outline-none font-medium text-sm border-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Lista de UBSs */}
              <div className="max-h-[50vh] overflow-y-auto divide-y divide-surface-variant">
                {ubsLoading ? (
                  Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="h-4 bg-surface-container-high rounded w-3/4 mb-2" />
                      <div className="h-3 bg-surface-container-high rounded w-1/2" />
                    </div>
                  ))
                ) : ubsErro ? (
                  <div className="p-8 text-center">
                    <p className="text-red-600 font-semibold text-sm mb-3">{ubsErro}</p>
                    <button onClick={() => window.location.reload()} className="text-primary font-bold text-sm underline">
                      Tentar novamente
                    </button>
                  </div>
                ) : ubsFiltradas.length > 0 ? (
                  ubsFiltradas.map(ubs => (
                    <button
                      key={ubs.id}
                      onClick={() => handleSelecionarUbs(ubs)}
                      className="w-full p-4 text-left hover:bg-primary/5 transition-colors flex items-start gap-3 group"
                    >
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 mt-0.5">
                        <span className="material-symbols-outlined text-primary text-lg">local_hospital</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-background text-sm leading-tight">{ubs.nome}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
                          {ubs.bairro} — {ubs.endereco}
                        </p>
                        {ubs.telefone && (
                          <p className="text-xs text-on-surface-variant mt-0.5">{ubs.telefone}</p>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-xl flex-shrink-0 mt-1">chevron_right</span>
                    </button>
                  ))
                ) : (
                  <div className="p-10 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-3 opacity-30">search_off</span>
                    <p className="font-semibold text-sm">Nenhuma unidade encontrada para "{buscaUbs}"</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          ETAPA 2 — Dados pessoais
          ════════════════════════════════════════════════════════════════════ */}
      {etapa === ETAPA.DADOS_PESSOAIS && ubsSelecionada && (
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-surface-variant">
            {/* Resumo da UBS escolhida */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">local_hospital</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wide">Unidade selecionada</p>
                <p className="font-extrabold text-on-background text-sm leading-tight">{ubsSelecionada.nome}</p>
              </div>
              {/* Botão para voltar e trocar a UBS */}
              <button
                onClick={() => setEtapa(ETAPA.ESCOLHER_UBS)}
                className="ml-auto text-xs text-primary font-bold hover:underline flex-shrink-0"
              >
                Trocar
              </button>
            </div>
            <h2 className="text-lg font-extrabold text-on-background">Seus dados</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">Preencha com seus dados reais para a equipe da UBS validar.</p>
          </div>

          {erro && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl p-3">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Nome completo */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface-variant">Nome completo*</label>
              <input
                required
                type="text"
                value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Maria da Silva Santos"
                className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium"
              />
            </div>

            {/* Data de nascimento */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface-variant">Data de nascimento*</label>
              <input
                required
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="Ex: 25/10/1995"
                value={form.data_nascimento}
                onChange={e => setForm(p => ({ ...p, data_nascimento: aplicarMascaraData(e.target.value) }))}
                className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium"
              />
              {/* Aviso: data de nascimento é usada no login junto com o CRA */}
              <p className="text-xs text-on-surface-variant">Guarde esta data — ela será usada para entrar no sistema.</p>
            </div>

            {/* Telefone e CPF em duas colunas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-on-surface-variant">Celular</label>
                <input
                  type="tel"
                  value={form.telefone}
                  onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                  placeholder="(12) 99999-9999"
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-on-surface-variant">CPF (opcional)</label>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium"
                />
              </div>
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface-variant">E-mail (opcional)</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="seu@email.com"
                className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium"
              />
            </div>

            {/* Aviso sobre acesso imediato e validacao presencial */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <span className="material-symbols-outlined text-amber-600 text-lg flex-shrink-0">info</span>
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                Após o cadastro, você já poderá entrar no portal. Para validar seus documentos,
                agende uma visita à {ubsSelecionada.nome} e leve um documento com foto e comprovante de residência.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setEtapa(ETAPA.ESCOLHER_UBS)}
                className="flex-1 h-12 rounded-2xl border border-outline font-bold text-sm"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Solicitar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          ETAPA 3 — Confirmação com o CRA gerado
          ════════════════════════════════════════════════════════════════════ */}
      {etapa === ETAPA.CONFIRMACAO && confirmacao && (
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-md overflow-hidden">
          {/* Cabeçalho verde de sucesso */}
          <div className="bg-emerald-500 p-6 text-white text-center">
            <span className="material-symbols-outlined text-5xl block mb-2">check_circle</span>
            <h2 className="text-xl font-extrabold">Cadastro realizado com sucesso!</h2>
            <p className="text-emerald-100 text-sm mt-1">Olá, {confirmacao.nome.split(' ')[0]}!</p>
          </div>

          <div className="p-6 space-y-5">
            {/* CRA em destaque — o paciente precisa anotar */}
            <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5 text-center">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">
                Seu número de CRA
              </p>
              <p className="text-4xl font-extrabold text-primary tracking-widest">{confirmacao.cra}</p>
              <p className="text-xs text-on-surface-variant mt-2 font-medium">
                Anote este número — ele é necessário para entrar no sistema.
              </p>
            </div>

            {/* Próximos passos */}
            <div className="space-y-3">
              <p className="font-bold text-on-background text-sm">Próximos passos:</p>
              <p className="text-sm text-on-surface font-medium leading-relaxed">
                Você já pode acessar o sistema com seu CRA e data de nascimento. Para validar seus documentos, agende uma visita à sua UBS.
              </p>

              {[
                { icon: 'save',            text: `Anote seu CRA: ${confirmacao.cra}` },
                { icon: 'badge',           text: 'Leve um documento de identidade (RG ou CPF) à unidade' },
                { icon: 'local_hospital',  text: `Vá à ${confirmacao.ubs}` },
                { icon: 'lock_open',       text: 'Entre no portal agora usando o CRA e sua data de nascimento' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-base">{item.icon}</span>
                  </div>
                  <p className="text-sm text-on-surface font-medium leading-relaxed mt-1">{item.text}</p>
                </div>
              ))}
            </div>

            <Link
              to="/login-paciente"
              className="block w-full h-12 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center text-sm"
            >
              Acessar agora
            </Link>
          </div>
        </div>
      )}

      {/* Link de volta ao login */}
      {etapa !== ETAPA.CONFIRMACAO && (
        <p className="text-on-surface-variant text-sm font-medium mt-6">
          Já tem cadastro?{' '}
          <Link to="/login-paciente" className="text-primary font-bold hover:underline">
            Entrar no portal
          </Link>
        </p>
      )}
    </div>
  );
}
