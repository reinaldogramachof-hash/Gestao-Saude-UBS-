// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: EncaminhamentosExterna
// FUNÇÃO: Painel de gerenciamento e controle do fluxo da fila de regulação
//         pela unidade parceira externa. Permite triagem de encaminhamentos,
//         ordenação clínica inteligente, agendamentos com guias de preparo
//         clínico automatizados, consulta rápida ao prontuário do paciente (LGPD)
//         e envio de retornos (feedbacks de conclusão) para a UBS.
// DESIGN: Usabilidade premium de alta fidelidade com abas deslizantes de ordenação,
//         badges de gravidade HSL pulsantes, alertas de SLA de inatividade de fila,
//         gaveta de prontuário físico digitalizado e modais rounded-[2rem] (Wow Factor).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import ExternaLayout from '../../components/externa/ExternaLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  TODOS:                  'Todos',
  AGUARDANDO_VAGA:        'Aguardando Recebimento',
  RECEBIDO:               'Recebidos (Para Agendar)',
  AGUARDANDO_CONFIRMACAO: 'Aguardando Paciente',
  AGENDADO:               'Agendados',
  CONFIRMADO_PACIENTE:    'Paciente confirmado',
  RETORNO_UBS:            'Concluídos'
};

const FEEDBACK_LABELS = {
  REALIZADO_SEM_INTERCORRENCIAS: 'Realizado sem intercorrências',
  REALIZADO_COM_INTERCORRENCIAS: 'Realizado com intercorrências',
  CANCELADO_AUSENCIA:            'Cancelado — ausência do paciente',
  CANCELADO_CONTRAINDICADO:      'Cancelado — contraindicado',
  NECESSITA_RETORNO:             'Necessita retorno',
  ENCAMINHAMENTO_ESPECIALIDADE:  'Encaminhado a especialidade',
  INTERNACAO_NECESSARIA:         'Internação necessária',
};

// Dicionário de estilos para badges de prioridades (Paleta HSL)
const PRIORIDADE_BADGE = {
  VERMELHO: 'bg-red-500/10 text-red-850 border border-red-500/20',
  AMARELO:  'bg-yellow-500/10 text-yellow-850 border border-yellow-500/20',
  VERDE:    'bg-emerald-500/10 text-emerald-850 border border-emerald-500/20',
};

const PRIORIDADE_CORES = {
  VERMELHO: 'bg-red-500',
  AMARELO:  'bg-yellow-400',
  VERDE:    'bg-emerald-500',
};

const PRIORIDADE_LABEL = {
  VERMELHO: 'Urgente',
  AMARELO:  'Preferencial',
  VERDE:    'Rotina',
};

