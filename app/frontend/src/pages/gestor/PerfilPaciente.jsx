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
};

const STATUS_VALIDOS = [
  'em_analise', 'aguardando_regulacao', 'autorizado',
  'data_marcada', 'aguardando_resultado', 'concluido', 'cancelado'
];

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
  const [formStatus, setFormStatus] = useState({ status_novo: 'em_analise', observacao: '' });
  const [editandoDados, setEditandoDados] = useState(false);
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [formDados, setFormDados] = useState({ nome: '', telefone: '', email: '' });
  const [historicos, setHistoricos] = useState({});
  const [historicosAbertos, setHistoricosAbertos] = useState({});

  const [modalEscalarAberto, setModalEscalarAberto] = useState(false);
  const [enviandoEscalar, setEnviandoEscalar] = useState(false);
  const [justificativa, setJustificativa] = useState('');

  const carregarPaciente = () => {
    setLoading(true);
    api.get(`/gestor/paciente/${id}`)
      .then(r => setPaciente(r.data))
      .catch(() => toast.error('Erro ao carregar dados do paciente.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregarPaciente(); }, [id]);

  const iniciarEdicaoDados = () => {
    setFormDados({
      nome: paciente?.nome || '',
      telefone: paciente?.telefone || '',
      email: paciente?.email || '',
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
    setFormStatus({ status_novo: sol.status, observacao: '' });
    setModalStatusAberto(true);
  };

  const handleAtualizarStatus = async (e) => {
    e.preventDefault();
    setEnviandoStatus(true);
    try {
      await api.put(`/gestor/solicitacao/${solicitacaoSelecionada.id}/status`, formStatus);
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
    </GestorLayout>
  );
}
