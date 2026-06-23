/**
 * PÁGINA: EncaminhamentosExterna.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Listagem e gestão do fluxo de encaminhamentos na visão da unidade externa.
 * API: GET /api/externa/encaminhamentos
 *      PUT /api/externa/encaminhamento/:id/receber
 *      PUT /api/externa/encaminhamento/:id/agendar
 *      PUT /api/externa/encaminhamento/:id/concluir
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import ExternaLayout from '../../components/externa/ExternaLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  TODOS: 'Todos',
  AGUARDANDO_VAGA: 'Aguardando recebimento',
  RECEBIDO: 'Recebidos (Para Agendar)',
  AGUARDANDO_CONFIRMACAO: 'Aguardando paciente',
  AGENDADO: 'Agendados',
  CONFIRMADO_PACIENTE: 'Paciente confirmado',
  RETORNO_UBS: 'Concluídos'
};

const FEEDBACK_LABELS = {
  REALIZADO_SEM_INTERCORRENCIAS: 'Realizado sem intercorrências',
  REALIZADO_COM_INTERCORRENCIAS: 'Realizado com intercorrências',
  CANCELADO_AUSENCIA: 'Cancelado — ausência do paciente',
  CANCELADO_CONTRAINDICADO: 'Cancelado — contraindicado',
  NECESSITA_RETORNO: 'Necessita retorno',
  ENCAMINHAMENTO_ESPECIALIDADE: 'Encaminhado a especialidade',
  INTERNACAO_NECESSARIA: 'Internação necessária',
};

export default function EncaminhamentosExterna() {
  const [encaminhamentos, setEncaminhamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  
  // Agendamento inline
  const [agendandoId, setAgendandoId] = useState(null);
  const [dataAgendamento, setDataAgendamento] = useState('');

  // Modal de Retorno
  const [retornoAberto, setRetornoAberto] = useState(false);
  const [encRetorno, setEncRetorno] = useState(null);
  const [retornoForm, setRetornoForm] = useState({ feedback_tipo: '', conduta: '' });
  const [enviandoRetorno, setEnviandoRetorno] = useState(false);

  useEffect(() => {
    fetchEncaminhamentos();
  }, []);

  const fetchEncaminhamentos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/externa/encaminhamentos');
      setEncaminhamentos(data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar encaminhamentos.');
    } finally {
      setLoading(false);
    }
  };

  // Dispatcher centralizado para manter o frontend alinhado aos endpoints
  // separados que o backend valida com Joi.
  async function executarAcao(id, acao, payload = {}) {
    return api.put(`/externa/encaminhamento/${id}/${acao}`, payload);
  }

  const confirmarRecebimento = async (id) => {
    try {
      await executarAcao(id, 'receber');
      toast.success('Encaminhamento atualizado com sucesso!');
      fetchEncaminhamentos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar encaminhamento.');
    }
  };

  const iniciarAgendamento = (enc) => {
    setAgendandoId(enc.id);
    setDataAgendamento('');
  };

  const confirmarAgendamento = async (enc) => {
    if (!dataAgendamento) {
      toast.error('Informe a data do procedimento.');
      return;
    }
    // Ao agendar, a unidade externa envia a data para o paciente confirmar.
    try {
      await executarAcao(enc.id, 'agendar', { data_procedimento_unidade: dataAgendamento });
      toast.success('Encaminhamento atualizado com sucesso!');
      fetchEncaminhamentos();
      setAgendandoId(null);
      setDataAgendamento('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar encaminhamento.');
    }
  };

  const abrirModalRetorno = (enc) => {
    setEncRetorno(enc);
    setRetornoForm({ feedback_tipo: '', conduta: '' });
    setRetornoAberto(true);
  };

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
        feedback_tipo: retornoForm.feedback_tipo,
        feedback_conduta: retornoForm.conduta,
      });
      toast.success('Retorno enviado à UBS com sucesso!');
      setRetornoAberto(false);
      fetchEncaminhamentos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar retorno.');
    } finally {
      setEnviandoRetorno(false);
    }
  };

  const filtered = encaminhamentos.filter(e => filtroStatus === 'TODOS' || e.status === filtroStatus);

  return (
    <ExternaLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-background">Encaminhamentos</h1>
        <p className="text-on-surface-variant text-sm mt-1">Gerencie a fila da sua unidade externa.</p>
      </div>

      {/* Chips de filtro */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFiltroStatus(key)}
            className={`px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all border ${
              filtroStatus === key
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface-container-lowest text-on-surface-variant border-surface-variant hover:bg-surface-container-low'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de Cards */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-surface-container-high rounded-2xl"></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-surface-container-lowest border border-surface-variant rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30 mb-2">inbox</span>
          <p className="text-sm font-medium text-on-surface-variant">Nenhum encaminhamento nesta categoria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(enc => (
            <div key={enc.id} className="bg-surface-container-lowest p-4 md:p-5 rounded-2xl border border-surface-variant shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="w-full md:w-auto">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {/* Badge de Prioridade */}
                  {enc.prioridade && (
                    <span
                      className={`w-3 h-3 rounded-full block flex-shrink-0 ${
                        enc.prioridade === 'VERMELHO' ? 'bg-red-500' :
                        enc.prioridade === 'AMARELO' ? 'bg-yellow-400' :
                        'bg-green-500'
                      }`}
                      title={`Prioridade: ${enc.prioridade}`}
                    ></span>
                  )}
                  <h3 className="font-bold text-on-background text-base">{enc.paciente_nome}</h3>
                  <span className="text-xs font-mono bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant">
                    — {enc.paciente_cra || 'S/CRA'}
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  <p className="text-sm text-on-background font-medium">
                    Procedimento: <span className="font-bold text-primary">{enc.catalogo_nome || enc.especialidade}</span>
                  </p>
                  <p className="text-xs text-on-surface-variant">UBS origem: {enc.ubs_nome || enc.ubs_origem || 'UBS'}</p>
                  {enc.data_solicitacao && (
                    <p className="text-xs text-on-surface-variant">Solicitado em: {new Date(enc.data_solicitacao).toLocaleDateString('pt-BR')}</p>
                  )}
                  {enc.data_procedimento_unidade && (
                    <p className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded inline-flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">event</span>
                      Agendado para: {new Date(enc.data_procedimento_unidade).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                {/* Chip de Status Colorido (Design System tokens) */}
                <div className="inline-flex mt-1">
                  {enc.status === 'AGUARDANDO_VAGA' && <span className="px-2 py-1 text-xs font-bold rounded bg-orange-100 text-orange-700">Aguardando Recebimento</span>}
                  {enc.status === 'RECEBIDO' && <span className="px-2 py-1 text-xs font-bold rounded bg-blue-100 text-blue-700">Recebido na Unidade</span>}
                  {enc.status === 'AGUARDANDO_CONFIRMACAO' && <span className="px-2 py-1 text-xs font-bold rounded bg-gray-100 text-gray-600">Aguardando Confirmação</span>}
                  {enc.status === 'AGENDADO' && <span className="px-2 py-1 text-xs font-bold rounded bg-purple-100 text-purple-700">Agendado</span>}
                  {enc.status === 'CONFIRMADO_PACIENTE' && (
                    <span className="px-2 py-1 text-xs font-bold rounded bg-teal-100 text-teal-700">
                      Paciente Confirmado
                    </span>
                  )}
                  {enc.status === 'RETORNO_UBS' && (
                    <span className="px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-700 flex items-center gap-1">
                      Concluído ✓
                    </span>
                  )}
                </div>
                {enc.status === 'RETORNO_UBS' && enc.feedback_tipo && (
                  <div className="mt-2">
                    <span className="text-xs bg-surface-container-high text-on-surface-variant px-2 py-1 rounded border border-surface-variant">
                      {FEEDBACK_LABELS[enc.feedback_tipo] || enc.feedback_tipo}
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full md:w-auto border-t border-surface-variant pt-4 mt-2 md:mt-0 md:border-none md:pt-0 flex flex-col md:items-end gap-2">
                {/* Ações Específicas por Status */}
                {enc.status === 'AGUARDANDO_VAGA' && (
                  <button
                    onClick={() => confirmarRecebimento(enc.id)}
                    className="w-full h-12 md:w-auto px-5 bg-green-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Confirmar recebimento
                  </button>
                )}

                {enc.status === 'RECEBIDO' && (
                  agendandoId === enc.id ? (
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
                      <input
                        type="date"
                        value={dataAgendamento}
                        onChange={(e) => setDataAgendamento(e.target.value)}
                        className="px-3 py-2 h-12 bg-surface-container-lowest border border-surface-variant rounded-xl text-sm font-medium outline-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => confirmarAgendamento(enc)} className="h-12 px-4 flex-1 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center">
                          Confirmar
                        </button>
                        <button onClick={() => setAgendandoId(null)} className="h-12 px-4 bg-surface-container-high text-on-surface-variant font-bold rounded-xl hover:bg-surface-variant flex items-center justify-center">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => iniciarAgendamento(enc)}
                      className="w-full h-12 md:w-auto px-5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">event</span>
                      Agendar procedimento
                    </button>
                  )
                )}

                {enc.status === 'AGUARDANDO_CONFIRMACAO' && (
                  <span className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold text-center w-full md:w-auto block border border-gray-200">
                    Aguardando confirmação do paciente
                  </span>
                )}

                {['AGENDADO', 'CONFIRMADO_PACIENTE'].includes(enc.status) && (
                  <button
                    onClick={() => abrirModalRetorno(enc)}
                    className="w-full h-12 md:w-auto px-5 bg-purple-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-purple-700 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
                    Registrar retorno
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Retorno */}
      {retornoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !enviandoRetorno && setRetornoAberto(false)}></div>
          <form onSubmit={enviarRetorno} className="relative bg-surface-container-lowest rounded-3xl w-full max-w-lg shadow-2xl p-6">
            <h2 className="text-xl font-extrabold text-on-background mb-4">Registrar Retorno (UBS)</h2>
            <p className="text-sm text-on-surface-variant mb-4">
              Paciente: <strong>{encRetorno?.paciente_nome}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-on-surface-variant block mb-1">Resultado do Procedimento *</label>
                <select
                  required
                  value={retornoForm.feedback_tipo}
                  onChange={(e) => setRetornoForm(prev => ({ ...prev, feedback_tipo: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
                >
                  <option value="">Selecione...</option>
                  {Object.entries(FEEDBACK_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-on-surface-variant block mb-1">Conduta adotada *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Descreva a conduta clínica ou motivo de cancelamento (mín. 10 caracteres)"
                  value={retornoForm.conduta}
                  onChange={(e) => setRetornoForm(prev => ({ ...prev, conduta: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none resize-none"
                />
                <div className="text-right mt-1">
                  <span className={`text-xs ${retornoForm.conduta.length < 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {retornoForm.conduta.length}/10 min
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setRetornoAberto(false)}
                disabled={enviandoRetorno}
                className="flex-1 py-3 rounded-xl border border-surface-variant font-bold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviandoRetorno || retornoForm.conduta.length < 10 || !retornoForm.feedback_tipo}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {enviandoRetorno ? 'Enviando...' : 'Enviar Retorno à UBS'}
              </button>
            </div>
          </form>
        </div>
      )}

    </ExternaLayout>
  );
}