// ── [NOVA FUNÇÃO] REGRAS DE PREPARO CLÍNICO AUTOMATIZADO POR PROCEDIMENTO ──
const obterPreparoClinico = (procedimento = '', especialidade = '') => {
  const nome = (procedimento + ' ' + especialidade).toLowerCase();

  if (nome.includes('endoscopia') || nome.includes('colonoscopia')) {
    return {
      instrucoes: 'Jejum absoluto de 8 horas (inclusive água). Dieta líquida sem resíduos no dia anterior. Obrigatório comparecer com acompanhante adulto (haverá sedação). Não dirigir nas 8h seguintes.',
      alerta: 'Risco de aspiração em caso de jejum incorreto.'
    };
  }
  if (nome.includes('ultrassonografia') || nome.includes('ultrassom') || nome.includes('usg')) {
    if (nome.includes('abdomen') || nome.includes('abdomem') || nome.includes('vias biliares')) {
      return {
        instrucoes: 'Jejum absoluto de 6 a 8 horas. Evitar bebidas gasosas e doces no dia anterior. Tomar 40 gotas de Luftal (dimeticona) 1h antes do exame.',
        alerta: 'Jejum necessário para correta avaliação da vesícula biliar.'
      };
    }
    return {
      instrucoes: 'Para exames pélvicos, obstétricos e vias urinárias: ingerir de 4 a 6 copos de água 1 hora antes do exame e não urinar (o exame exige bexiga cheia).',
      alerta: 'Bexiga cheia serve de janela acústica para as imagens.'
    };
  }
  if (nome.includes('ressonancia') || nome.includes('tomografia') || nome.includes('rm') || nome.includes('tc')) {
    return {
      instrucoes: 'Jejum absoluto de 4 horas. Comparecer com roupas confortáveis sem zíper ou botões metálicos. Retirar joias, piercings e relógios. Trazer exames anteriores da região.',
      alerta: 'Exames com contraste exigem função renal estável.'
    };
  }
  if (nome.includes('cardio') || nome.includes('eletrocardio') || nome.includes('holter') || nome.includes('mapa') || nome.includes('esforco')) {
    return {
      instrucoes: 'Vir com banho tomado (não usar cremes ou óleos no tórax). Trazer toalha de rosto (para teste de esforço). Evitar bebidas com cafeína ou energéticos nas 6h anteriores.',
      alerta: 'Cremes na pele impedem a aderência dos eletrodos do exame.'
    };
  }
  if (nome.includes('oftalmo') || nome.includes('olhos') || nome.includes('refracao')) {
    return {
      instrucoes: 'Não vir dirigindo veículos (haverá aplicação de colírio para dilatação de pupila). Trazer óculos atuais de grau se fizer uso.',
      alerta: 'A visão pode ficar embaçada por até 4 horas após o exame.'
    };
  }
  // Preparo geral padrão
  return {
    instrucoes: 'Comparecer com 15 minutos de antecedência. Apresentar documento de identificação original com foto, cartão do SUS e a guia física de encaminhamento da UBS.',
    alerta: 'Atrasos superiores a 10 minutos ensejarão perda da vaga.'
  };
};

