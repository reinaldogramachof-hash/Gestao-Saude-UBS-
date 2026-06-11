/**
 * PÁGINA: PerfilPaciente.jsx — Épico 2 + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Exibe o perfil completo de um paciente para o gestor.
 *         Usa GestorLayout para layout responsivo com sidebar drawer.
 *         Modais de solicitação e status inalterados.
 *
 * API: GET /api/gestor/paciente/:id
 *      POST /api/gestor/paciente/:id/solicitacao
 *      PUT  /api/gestor/solicitacao/:id/status
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
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

      {/* ── Card de dados: grid responsivo ── */}
      <div className="bg-surface-container-lowest rounded-2xl md:rounded-3xl border border-surface-variant p-5 md:p-8 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'CRA', value: paciente?.cra },
          { label: 'Telefone', value: paciente?.telefone || '---' },
          { label: 'Nascimento', value: paciente?.data_nascimento ? new Date(paciente.data_nascimento).toLocaleDateString('pt-BR') : '---' },
          { label: 'E-mail', value: paciente?.email || '---' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
            <p className="font-bold text-on-background text-sm md:text-base">{value}</p>
          </div>
        ))}
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

      {/* ── Lista de Solicitações ── */}
      <div className="space-y-3 md:space-y-4">
        {paciente?.solicitacoes?.length > 0 ? (
          paciente.solicitacoes.map(sol => (
            <div key={sol.id} className="bg-surface-container-lowest rounded-xl md:rounded-2xl border border-surface-variant p-4 md:p-6">
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
                    <p className="text-xs text-on-surface-variant">Previsão: {new Date(sol.data_prevista).toLocaleDateString('pt-BR')}</p>
                  )}
                  {sol.observacao_paciente && (
                    <p className="text-xs text-on-surface-variant italic mt-1">{sol.observacao_paciente}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {sol.status !== 'concluido' && sol.status !== 'cancelado' && sol.prioridade !== 'urgente' && (
                    <button
                      onClick={() => abrirModalEscalar(sol)}
                      className="px-4 py-2 border border-red-200 text-red-700 bg-red-50 font-bold rounded-xl hover:bg-red-100 transition-colors text-xs md:text-sm flex-shrink-0"
                    >
                      ⚠ Escalar
                    </button>
                  )}
                  <button
                    onClick={() => abrirModalStatus(sol)}
                    className="px-4 py-2 border border-outline text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors text-xs md:text-sm flex-shrink-0"
                  >
                    Atualizar Status
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 md:p-20 text-center text-on-surface-variant font-medium bg-surface-container-lowest rounded-2xl border border-surface-variant">
            Nenhuma solicitação cadastrada para este paciente.
          </div>
        )}
      </div>

      {/* ── Modal: Nova Solicitação ── */}
      {modalSolicitacaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalSolicitacaoAberto(false)} />
          <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
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
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden">
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
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden">
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
