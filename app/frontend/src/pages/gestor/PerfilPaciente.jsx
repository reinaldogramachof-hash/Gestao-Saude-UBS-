/**
 * PÁGINA: PerfilPaciente.jsx — Épico 2 + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Exibe e edita o perfil do paciente, gerencia solicitações e consulta
 *         o histórico de status de cada solicitação sob demanda.
 * PROPS: Nenhuma. O identificador do paciente vem de useParams().
 *         Usa GestorLayout para layout responsivo com sidebar drawer.
 *         Modais de solicitação e status inalterados.
 *
 * API: GET /api/gestor/paciente/:id
 *      PUT /api/gestor/paciente/:id
 *      GET /api/gestor/solicitacao/:id/historico
 *      POST /api/gestor/paciente/:id/solicitacao
 *      PUT  /api/gestor/solicitacao/:id/status
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
// formatarDataBR: corrige bug de fuso horário em strings de data sem horário (UTC-3)
import { formatarDataBR } from '../../utils/statusHelper';
import GestorLayout from '../../components/gestor/GestorLayout';

const STATUS_BADGE = {
  em_analise:           'bg-gray-100 text-gray-600',
  aguardando_regulacao: 'bg-amber-100 text-amber-700',
  autorizado:           'bg-blue-100 text-blue-700',
  data_marcada:         'bg-teal-100 text-teal-700',
  aguardando_resultado: 'bg-purple-100 text-purple-700',
  concluido:            'bg-emerald-100 text-emerald-700',
  cancelado:            'bg-red-100 text-red-600',
};

const STATUS_LABEL = {
  em_analise:           'Em Análise',
  aguardando_regulacao: 'Ag. Regulação',
  autorizado:           'Autorizado',
  data_marcada:         'Data Marcada',
  aguardando_resultado: 'Ag. Resultado',
  concluido:            'Concluído',
  cancelado:            'Cancelado',
  // Evento de escalada de prioridade — aparece no histórico da solicitação
  urgente_escalado:     'Escalado para Urgente',
};

const STATUS_VALIDOS = [
  'em_analise', 'aguardando_regulacao', 'autorizado',
  'data_marcada', 'aguardando_resultado', 'concluido', 'cancelado'
];

const TIPO_UNIDADE_LABEL = {
  ubs:                  'UBS',
  ame:                  'AME',
  caps:                 'CAPS',
  upa:                  'UPA',
  centro_especialidades:'Centro de Especialidades',
  hospital:             'Hospital',
  pronto_socorro:       'Pronto-Socorro',
  outro:                'Outro',
};

const TIPO_UNIDADE_ICON = {
  ubs:                  'home_health',
  ame:                  'medical_services',
  caps:                 'psychology',
  upa:                  'local_hospital',
  centro_especialidades:'domain',
  hospital:             'local_hospital',
  pronto_socorro:       'emergency',
  outro:                'description',
};


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: CardSolicitacao
// FUNÇÃO: Renderiza o card de uma solicitação no perfil do paciente (gestor).
//         Exibe status, previsão, botões de ação e histórico expansível.
//         Definido FORA de PerfilPaciente para evitar que o React destrua e
//         recrie o componente a cada re-render do pai (quando definido dentro,
//         React trata como novo componente por referência de função).
// PROPS:
//   - sol: object — dados da solicitação
//   - abrirModalEscalar: fn — abre modal de escalada para urgente
//   - abrirModalStatus: fn — abre modal de atualização de status
//   - alternarHistorico: fn — expande/colapsa o histórico da solicitação
//   - historicosAbertos: object — mapa {[id]: boolean} de históricos abertos
//   - historicos: object — mapa {[id]: {loading, erro, itens}} com os dados
//   - carregarHistorico: fn — dispara o fetch do histórico de uma solicitação
// ─────────────────────────────────────────────────────────────────────────────
function CardSolicitacao({
  sol,
  abrirModalEscalar,
  abrirModalStatus,
  alternarHistorico,
  historicosAbertos,
  historicos,
  carregarHistorico,
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl md:rounded-2xl border border-surface-variant p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-bold text-on-background truncate">{sol.descricao_paciente}</h3>
            <span className="text-xs font-bold px-2 py-0.5 bg-surface-container-high rounded text-on-surface-variant flex-shrink-0">{sol.tipo}</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${STATUS_BADGE[sol.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABEL[sol.status] || sol.status}
            </span>
          </div>
          {sol.data_prevista && (
            <p className="text-xs text-on-surface-variant">Previsão: {formatarDataBR(sol.data_prevista)}</p>
          )}
          {sol.observacao_paciente && (
            <p className="text-xs text-on-surface-variant italic mt-1">{sol.observacao_paciente}</p>
          )}
          {/* Resultado clínico — exibido quando a solicitação já tem resultado registrado */}
          {(sol.resultado || sol.cid_10) && (
            <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              {sol.cid_10 && (
                <p className="text-xs font-bold text-emerald-700">
                  <span className="material-symbols-outlined text-[14px] align-middle mr-1">vaccines</span>
                  CID-10: {sol.cid_10}
                </p>
              )}
              {sol.resultado && (
                <p className="text-xs text-emerald-800 font-medium">{sol.resultado}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-row md:flex-col lg:flex-row gap-2 flex-shrink-0 mt-3 md:mt-0 w-full md:w-auto">
          {sol.status !== 'concluido' && sol.status !== 'cancelado' && sol.prioridade !== 'urgente' && (
            <button
              onClick={() => abrirModalEscalar(sol)}
              className="flex-1 md:flex-none px-3 py-2 border border-red-200 text-red-700 bg-red-50 font-bold rounded-xl hover:bg-red-100 transition-colors text-xs flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">warning</span>
              Escalar
            </button>
          )}
          <button
            onClick={() => abrirModalStatus(sol)}
            className="flex-1 md:flex-none px-3 py-2 border border-outline text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors text-xs flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Atualizar
          </button>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-surface-variant">
        <button
          onClick={() => alternarHistorico(sol.id)}
          className="flex items-center gap-2 text-sm font-bold text-primary"
          aria-expanded={Boolean(historicosAbertos[sol.id])}
        >
          <span className="material-symbols-outlined text-lg">
            {historicosAbertos[sol.id] ? 'expand_less' : 'history'}
          </span>
          {historicosAbertos[sol.id] ? 'Ocultar histórico' : 'Ver histórico'}
        </button>
        {historicosAbertos[sol.id] && (
          <div className="mt-4">
            {historicos[sol.id]?.loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-14 bg-surface-container-high rounded-xl" />
                <div className="h-14 bg-surface-container-high rounded-xl" />
              </div>
            ) : historicos[sol.id]?.erro ? (
              <div className="p-4 rounded-xl bg-red-50 text-red-700 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-bold">{historicos[sol.id].erro}</span>
                <button onClick={() => carregarHistorico(sol.id, true)} className="px-3 py-2 bg-white rounded-lg font-bold text-xs">Tentar novamente</button>
              </div>
            ) : historicos[sol.id]?.itens?.length > 0 ? (
              <ol className="space-y-3">
                {historicos[sol.id].itens.map((item) => (
                  <li key={item.id} className="p-4 rounded-xl bg-surface-container-low border border-surface-variant">
                    <p className="text-xs font-bold text-on-surface-variant">
                      {new Date(item.alterado_em).toLocaleString('pt-BR')}
                      {item.gestor_nome ? ` • ${item.gestor_nome}` : ''}
                    </p>
                    <p className="font-bold text-on-background mt-1">
                      De: {item.status_anterior ? (STATUS_LABEL[item.status_anterior] || item.status_anterior) : 'Início'}
                      {' → '}
                      Para: {STATUS_LABEL[item.status_novo] || item.status_novo}
                    </p>
                    {item.observacao && <p className="text-sm text-on-surface-variant mt-1">{item.observacao}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-on-surface-variant">Nenhum evento de histórico registrado.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PerfilPaciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalSolicitacaoAberto, setModalSolicitacaoAberto] = useState(false);
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);
  const [formSolicitacao, setFormSolicitacao] = useState({
    tipo: 'exame', descricao_interna: '', descricao_paciente: '', prioridade: 'rotina', data_prevista: '', local_executor: '',
  });
  const [modalStatusAberto, setModalStatusAberto] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  const [enviandoStatus, setEnviandoStatus] = useState(false);
  const [formStatus, setFormStatus] = useState({
    status_novo: 'em_analise',
    observacao: '',
    resultado: '',   // resultado clínico do exame/consulta (opcional)
    cid_10: '',      // CID-10 registrado no momento da conclusão (opcional)
  });
  const [editandoDados, setEditandoDados] = useState(false);
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [formDados, setFormDados] = useState({
    // Dados pessoais
    nome: '', telefone: '', email: '', bairro: '',
    // Dados clínicos
    tipo_sanguineo: '', peso_kg: '', altura_cm: '',
    alergias: '', comorbidades: '',
    medicamentos_uso_continuo: '', observacoes_clinicas: '',
  });
  const [historicos, setHistoricos] = useState({});
  const [historicosAbertos, setHistoricosAbertos] = useState({});

  const [modalEscalarAberto, setModalEscalarAberto] = useState(false);
  const [enviandoEscalar, setEnviandoEscalar] = useState(false);
  const [justificativa, setJustificativa] = useState('');

  // ── Estados da Linha do Tempo (atendimentos clínicos) ──
  const [atendimentos, setAtendimentos] = useState([]);
  const [loadingAtendimentos, setLoadingAtendimentos] = useState(false);
  const [modalAtendimentoAberto, setModalAtendimentoAberto] = useState(false);
  const [enviandoAtendimento, setEnviandoAtendimento] = useState(false);
  // null = criar novo; objeto = editar existente
  const [atendimentoEditando, setAtendimentoEditando] = useState(null);
  const [deletandoAtendimento, setDeletandoAtendimento] = useState(null);
  const [formAtendimento, setFormAtendimento] = useState({
    data_atendimento: '', unidade: '', tipo_unidade: '',
    especialidade: '', profissional: '',
    cid_10_principal: '', cid_10_secundario: '',
    conduta: '', observacoes: '',
  });

  // ── Estado da aba ativa (navegação por tabs) ──
  // Valores: 'dados' | 'solicitacoes' | 'linha_do_tempo'
  const [abaAtiva, setAbaAtiva] = useState('dados');

  const carregarPaciente = () => {
    setLoading(true);
    api.get(`/gestor/paciente/${id}`)
      .then(r => setPaciente(r.data))
      .catch(() => toast.error('Erro ao carregar dados do paciente.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregarPaciente(); }, [id]);

  const iniciarEdicaoDados = () => {
    // Pré-preenche dados pessoais E dados clínicos do estado atual do paciente
    setFormDados({
      nome:                      paciente?.nome || '',
      telefone:                  paciente?.telefone || '',
      email:                     paciente?.email || '',
      bairro:                    paciente?.bairro || '',
      tipo_sanguineo:            paciente?.tipo_sanguineo || '',
      peso_kg:                   paciente?.peso_kg || '',
      altura_cm:                 paciente?.altura_cm || '',
      alergias:                  paciente?.alergias || '',
      comorbidades:              paciente?.comorbidades || '',
      medicamentos_uso_continuo: paciente?.medicamentos_uso_continuo || '',
      observacoes_clinicas:      paciente?.observacoes_clinicas || '',
    });
    setEditandoDados(true);
  };

  const handleSalvarDados = async (event) => {
    event.preventDefault();
    setSalvandoDados(true);
    try {
      await api.put(`/gestor/paciente/${id}`, formDados);
      toast.success('Dados do paciente atualizados!');
      setEditandoDados(false);
      carregarPaciente();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar dados do paciente.');
    } finally {
      setSalvandoDados(false);
    }
  };

  // O histórico é buscado apenas na primeira expansão e mantido em cache local.
  const carregarHistorico = async (solicitacaoId, forcar = false) => {
    setHistoricos((prev) => ({
      ...prev,
      [solicitacaoId]: { ...prev[solicitacaoId], loading: true, erro: '' },
    }));
    try {
      const response = await api.get(`/gestor/solicitacao/${solicitacaoId}/historico`);
      setHistoricos((prev) => ({
        ...prev,
        [solicitacaoId]: { itens: response.data, loading: false, erro: '' },
      }));
    } catch {
      setHistoricos((prev) => ({
        ...prev,
        [solicitacaoId]: {
          itens: forcar ? [] : (prev[solicitacaoId]?.itens || []),
          loading: false,
          erro: 'Não foi possível carregar o histórico.',
        },
      }));
    }
  };

  const alternarHistorico = (solicitacaoId) => {
    const vaiAbrir = !historicosAbertos[solicitacaoId];
    setHistoricosAbertos((prev) => ({ ...prev, [solicitacaoId]: vaiAbrir }));
    if (vaiAbrir && !historicos[solicitacaoId]) {
      carregarHistorico(solicitacaoId);
    }
  };

  const handleSalvarSolicitacao = async (e) => {
    e.preventDefault();
    setEnviandoSolicitacao(true);
    try {
      await api.post(`/gestor/paciente/${id}/solicitacao`, {
        ...formSolicitacao,
        data_solicitacao: new Date().toISOString().split('T')[0],
      });
      toast.success('Solicitação criada com sucesso!');
      setModalSolicitacaoAberto(false);
      setFormSolicitacao({ tipo: 'exame', descricao_interna: '', descricao_paciente: '', prioridade: 'rotina', data_prevista: '', local_executor: '' });
      carregarPaciente();
    } catch {
      toast.error('Erro ao criar solicitação.');
    } finally {
      setEnviandoSolicitacao(false);
    }
  };

  const abrirModalStatus = (sol) => {
    setSolicitacaoSelecionada(sol);
    // Pré-carrega resultado e cid_10 existentes para edição
    setFormStatus({
      status_novo: sol.status,
      observacao: '',
      resultado: sol.resultado || '',
      cid_10: sol.cid_10 || '',
    });
    setModalStatusAberto(true);
  };

  const handleAtualizarStatus = async (e) => {
    e.preventDefault();
    setEnviandoStatus(true);
    try {
      await api.put(`/gestor/solicitacao/${solicitacaoSelecionada.id}/status`, {
        status_novo: formStatus.status_novo,
        observacao: formStatus.observacao,
      });

      // Se o gestor preencheu resultado ou cid_10, salva em chamada separada
      if (formStatus.resultado || formStatus.cid_10) {
        await api.patch(`/gestor/solicitacao/${solicitacaoSelecionada.id}/resultado`, {
          resultado: formStatus.resultado || undefined,
          cid_10: formStatus.cid_10 || undefined,
        });
      }

      toast.success('Status atualizado com sucesso!');
      setModalStatusAberto(false);
      carregarPaciente();
    } catch {
      toast.error('Erro ao atualizar status.');
    } finally {
      setEnviandoStatus(false);
    }
  };

  const abrirModalEscalar = (sol) => {
    setSolicitacaoSelecionada(sol);
    setJustificativa('');
    setModalEscalarAberto(true);
  };

  const handleEscalarUrgencia = async (e) => {
    e.preventDefault();
    setEnviandoEscalar(true);
    try {
      await api.patch(`/gestor/solicitacao/${solicitacaoSelecionada.id}/escalar`, { justificativa });
      toast.success('Solicitação escalada para urgente!');
      setModalEscalarAberto(false);
      carregarPaciente();
    } catch {
      toast.error('Erro ao escalar solicitação. Verifique se a justificativa tem pelo menos 10 caracteres.');
    } finally {
      setEnviandoEscalar(false);
    }
  };

  // Carrega a linha do tempo de atendimentos junto com os dados do paciente
  useEffect(() => { carregarAtendimentos(); }, [id]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FUNÇÕES: Linha do Tempo (Atendimentos Clínicos)
  // Gerenciam o CRUD de atendimentos do paciente. Os dados são carregados
  // uma vez no mount e recarregados após cada operação de escrita.
  // ─────────────────────────────────────────────────────────────────────────────

  // TIPO_UNIDADE_LABEL foi movido para o topo do arquivo

  const carregarAtendimentos = () => {
    setLoadingAtendimentos(true);
    api.get(`/gestor/paciente/${id}/atendimentos`)
      .then(r => setAtendimentos(r.data))
      .catch(() => toast.error('Erro ao carregar linha do tempo.'))
      .finally(() => setLoadingAtendimentos(false));
  };

  const resetFormAtendimento = () => {
    setFormAtendimento({
      data_atendimento: '', unidade: '', tipo_unidade: '',
      especialidade: '', profissional: '',
      cid_10_principal: '', cid_10_secundario: '',
      conduta: '', observacoes: '',
    });
  };

  const abrirModalNovoAtendimento = () => {
    setAtendimentoEditando(null);
    resetFormAtendimento();
    setModalAtendimentoAberto(true);
  };

  const abrirModalEditarAtendimento = (atendimento) => {
    setAtendimentoEditando(atendimento);
    setFormAtendimento({
      data_atendimento: atendimento.data_atendimento?.split('T')[0] || '',
      unidade:           atendimento.unidade || '',
      tipo_unidade:      atendimento.tipo_unidade || '',
      especialidade:     atendimento.especialidade || '',
      profissional:      atendimento.profissional || '',
      cid_10_principal:  atendimento.cid_10_principal || '',
      cid_10_secundario: atendimento.cid_10_secundario || '',
      conduta:           atendimento.conduta || '',
      observacoes:       atendimento.observacoes || '',
    });
    setModalAtendimentoAberto(true);
  };

  const handleSalvarAtendimento = async (e) => {
    e.preventDefault();
    setEnviandoAtendimento(true);
    try {
      if (atendimentoEditando) {
        await api.put(`/gestor/atendimento/${atendimentoEditando.id}`, formAtendimento);
        toast.success('Atendimento atualizado!');
      } else {
        await api.post(`/gestor/paciente/${id}/atendimento`, formAtendimento);
        toast.success('Atendimento registrado!');
      }
      setModalAtendimentoAberto(false);
      setAtendimentoEditando(null);
      resetFormAtendimento();
      carregarAtendimentos();
    } catch {
      toast.error('Erro ao salvar atendimento.');
    } finally {
      setEnviandoAtendimento(false);
    }
  };

  const handleDeletarAtendimento = async (atendimentoId) => {
    if (!window.confirm('Tem certeza que deseja remover este atendimento?')) return;
    setDeletandoAtendimento(atendimentoId);
    try {
      await api.delete(`/gestor/atendimento/${atendimentoId}`);
      toast.success('Atendimento removido.');
      carregarAtendimentos();
    } catch {
      toast.error('Erro ao remover atendimento.');
    } finally {
      setDeletandoAtendimento(null);
    }
  };

  if (loading) {
    return (
      <GestorLayout>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-surface-container-low rounded w-64"></div>
          <div className="h-40 bg-surface-container-low rounded-2xl"></div>
        </div>
      </GestorLayout>
    );
  }

  return (
    <GestorLayout>
      {/* ── Cabeçalho com botão voltar ── */}
      <div className="flex items-center gap-3 mb-6 lg:mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-surface-container-high hover:bg-surface-container flex items-center justify-center transition-colors flex-shrink-0">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">
            {paciente?.nome}
          </h1>
          <p className="text-on-surface-variant font-medium text-sm mt-0.5">CRA: {paciente?.cra}</p>
        </div>
      </div>

      {/* ── Navegação por Abas ── */}
      <div className="flex border-b border-surface-variant mb-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'dados',          label: 'Dados',          icon: 'person' },
          { id: 'solicitacoes',   label: 'Solicitações',    icon: 'receipt_long' },
          { id: 'linha_do_tempo', label: 'Linha do Tempo',  icon: 'timeline' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAbaAtiva(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap
              ${abaAtiva === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {abaAtiva === 'dados' && (
        <>
          {/* ── Card de dados: leitura e edição inline ── */}
          <div className="bg-surface-container-lowest rounded-2xl md:rounded-3xl border border-surface-variant p-5 md:p-8 mb-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="text-lg font-extrabold text-on-background">Dados pessoais</h2>
              {!editandoDados && (
                <button onClick={iniciarEdicaoDados} className="px-4 py-2 border border-outline rounded-xl font-bold text-sm hover:bg-surface-container-high">
                  Editar Dados
                </button>
              )}
            </div>
            {editandoDados ? (
              <form onSubmit={handleSalvarDados} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-on-surface-variant">Nome*</span>
                    <input required value={formDados.nome} onChange={(e) => setFormDados((prev) => ({ ...prev, nome: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-on-surface-variant">Telefone</span>
                    <input value={formDados.telefone} onChange={(e) => setFormDados((prev) => ({ ...prev, telefone: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-on-surface-variant">E-mail</span>
                    <input type="email" value={formDados.email} onChange={(e) => setFormDados((prev) => ({ ...prev, email: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                  </label>
                </div>

                {/* Separador visual entre dados pessoais e clínicos */}
                <div className="border-t border-surface-variant pt-5">
                  <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider mb-4">
                    Dados Clínicos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-on-surface-variant">Tipo Sanguíneo</span>
                      <select value={formDados.tipo_sanguineo}
                        onChange={e => setFormDados(p => ({ ...p, tipo_sanguineo: e.target.value }))}
                        className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                        <option value="">Não informado</option>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-on-surface-variant">Peso (kg)</span>
                      <input type="number" step="0.1" min="1" max="300"
                        placeholder="Ex: 72.5"
                        value={formDados.peso_kg}
                        onChange={e => setFormDados(p => ({ ...p, peso_kg: e.target.value }))}
                        className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-on-surface-variant">Altura (cm)</span>
                      <input type="number" min="50" max="250"
                        placeholder="Ex: 175"
                        value={formDados.altura_cm}
                        onChange={e => setFormDados(p => ({ ...p, altura_cm: e.target.value }))}
                        className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                    </label>
                  </div>
                  <div className="space-y-4">
                    <label className="block space-y-2">
                      <span className="text-sm font-bold text-on-surface-variant">Alergias</span>
                      <textarea rows={2}
                        placeholder="Ex: Penicilina, Dipirona, látex"
                        value={formDados.alergias}
                        onChange={e => setFormDados(p => ({ ...p, alergias: e.target.value }))}
                        className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-bold text-on-surface-variant">Comorbidades</span>
                      <textarea rows={2}
                        placeholder="Ex: Diabetes tipo 2, Hipertensão arterial"
                        value={formDados.comorbidades}
                        onChange={e => setFormDados(p => ({ ...p, comorbidades: e.target.value }))}
                        className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-bold text-on-surface-variant">Medicamentos de uso contínuo</span>
                      <textarea rows={2}
                        placeholder="Ex: Metformina 500mg 2x/dia, Losartana 50mg"
                        value={formDados.medicamentos_uso_continuo}
                        onChange={e => setFormDados(p => ({ ...p, medicamentos_uso_continuo: e.target.value }))}
                        className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-bold text-on-surface-variant">Observações Clínicas</span>
                      <textarea rows={3}
                        placeholder="Anotações da equipe sobre saúde geral do paciente"
                        value={formDados.observacoes_clinicas}
                        onChange={e => setFormDados(p => ({ ...p, observacoes_clinicas: e.target.value }))}
                        className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setEditandoDados(false)} className="h-12 px-5 rounded-2xl border border-outline font-bold">Cancelar</button>
                  <button type="submit" disabled={salvandoDados} className="h-12 px-6 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">{salvandoDados ? 'Salvando...' : 'Salvar'}</button>
                </div>
              </form>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { label: 'CRA', value: paciente?.cra },
                    { label: 'Telefone', value: paciente?.telefone || '---' },
                    { label: 'Nascimento', value: paciente?.data_nascimento ? formatarDataBR(paciente.data_nascimento) : '---' },
                    { label: 'E-mail', value: paciente?.email || '---' },
                    { label: 'Bairro', value: paciente?.bairro || '---' },
                    // UBS de origem: informativo — modo matriz, não restringe acesso
                    { label: 'UBS de Origem', value: paciente?.ubs_nome || '---' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
                      <p className="font-bold text-on-background text-sm md:text-base">{value}</p>
                    </div>
                  ))}
                </div>
                {/* Alerta de ausência de meios de contato (telefone e e-mail) para notificações digitais */}
                {!paciente?.telefone && !paciente?.email && (
                  <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-amber-800">
                    <span className="material-symbols-outlined text-base">warning</span>
                    <p className="text-xs font-semibold">Paciente sem contato registrado — impossível notificar remotamente.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Card: Dados Clínicos ── */}
          {!editandoDados && (
            <div className="bg-surface-container-lowest rounded-2xl md:rounded-3xl border border-surface-variant p-5 md:p-8 mt-4">
              <h2 className="text-lg font-extrabold text-on-background mb-5">Dados Clínicos</h2>

              {/* Vitais básicos */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Tipo Sanguíneo</p>
                  <p className="font-bold text-on-background">{paciente?.tipo_sanguineo || '---'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Peso</p>
                  <p className="font-bold text-on-background">{paciente?.peso_kg ? `${paciente.peso_kg} kg` : '---'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Altura</p>
                  <p className="font-bold text-on-background">{paciente?.altura_cm ? `${paciente.altura_cm} cm` : '---'}</p>
                </div>
              </div>

              {/* Campos clínicos críticos — em destaque visual (Tailwind-safe) */}
              <div className="space-y-4">
                {[
                  {
                    label: 'Alergias',
                    key: 'alergias',
                    icon: 'warning',
                    wrapClass: 'bg-amber-50 border-amber-200',
                    labelClass: 'text-amber-700',
                    textClass: 'text-amber-900',
                  },
                  {
                    label: 'Comorbidades',
                    key: 'comorbidades',
                    icon: 'monitor_heart',
                    wrapClass: 'bg-red-50 border-red-200',
                    labelClass: 'text-red-700',
                    textClass: 'text-red-900',
                  },
                  {
                    label: 'Medicamentos em uso contínuo',
                    key: 'medicamentos_uso_continuo',
                    icon: 'medication',
                    wrapClass: 'bg-blue-50 border-blue-200',
                    labelClass: 'text-blue-700',
                    textClass: 'text-blue-900',
                  },
                  {
                    label: 'Observações Clínicas',
                    key: 'observacoes_clinicas',
                    icon: 'note',
                    wrapClass: 'bg-surface-container-high border-surface-variant',
                    labelClass: 'text-on-surface-variant',
                    textClass: 'text-on-background',
                  },
                ].map(({ label, key, icon, wrapClass, labelClass, textClass }) => (
                  <div key={key} className={`p-4 rounded-xl border ${wrapClass}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${labelClass}`}>
                      <span className="material-symbols-outlined text-[14px]">{icon}</span>
                      {label}
                    </p>
                    <p className={`text-sm font-medium ${textClass}`}>
                      {paciente?.[key] || <span className="text-on-surface-variant italic font-normal">Não informado</span>}
                    </p>
                  </div>
                ))}
              </div>

              {/* Nota indicando edição conjunta */}
              <p className="text-xs text-on-surface-variant mt-4 italic">
                Para editar dados clínicos, use o botão "Editar Dados" acima.
              </p>
            </div>
          )}
        </>
      )}

      {abaAtiva === 'solicitacoes' && (
        <>
          {/* ── Cabeçalho de Solicitações ── */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-2xl font-extrabold text-on-background">Solicitações</h2>
            <button
              onClick={() => setModalSolicitacaoAberto(true)}
              className="h-10 px-4 md:h-12 md:px-6 bg-primary text-white font-bold rounded-xl md:rounded-2xl shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Nova Solicitação
            </button>
          </div>

          {/* ── Separação: ativas primeiro, históricas abaixo ── */}
          {(() => {
            // Separa as solicitações do paciente entre ativas e históricas com base no status de encerramento
            const STATUS_ENCERRADO = ['concluido', 'cancelado'];
            const ativas    = (paciente?.solicitacoes || []).filter(s => !STATUS_ENCERRADO.includes(s.status));
            const historico = (paciente?.solicitacoes || []).filter(s =>  STATUS_ENCERRADO.includes(s.status));
            
            return (
              <>
                {/* Solicitações ativas */}
                {ativas.length > 0 && (
                  <div className="space-y-3 md:space-y-4">
                    {ativas.map(sol => (
                      <CardSolicitacao
                        key={sol.id}
                        sol={sol}
                        abrirModalEscalar={abrirModalEscalar}
                        abrirModalStatus={abrirModalStatus}
                        alternarHistorico={alternarHistorico}
                        historicosAbertos={historicosAbertos}
                        historicos={historicos}
                        carregarHistorico={carregarHistorico}
                      />
                    ))}
                  </div>
                )}
                
                {/* Divisor + Histórico */}
                {historico.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">history</span>
                      Histórico ({historico.length})
                    </h3>
                    <div className="space-y-3 md:space-y-4 opacity-75">
                      {historico.map(sol => (
                        <CardSolicitacao
                          key={sol.id}
                          sol={sol}
                          abrirModalEscalar={abrirModalEscalar}
                          abrirModalStatus={abrirModalStatus}
                          alternarHistorico={alternarHistorico}
                          historicosAbertos={historicosAbertos}
                          historicos={historicos}
                          carregarHistorico={carregarHistorico}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Estado vazio exibido caso o paciente não possua nenhuma solicitação no histórico nem ativa */}
                {!paciente?.solicitacoes?.length && (
                  <p className="text-center text-on-surface-variant py-8 text-sm">Nenhuma solicitação registrada.</p>
                )}
              </>
            );
          })()}
        </>
      )}

      {abaAtiva === 'linha_do_tempo' && (
        <div>
          {/* Cabeçalho da seção */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h2 className="text-lg md:text-2xl font-extrabold text-on-background">Linha do Tempo</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Atendimentos em qualquer unidade — UBS, AME, CAPS, hospital, especialidades
              </p>
            </div>
            <button
              onClick={abrirModalNovoAtendimento}
              className="h-10 px-4 md:h-12 md:px-6 bg-primary text-white font-bold rounded-xl md:rounded-2xl shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Registrar Atendimento
            </button>
          </div>

          {/* Estado de carregamento */}
          {loadingAtendimentos && (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(n => (
                <div key={n} className="h-32 bg-surface-container-low rounded-2xl" />
              ))}
            </div>
          )}

          {/* Lista de atendimentos */}
          {!loadingAtendimentos && atendimentos.length > 0 && (
            <div className="space-y-3 md:space-y-4">
              {atendimentos.map(at => (
                <div key={at.id} className="bg-surface-container-lowest rounded-xl md:rounded-2xl border border-surface-variant p-4 md:p-6">
                  {/* Cabeçalho do card: data + unidade + ações */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-on-surface-variant">
                          {formatarDataBR(at.data_atendimento)}
                        </span>
                        {at.tipo_unidade && (
                          <span className="text-xs px-2 py-0.5 bg-surface-container-high rounded font-bold text-on-surface-variant">
                            {TIPO_UNIDADE_LABEL[at.tipo_unidade] || at.tipo_unidade}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-on-background truncate">{at.unidade}</h3>
                      {at.especialidade && (
                        <p className="text-sm text-on-surface-variant">
                          {at.especialidade}
                          {at.profissional ? ` • Dr(a). ${at.profissional}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => abrirModalEditarAtendimento(at)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-high transition-colors"
                        title="Editar atendimento"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletarAtendimento(at.id)}
                        disabled={deletandoAtendimento === at.id}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-600 disabled:opacity-50 transition-colors"
                        title="Remover atendimento"
                      >
                        <span className="material-symbols-outlined text-base">
                          {deletandoAtendimento === at.id ? 'hourglass_empty' : 'delete'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* CID-10 */}
                  {(at.cid_10_principal || at.cid_10_secundario) && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {at.cid_10_principal && (
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold">
                          CID: {at.cid_10_principal}
                        </span>
                      )}
                      {at.cid_10_secundario && (
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold">
                          CID 2°: {at.cid_10_secundario}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Conduta */}
                  {at.conduta && (
                    <div className="mb-2">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Conduta</p>
                      <p className="text-sm text-on-background">{at.conduta}</p>
                    </div>
                  )}

                  {at.observacoes && (
                    <p className="text-xs text-on-surface-variant italic mt-2">{at.observacoes}</p>
                  )}

                  {/* Rodapé de auditoria */}
                  {at.registrado_por_nome && (
                    <p className="text-xs text-on-surface-variant mt-3 pt-3 border-t border-surface-variant">
                      Registrado por: {at.registrado_por_nome}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Estado vazio */}
          {!loadingAtendimentos && atendimentos.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">timeline</span>
              <p className="text-on-surface-variant font-medium">Nenhum atendimento registrado ainda.</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Clique em "Registrar Atendimento" para adicionar o primeiro registro clínico.
              </p>
            </div>
          )}
        </div>
      )}


      {/* ── Modal: Nova Solicitação ── */}
      {modalSolicitacaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalSolicitacaoAberto(false)} />
          <div className="relative w-full max-w-3xl bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-extrabold">Nova Solicitação</h3>
              <button onClick={() => setModalSolicitacaoAberto(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleSalvarSolicitacao} className="p-6 md:p-8 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Tipo*</label>
                  <select required value={formSolicitacao.tipo} onChange={e => setFormSolicitacao(p => ({ ...p, tipo: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                    <option value="exame">Exame</option>
                    <option value="consulta">Consulta</option>
                    <option value="procedimento">Procedimento</option>
                    <option value="cirurgia">Cirurgia</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Prioridade</label>
                  <select value={formSolicitacao.prioridade} onChange={e => setFormSolicitacao(p => ({ ...p, prioridade: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                    <option value="rotina">Rotina</option>
                    <option value="prioritario">Prioritário</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Nome técnico (uso interno)*</label>
                <input required placeholder="Ex: Hemograma completo" value={formSolicitacao.descricao_interna}
                  onChange={e => setFormSolicitacao(p => ({ ...p, descricao_interna: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Explicação para o paciente*</label>
                <input required placeholder="Ex: Exame de sangue solicitado pelo médico" value={formSolicitacao.descricao_paciente}
                  onChange={e => setFormSolicitacao(p => ({ ...p, descricao_paciente: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Data prevista (opcional)</label>
                <input type="date" value={formSolicitacao.data_prevista} onChange={e => setFormSolicitacao(p => ({ ...p, data_prevista: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
              </div>
              {/* Local de execução: preenchido quando o serviço é realizado fora da UBS */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Local de atendimento (se fora da UBS)</label>
                <input
                  type="text"
                  value={formSolicitacao.local_executor}
                  onChange={e => setFormSolicitacao(p => ({ ...p, local_executor: e.target.value }))}
                  placeholder="Ex: Hospital Municipal de SJC, Centro de Especialidades..."
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium placeholder-on-surface-variant/40"
                />
                <p className="text-xs text-on-surface-variant">Deixe em branco se o atendimento for na própria UBS.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalSolicitacaoAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline font-bold">Cancelar</button>
                <button type="submit" disabled={enviandoSolicitacao} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">
                  {enviandoSolicitacao ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Atualizar Status ── */}
      {modalStatusAberto && solicitacaoSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalStatusAberto(false)} />
          <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center">
              <h3 className="text-xl font-extrabold">Atualizar Status</h3>
              <button onClick={() => setModalStatusAberto(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleAtualizarStatus} className="p-6 md:p-8 space-y-5">
              <p className="text-sm text-on-surface-variant font-medium">
                Solicitação: <span className="text-on-surface font-bold">{solicitacaoSelecionada.descricao_paciente}</span>
              </p>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Novo status*</label>
                <select required value={formStatus.status_novo} onChange={e => setFormStatus(p => ({ ...p, status_novo: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                  {STATUS_VALIDOS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Observação (opcional)</label>
                <textarea rows={3} placeholder="Ex: Consulta agendada para 10/05..." value={formStatus.observacao}
                  onChange={e => setFormStatus(p => ({ ...p, observacao: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Resultado Clínico / Laudo (opcional)</label>
                <textarea rows={2} placeholder="Ex: Hemograma normal, sem alterações..." value={formStatus.resultado}
                  onChange={e => setFormStatus(p => ({ ...p, resultado: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">CID-10 Principal (opcional)</label>
                <input type="text" maxLength={10} placeholder="Ex: E11.9, I10" value={formStatus.cid_10}
                  onChange={e => setFormStatus(p => ({ ...p, cid_10: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalStatusAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline font-bold">Cancelar</button>
                <button type="submit" disabled={enviandoStatus} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">
                  {enviandoStatus ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Escalar Urgência ── */}
      {modalEscalarAberto && solicitacaoSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalEscalarAberto(false)} />
          <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-red-700">Escalar para Urgente</h3>
              <button onClick={() => setModalEscalarAberto(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleEscalarUrgencia} className="p-6 md:p-8 space-y-5">
              <p className="text-sm text-on-surface-variant font-medium">
                Esta solicitação será marcada como urgente e aparecerá no painel de atenção imediata. Informe o motivo:
              </p>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Justificativa* (mínimo 10 caracteres)</label>
                <textarea required minLength={10} rows={4} placeholder="Descreva o motivo da urgência..." value={justificativa}
                  onChange={e => setJustificativa(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalEscalarAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline font-bold">Cancelar</button>
                <button type="submit" disabled={enviandoEscalar || justificativa.length < 10} className="flex-1 h-12 rounded-2xl bg-red-600 text-white font-bold disabled:opacity-50">
                  {enviandoEscalar ? 'Confirmando...' : 'Confirmar Escalada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Registrar / Editar Atendimento ── */}
      {modalAtendimentoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalAtendimentoAberto(false)} />
          <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-extrabold">
                {atendimentoEditando ? 'Editar Atendimento' : 'Registrar Atendimento'}
              </h3>
              <button onClick={() => setModalAtendimentoAberto(false)}
                className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <form onSubmit={handleSalvarAtendimento} className="p-6 md:p-8 space-y-4 overflow-y-auto">
              {/* Linha 1: Data + Tipo de Unidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Data do atendimento*</label>
                  <input required type="date"
                    value={formAtendimento.data_atendimento}
                    onChange={e => setFormAtendimento(p => ({ ...p, data_atendimento: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Tipo de unidade</label>
                  <select
                    value={formAtendimento.tipo_unidade}
                    onChange={e => setFormAtendimento(p => ({ ...p, tipo_unidade: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                    <option value="">Selecione...</option>
                    <option value="ubs">UBS</option>
                    <option value="ame">AME</option>
                    <option value="caps">CAPS</option>
                    <option value="upa">UPA</option>
                    <option value="centro_especialidades">Centro de Especialidades</option>
                    <option value="hospital">Hospital</option>
                    <option value="pronto_socorro">Pronto-Socorro</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>

              {/* Unidade (nome livre) */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Nome da unidade*</label>
                <input required
                  placeholder="Ex: UBS Vila Industrial, UPA Norte, AME Zona Leste"
                  value={formAtendimento.unidade}
                  onChange={e => setFormAtendimento(p => ({ ...p, unidade: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
              </div>

              {/* Especialidade + Profissional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Especialidade</label>
                  <input
                    placeholder="Ex: Cardiologia, Ortopedia"
                    value={formAtendimento.especialidade}
                    onChange={e => setFormAtendimento(p => ({ ...p, especialidade: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Profissional</label>
                  <input
                    placeholder="Ex: Dr(a). Nome do médico"
                    value={formAtendimento.profissional}
                    onChange={e => setFormAtendimento(p => ({ ...p, profissional: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
              </div>

              {/* CID-10 principal + secundário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">CID-10 Principal</label>
                  <input
                    maxLength={10}
                    placeholder="Ex: I10, E11, J45.0"
                    value={formAtendimento.cid_10_principal}
                    onChange={e => setFormAtendimento(p => ({ ...p, cid_10_principal: e.target.value.toUpperCase() }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">CID-10 Secundário</label>
                  <input
                    maxLength={10}
                    placeholder="Ex: Z87.0"
                    value={formAtendimento.cid_10_secundario}
                    onChange={e => setFormAtendimento(p => ({ ...p, cid_10_secundario: e.target.value.toUpperCase() }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
              </div>

              {/* Conduta */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Conduta</label>
                <textarea rows={3}
                  placeholder="O que foi prescrito, encaminhado ou decidido neste atendimento"
                  value={formAtendimento.conduta}
                  onChange={e => setFormAtendimento(p => ({ ...p, conduta: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Observações</label>
                <textarea rows={2}
                  placeholder="Notas adicionais sobre o atendimento"
                  value={formAtendimento.observacoes}
                  onChange={e => setFormAtendimento(p => ({ ...p, observacoes: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAtendimentoAberto(false)}
                  className="flex-1 h-12 rounded-2xl border border-outline font-bold">
                  Cancelar
                </button>
                <button type="submit" disabled={enviandoAtendimento}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">
                  {enviandoAtendimento ? 'Salvando...' : (atendimentoEditando ? 'Salvar Alterações' : 'Registrar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GestorLayout>
  );
}