export default function EncaminhamentosExterna() {
  const [encaminhamentos, setEncaminhamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  // Filtros Avançados e Busca
  const [busca, setBusca] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('TODAS');
  const [filtroUbs, setFiltroUbs] = useState('TODAS');

  // [NOVA FUNÇÃO] Ordenação Clínica Dinâmica da Fila
  const [ordenacao, setOrdenacao] = useState('prioridade');

  // Controle de cartões expandidos
  const [expandidoId, setExpandidoId] = useState(null);

  // Agendamento inline
  const [agendandoId, setAgendandoId] = useState(null);
  const [dataAgendamento, setDataAgendamento] = useState('');

  // Modal de Retorno Clínico
  const [retornoAberto, setRetornoAberto] = useState(false);
  const [encRetorno, setEncRetorno] = useState(null);
  const [retornoForm, setRetornoForm] = useState({ feedback_tipo: '', conduta: '' });
  const [enviandoRetorno, setEnviandoRetorno] = useState(false);

  // Gaveta/Drawer de Prontuário Seguro (LGPD)
  const [prontuarioAberto, setProntuarioAberto] = useState(false);
  const [pacienteProntuario, setPacienteProntuario] = useState(null);
  const [loadingProntuario, setLoadingProntuario] = useState(false);

  useEffect(() => {
    fetchEncaminhamentos();
  }, []);

  // Busca a listagem completa de encaminhamentos da unidade externa
  const fetchEncaminhamentos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/externa/encaminhamentos');
      setEncaminhamentos(data);
    } catch (err) {
      console.error('[EncaminhamentosExterna] Erro ao buscar dados:', err);
      toast.error('Erro ao carregar encaminhamentos.');
    } finally {
      setLoading(false);
    }
  };

  // Carrega os dados clínicos do prontuário do paciente (LGPD - visibilidade restrita)
  const abrirProntuario = async (e, pacienteId) => {
    e.stopPropagation();
    if (!pacienteId) {
      toast.error('Paciente não possui identificador clínico ativo.');
      return;
    }
    setLoadingProntuario(true);
    setPacienteProntuario(null);
    setProntuarioAberto(true);
    try {
      const { data } = await api.get(`/externa/paciente/${pacienteId}`);
      setPacienteProntuario(data);
    } catch (err) {
      console.error('[EncaminhamentosExterna] Erro ao carregar prontuário:', err);
      toast.error(err.response?.data?.error || 'Erro ao carregar dados clínicos.');
      setProntuarioAberto(false);
    } finally {
      setLoadingProntuario(false);
    }
  };

  // Bridge genérica para chamadas de status
  async function executarAcao(id, acao, payload = {}) {
    return api.put(`/externa/encaminhamento/${id}/${acao}`, payload);
  }

  // Confirma a recepção física do encaminhamento na clínica
  const confirmarRecebimento = async (id) => {
    try {
      await executarAcao(id, 'receber');
      toast.success('Encaminhamento recebido com sucesso!');
      fetchEncaminhamentos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar encaminhamento.');
    }
  };

  // Inicia o fluxo inline de agendamento
  const iniciarAgendamento = (e, enc) => {
    e.stopPropagation();
    setAgendandoId(enc.id);
    setDataAgendamento('');
  };

  // Salva o agendamento de data do procedimento
  const confirmarAgendamento = async (enc) => {
    if (!dataAgendamento) {
      toast.error('Informe a data do procedimento.');
      return;
    }
    try {
      await executarAcao(enc.id, 'agendar', { data_procedimento_unidade: dataAgendamento });
      toast.success('Encaminhamento agendado com sucesso!');
      fetchEncaminhamentos();
      setAgendandoId(null);
      setDataAgendamento('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao agendar encaminhamento.');
    }
  };

  // Abre o modal de retorno clínico para envio de conduta de volta para a UBS
  const abrirModalRetorno = (e, enc) => {
    e.stopPropagation();
    setEncRetorno(enc);
    setRetornoForm({ feedback_tipo: '', conduta: '' });
    setRetornoAberto(true);
  };

  // Envia a conduta clínica e encerra o fluxo do encaminhamento
  const enviarRetorno = async (e) => {
    e.preventDefault();
    if (!retornoForm.feedback_tipo) {
      toast.error('Selecione o resultado do procedimento.');
      return;
    }
    if (retornoForm.conduta.length < 10) {
      toast.error('A conduta/observação deve ter no mínimo 10 caracteres.');
      return;
    }
    setEnviandoRetorno(true);
    try {
      await executarAcao(encRetorno.id, 'concluir', {
        feedback_tipo:    retornoForm.feedback_tipo,
        feedback_conduta: retornoForm.conduta,
      });
      toast.success('Retorno clínico enviado à UBS com sucesso!');
      setRetornoAberto(false);
      fetchEncaminhamentos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar retorno.');
    } finally {
      setEnviandoRetorno(false);
    }
  };

  // Mapeamento dinâmico das UBSs de origem ativas na fila
  const ubssDisponiveis = [...new Set(encaminhamentos.map(e => e.ubs_nome).filter(Boolean))].sort();

  // ── REGRA DE FILTRAGEM COMBINADA (Status + Busca + Prioridade + UBS) ──
  const filtered = encaminhamentos.filter(e => {
    const bateStatus = filtroStatus === 'TODOS' || e.status === filtroStatus;
    const termo = busca.trim().toLowerCase();
    const bateBusca = !termo ||
      e.paciente_nome.toLowerCase().includes(termo) ||
      (e.paciente_cra && e.paciente_cra.toLowerCase().includes(termo));
    const batePrioridade = filtroPrioridade === 'TODAS' || e.prioridade === filtroPrioridade;
    const bateUbs = filtroUbs === 'TODAS' || e.ubs_nome === filtroUbs;
    return bateStatus && bateBusca && batePrioridade && bateUbs;
  });

  // ── [NOVA FUNÇÃO] REGRA DE ORDENAÇÃO DINÂMICA (Fila Inteligente) ──
  const sortedFiltered = [...filtered].sort((a, b) => {
    if (ordenacao === 'prioridade') {
      const peso = { VERMELHO: 1, AMARELO: 2, VERDE: 3 };
      const pesoA = peso[a.prioridade] || 4;
      const pesoB = peso[b.prioridade] || 4;
      if (pesoA !== pesoB) return pesoA - pesoB;
      return new Date(a.data_solicitacao) - new Date(b.data_solicitacao); // FIFO em caso de empate
    }
    if (ordenacao === 'antigos') {
      return new Date(a.data_solicitacao) - new Date(b.data_solicitacao); // FIFO (Fila clássica)
    }
    if (ordenacao === 'recentes') {
      return new Date(b.data_solicitacao) - new Date(a.data_solicitacao); // LIFO
    }
    if (ordenacao === 'nome') {
      return a.paciente_nome.localeCompare(b.paciente_nome, 'pt-BR');
    }
    return 0;
  });

  return (
    <ExternaLayout>
      {/* ── CABEÇALHO ── */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">
          Fila de Atendimento
        </h1>
        <p className="text-on-surface-variant font-medium mt-1 text-sm md:text-base">
          Triagem de demandas, agendamentos com guias de preparo e retornos clínicos integrados.
        </p>
      </div>

      {/* ── CHIPS DE FILTRO RÁPIDO DE STATUS ── */}
      <div className="flex gap-2 overflow-x-auto pb-3.5 mb-6 border-b border-surface-variant/40 animate-slide-up no-scrollbar">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFiltroStatus(key)}
            className={`px-4.5 py-2.5 rounded-2xl font-extrabold text-xs whitespace-nowrap transition-all border active:scale-[0.98] ${
              filtroStatus === key
                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-102'
                : 'bg-surface-container-lowest text-on-surface-variant border-surface-variant/70 hover:bg-surface-container-low hover:text-on-background'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── BARRA DE BUSCA E FILTROS AVANÇADOS ── */}
      <div className="bg-surface-container-lowest border border-surface-variant/45 p-4 rounded-3xl mb-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-up">
        <div className="relative md:col-span-2">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            placeholder="Buscar por paciente ou CRA..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 h-12 bg-surface-container-high/60 border border-surface-variant/20 rounded-2xl text-sm font-semibold placeholder-on-surface-variant/50 outline-none focus:border-primary/45 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/10 transition-all"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-background">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
        <div>
          <select
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
            className="w-full px-4 py-2.5 h-12 bg-surface-container-high/60 border border-surface-variant/20 rounded-2xl text-sm font-bold text-on-surface-variant outline-none focus:border-primary/45 focus:bg-surface-container-lowest transition-all"
          >
            <option value="TODAS">Prioridade: Todas</option>
            <option value="VERMELHO">Vermelho (Urgente)</option>
            <option value="AMARELO">Amarelo (Preferencial)</option>
            <option value="VERDE">Verde (Rotina)</option>
          </select>
        </div>
        <div>
          <select
            value={filtroUbs}
            onChange={(e) => setFiltroUbs(e.target.value)}
            className="w-full px-4 py-2.5 h-12 bg-surface-container-high/60 border border-surface-variant/20 rounded-2xl text-sm font-bold text-on-surface-variant outline-none focus:border-primary/45 focus:bg-surface-container-lowest transition-all"
          >
            <option value="TODAS">UBS Origem: Todas</option>
            {ubssDisponiveis.map(nome => (
              <option key={nome} value={nome}>{nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── [NOVA FUNÇÃO] ABAS DE ORDENAÇÃO DINÂMICA ── */}
      <div className="flex items-center gap-2 mb-6 bg-surface-container-low/45 border border-surface-variant/25 p-1.5 rounded-2xl self-start w-max max-w-full overflow-x-auto no-scrollbar animate-slide-up">
        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider pl-3.5 pr-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">sort</span>
          Ordenar por:
        </span>
        {[
          { id: 'prioridade', label: 'Gravidade Clínica' },
          { id: 'antigos',    label: 'Mais Antigos (SUS)' },
          { id: 'recentes',   label: 'Mais Recentes' },
          { id: 'nome',       label: 'Nome Paciente' },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setOrdenacao(opt.id)}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-[11px] whitespace-nowrap transition-all ${
              ordenacao === opt.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-background hover:bg-surface-container-low'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── GRID/LISTAGEM DE ENCAMINHAMENTOS ── */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-surface-container-high/50 rounded-3xl border border-surface-variant/20"></div>)}
        </div>
      ) : sortedFiltered.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest border border-surface-variant/45 rounded-3xl shadow-sm animate-fade-in max-w-lg mx-auto">
          <span className="material-symbols-outlined text-on-surface-variant/50 text-5xl mb-3">inbox</span>
          <p className="text-sm font-bold text-on-surface-variant">Nenhum encaminhamento localizado para a busca.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-slide-up">
          {sortedFiltered.map(enc => {
            const isExpandido = expandidoId === enc.id;
            const prioridade = enc.prioridade;
            const status = enc.status;

            // Alerta de SLA: Fila ociosa sem agendamento há mais de 5 dias
            const diasInativo = enc.data_solicitacao ? Math.floor((new Date() - new Date(enc.data_solicitacao)) / (1000 * 60 * 60 * 24)) : 0;
            const isSlaAtrasado = status === 'RECEBIDO' && diasInativo >= 5;

            // Determina cor de destaque da borda lateral com base na prioridade
            const prioridadeBorda =
              prioridade === 'VERMELHO' ? 'border-l-[6px] border-l-red-500 border-red-500/10 shadow-red-500/[0.02]' :
              prioridade === 'AMARELO'  ? 'border-l-[6px] border-l-yellow-400 border-yellow-500/10 shadow-yellow-500/[0.02]' :
              'border-l-[6px] border-l-green-500 border-emerald-500/10 shadow-emerald-500/[0.02]';

            // Preparo clínico sugerido de forma inteligente
            const preparoObj = obterPreparoClinico(enc.catalogo_nome, enc.especialidade);

            return (
              <div
                key={enc.id}
                onClick={() => setExpandidoId(isExpandido ? null : enc.id)}
                className={`bg-surface-container-lowest p-5 rounded-3xl border shadow-sm flex flex-col gap-4 hover:shadow-md hover:border-primary/20 transition-all duration-250 cursor-pointer ${prioridadeBorda}`}
              >
                {/* Linha 1: Nome, CRA, Procedimento e Badges de Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-on-background text-base md:text-lg">{enc.paciente_nome}</h3>
                      <span className="text-xs font-bold font-mono bg-surface-container-high px-2 py-0.5 rounded-lg text-on-surface-variant border border-surface-variant/40">
                        CRA {enc.paciente_cra || 'S/CRA'}
                      </span>
                    </div>

                    <p className="text-sm text-on-background font-extrabold mt-2">
                      Procedimento: <span className="text-primary">{enc.catalogo_nome || enc.especialidade}</span>
                    </p>

                    <p className="text-xs text-on-surface-variant font-semibold mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-on-surface-variant/60">location_on</span>
                      UBS Origem: <span className="font-bold text-on-background/75">{enc.ubs_nome || enc.ubs_origem || 'UBS'}</span>
                    </p>
                  </div>

                  {/* Badges do Lado Direito */}
                  <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    {/* Botão de Consulta Clínica Prontuário Seguro (LGPD) */}
                    <button
                      onClick={(e) => abrirProntuario(e, enc.paciente_id)}
                      title="Consultar Prontuário Rápido Seguro"
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary hover:scale-105 transition-all flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
                    </button>

                    {/* Badge de Prioridade Translúcido com bolinha */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${PRIORIDADE_BADGE[prioridade] || 'bg-surface-variant/10 text-on-surface border'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${PRIORIDADE_CORES[prioridade] || 'bg-on-surface/50'} ${prioridade === 'VERMELHO' ? 'animate-pulse' : ''}`} />
                      {PRIORIDADE_LABEL[prioridade] || prioridade}
                    </span>

                    {/* [NOVA FUNÇÃO] Alerta de SLA de Tempo de Espera */}
                    {isSlaAtrasado && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-800 border border-yellow-500/20 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        Agendamento Atrasado (+5 dias)
                      </span>
                    )}

                    {/* Status Translúcidos */}
                    {status === 'AGUARDANDO_VAGA' && <span className="px-3 py-1 text-xs font-black rounded-full bg-orange-500/10 text-orange-850 border border-orange-500/15">Aguardando Receb.</span>}
                    {status === 'RECEBIDO' && <span className="px-3 py-1 text-xs font-black rounded-full bg-blue-500/10 text-blue-850 border border-blue-500/15">Recebido</span>}
                    {status === 'AGUARDANDO_CONFIRMACAO' && <span className="px-3 py-1 text-xs font-black rounded-full bg-surface-variant/20 text-on-surface-variant border border-surface-variant/30">Aguardando Confirm.</span>}
                    {status === 'AGENDADO' && <span className="px-3 py-1 text-xs font-black rounded-full bg-purple-500/10 text-purple-850 border border-purple-500/15">Agendado</span>}
                    {enc.status === 'CONFIRMADO_PACIENTE' && <span className="px-3 py-1 text-xs font-black rounded-full bg-teal-500/10 text-teal-850 border border-teal-500/15">Paciente Confirmado</span>}
                    {status === 'RETORNO_UBS' && <span className="px-3 py-1 text-xs font-black rounded-full bg-emerald-500/10 text-emerald-850 border border-emerald-500/15">Concluído ✓</span>}
                  </div>
                </div>

                {/* Linha 2: Justificativas da UBS (Exposto no click do card) */}
                {isExpandido && (
                  <div className="pt-4 border-t border-surface-variant/40 space-y-3 text-xs animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 bg-surface-container-low/60 rounded-2xl border border-surface-variant/30">
                      <p className="font-extrabold text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">psychiatry</span>
                        Justificativa Clínica da UBS:
                      </p>
                      <p className="text-on-background font-medium leading-relaxed italic text-sm">
                        "{enc.observacoes || 'Nenhuma justificativa clínica fornecida pela UBS.'}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-on-surface-variant font-semibold pl-1">
                      <p className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        Solicitado em: <strong>{enc.data_solicitacao ? new Date(enc.data_solicitacao).toLocaleDateString('pt-BR') : 'N/I'}</strong>
                      </p>
                      {enc.data_procedimento_unidade && (
                        <p className="text-primary font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">event_available</span>
                          Procedimento agendado para: <strong>{new Date(enc.data_procedimento_unidade).toLocaleDateString('pt-BR')}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Linha 3: Ações e Botões de Operação no Rodapé do Card */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3.5 border-t border-surface-variant/30" onClick={(e) => e.stopPropagation()}>
                  <div className="text-xs text-on-surface-variant/80 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">info</span>
                    {status === 'RETORNO_UBS' && enc.feedback_tipo ? (
                      <span>Resultado enviado: <strong>{FEEDBACK_LABELS[enc.feedback_tipo] || enc.feedback_tipo}</strong></span>
                    ) : status === 'AGUARDANDO_CONFIRMACAO' ? (
                      <span>Notificação enviada ao paciente. Aguardando confirmação.</span>
                    ) : (
                      <span>Clique no cartão para {isExpandido ? 'ocultar' : 'visualizar'} a justificativa clínica da UBS.</span>
                    )}
                  </div>

                  <div className="w-full sm:w-auto flex justify-end">
                    {/* Ação 1: Confirmar Recebimento */}
                    {status === 'AGUARDANDO_VAGA' && (
                      <button
                        onClick={() => confirmarRecebimento(enc.id)}
                        className="w-full sm:w-auto px-5 py-2.5 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-650/15 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                      >
                        <span className="material-symbols-outlined text-base font-bold">check_circle</span>
                        Confirmar Recebimento
                      </button>
                    )}

                    {/* Ação 2: Agendar Procedimento (Inline com Guia Rápido de Preparo Clínico) */}
                    {status === 'RECEBIDO' && (
                      agendandoId === enc.id ? (
                        <div className="flex flex-col gap-3.5 w-full max-w-md animate-fadeIn">
                          {/* [NOVA FUNÇÃO] Card Informativo de Preparo Clínico */}
                          <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 text-xs space-y-2">
                            <div className="flex items-start gap-2 text-amber-900 font-extrabold uppercase tracking-wider">
                              <span className="material-symbols-outlined text-sm mt-0.5">menu_book</span>
                              <span>Guia de Preparo Clínico Recomendado</span>
                            </div>
                            <p className="text-on-surface-variant font-medium leading-relaxed pl-6">
                              {preparoObj.instrucoes}
                            </p>
                            <div className="flex items-center gap-1 pl-6 text-[10px] font-bold text-red-700">
                              <span className="material-symbols-outlined text-xs">report</span>
                              <span>Aviso técnico: {preparoObj.alerta}</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                            <input
                              type="date"
                              value={dataAgendamento}
                              onChange={(e) => setDataAgendamento(e.target.value)}
                              className="px-3.5 py-2 h-11 bg-surface-container-high/80 border border-surface-variant/35 rounded-xl text-xs font-semibold outline-none focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/15 transition-all flex-1"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => confirmarAgendamento(enc)}
                                className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center shadow-md active:scale-98 transition-all"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setAgendandoId(null)}
                                className="h-11 px-4 bg-surface-container-high hover:bg-surface-variant text-on-surface-variant font-extrabold rounded-xl text-xs flex items-center justify-center active:scale-98 transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => iniciarAgendamento(e, enc)}
                          className="w-full sm:w-auto px-5 py-2.5 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm shadow-blue-600/10 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                        >
                          <span className="material-symbols-outlined text-base">event</span>
                          Agendar Atendimento
                        </button>
                      )
                    )}
                    {enc.status === 'AGUARDANDO_CONFIRMACAO' && (
                      <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold text-center w-full sm:w-auto block border border-gray-200">
                        Aguardando Resposta do Paciente
                      </span>
                    )}
                    {['AGENDADO', 'CONFIRMADO_PACIENTE'].includes(enc.status) && (
                      <button
                        onClick={(e) => abrirModalRetorno(e, enc)}
                        className="w-full sm:w-auto px-5 py-2.5 h-11 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm shadow-purple-600/10 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                      >
                        <span className="material-symbols-outlined text-base">assignment_turned_in</span>
                        Registrar Retorno
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Retorno Clínico */}
      {retornoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !enviandoRetorno && setRetornoAberto(false)}></div>
          <form onSubmit={enviarRetorno} className="relative bg-surface-container-lowest rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-surface-variant animate-zoom-in">
            <h2 className="text-lg font-black text-on-background tracking-tight mb-1">Registrar Retorno (UBS)</h2>
            <p className="text-xs text-on-surface-variant font-medium mb-4">
              Paciente: <strong className="text-on-background">{encRetorno?.paciente_nome}</strong> • CRA: <strong className="text-on-background">{encRetorno?.paciente_cra}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">Resultado / Feedback do Procedimento *</label>
                <select required value={retornoForm.feedback_tipo}
                  onChange={(e) => setRetornoForm(prev => ({ ...prev, feedback_tipo: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high/60 border border-surface-variant rounded-2xl text-sm font-semibold outline-none focus:border-primary/40 transition-all">
                  <option value="">Selecione o resultado...</option>
                  {Object.entries(FEEDBACK_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1">Conduta Clínica Adotada *</label>
                <textarea required rows={5} placeholder="Descreva a conduta (mínimo 10 caracteres)"
                  value={retornoForm.conduta}
                  onChange={(e) => setRetornoForm(prev => ({ ...prev, conduta: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high/60 border border-surface-variant rounded-2xl text-sm font-semibold outline-none focus:border-primary/40 resize-none transition-all" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setRetornoAberto(false)} disabled={enviandoRetorno}
                className="flex-1 py-3 rounded-2xl border border-surface-variant font-bold text-xs uppercase tracking-wider transition-colors">Cancelar</button>
              <button type="submit" disabled={enviandoRetorno || retornoForm.conduta.length < 10 || !retornoForm.feedback_tipo}
                className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50">
                {enviandoRetorno ? 'Enviando...' : 'Enviar Retorno à UBS'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* ── DRAWER/GAVETA DE CONSULTA CLÍNICA DE PRONTUÁRIO SEGURO (LGPD) ── */}
      {prontuarioAberto && (
        <div className="fixed inset-0 z-50 flex justify-end p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-md transition-opacity animate-fadeIn"
            onClick={() => !loadingProntuario && setProntuarioAberto(false)}
          />
          <div className="relative w-full max-w-md bg-surface-container-lowest h-full sm:h-auto sm:rounded-[2rem] shadow-2xl flex flex-col justify-between p-6 overflow-y-auto border border-surface-variant/35 animate-slideLeft">
            
            {/* Cabeçalho do Drawer */}
            <div>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-surface-variant/35">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-2xl font-bold">clinical_notes</span>
                  <h2 className="text-lg font-black tracking-tight">Prontuário Rápido</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setProntuarioAberto(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-all"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {loadingProntuario ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-8 bg-surface-container-high/65 rounded-xl w-3/4"></div>
                  <div className="h-4 bg-surface-container-high/65 rounded-xl w-1/2"></div>
                  <div className="h-20 bg-surface-container-high/65 rounded-2xl mt-8"></div>
                  <div className="h-20 bg-surface-container-high/65 rounded-2xl"></div>
                </div>
              ) : pacienteProntuario ? (
                <div className="space-y-5">
                  {/* Identificação com iniciais e avatar */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 bg-gradient-to-tr from-primary to-primary-dark text-white font-black text-lg rounded-2xl flex items-center justify-center shadow-md">
                      {pacienteProntuario.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-on-background leading-tight">{pacienteProntuario.nome}</h3>
                      <p className="text-[10px] text-on-surface-variant font-extrabold tracking-wider uppercase mt-1">
                        CRA: {pacienteProntuario.cra || 'Sem Registro'} • Nasc: {new Date(pacienteProntuario.data_nascimento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Ficha Hero: Tipo Sanguíneo */}
                  <div className="bg-red-500/[0.03] border border-red-500/15 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] font-black text-red-900 uppercase tracking-widest">Tipo Sanguíneo</p>
                      <p className="text-xs text-on-surface-variant font-semibold mt-0.5">Identificação para procedimentos e transfusões</p>
                    </div>
                    <span className="text-2xl font-black text-red-700 bg-red-500/10 w-12 h-12 rounded-xl flex items-center justify-center border border-red-500/20 shadow-sm">
                      {pacienteProntuario.tipo_sanguineo || 'N/I'}
                    </span>
                  </div>

                  {/* Alergias Registradas (Destaque HSL com pulsação se houver) */}
                  <div className="bg-surface-container-low/60 p-4 rounded-2xl border border-surface-variant/35">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-1 mb-2.5">
                      <span className="material-symbols-outlined text-[14px] text-red-600">warning</span>
                      Alergias Clínicas
                    </p>
                    {pacienteProntuario.alergias ? (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-pulse">
                        <p className="text-xs font-bold text-red-950 leading-relaxed">{pacienteProntuario.alergias}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant font-semibold italic pl-1">Nenhuma alergia conhecida ou registrada.</p>
                    )}
                  </div>

                  {/* Comorbidades */}
                  <div className="bg-surface-container-low/60 p-4 rounded-2xl border border-surface-variant/35">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-1 mb-2.5">
                      <span className="material-symbols-outlined text-[14px] text-primary">analytics</span>
                      Condições Clínicas / Comorbidades
                    </p>
                    {pacienteProntuario.comorbidades ? (
                      <p className="text-xs font-bold text-on-background leading-relaxed pl-1">{pacienteProntuario.comorbidades}</p>
                    ) : (
                      <p className="text-xs text-on-surface-variant font-semibold italic pl-1">Nenhuma comorbidade registrada.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-center text-on-surface-variant font-semibold italic">Erro ao carregar dados clínicos do paciente.</p>
              )}
            </div>

            {/* Rodapé do Drawer */}
            <div className="mt-8 pt-4 border-t border-surface-variant/35 space-y-3.5 flex-shrink-0">
              <div className="p-3 bg-surface-container-low rounded-xl flex items-start gap-2 border border-surface-variant/20">
                <span className="material-symbols-outlined text-primary text-base mt-0.5">info</span>
                <p className="text-[10px] text-on-surface-variant font-bold leading-normal">
                  Este prontuário destina-se exclusivamente à consulta rápida para o procedimento regulado. Os dados são protegidos conforme a LGPD e o Decreto Municipal 18.855/2021 de SJC.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProntuarioAberto(false)}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary-dark transition-all active:scale-[0.99] shadow-sm"
              >
                Fechar Consulta
              </button>
            </div>

          </div>
        </div>
      )}
    </ExternaLayout>
  );
}
