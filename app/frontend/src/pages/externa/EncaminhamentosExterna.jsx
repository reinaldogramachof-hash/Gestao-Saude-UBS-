/**
 * PÁGINA: EncaminhamentosExterna.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Listagem e gestão do fluxo de encaminhamentos na visão da unidade externa.
 * API: GET /api/externa/encaminhamentos
 *      PUT /api/externa/encaminhamento/:id/status
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import ExternaLayout from '../../components/externa/ExternaLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  TODOS: 'Todos',
  AGUARDANDO_VAGA: 'Pendentes (Aguardando)',
  RECEBIDO: 'Recebidos (Para Agendar)',
  AGUARDANDO_CONFIRMACAO: 'Aguardando Confirmação',
  CONFIRMADO_PACIENTE: 'Confirmados (Para Retorno)',
  RETORNO_UBS: 'Concluídos (Retorno UBS)'
};

const RESULTADOS_PROCEDIMENTO = [
  'Realizado sem intercorrências',
  'Realizado com intercorrências',
  'Cancelado — paciente ausente',
  'Cancelado — contraindicado',
  'Necessita retorno/reavaliação',
  'Encaminhado para especialidade',
  'Internação necessária'
];

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
  const [retornoForm, setRetornoForm] = useState({ resultado: '', conduta: '' });
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

  const handleAtualizarStatus = async (id, novoStatus, payloadAdicional = {}) => {
    try {
      await api.put(`/externa/encaminhamento/${id}/status`, {
        status_novo: novoStatus,
        ...payloadAdicional
      });
      toast.success('Encaminhamento atualizado com sucesso!');
      fetchEncaminhamentos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar encaminhamento.');
    }
  };

  const confirmarRecebimento = (id) => {
    handleAtualizarStatus(id, 'RECEBIDO');
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
    // Ao agendar a unidade externa manda para o paciente confirmar
    await handleAtualizarStatus(enc.id, 'AGUARDANDO_CONFIRMACAO', { data_agendamento: dataAgendamento });
    setAgendandoId(null);
    setDataAgendamento('');
  };

  const abrirModalRetorno = (enc) => {
    setEncRetorno(enc);
    setRetornoForm({ resultado: '', conduta: '' });
    setRetornoAberto(true);
  };

  const enviarRetorno = async (e) => {
    e.preventDefault();
    if (!retornoForm.resultado) {
      toast.error('Selecione o resultado do procedimento.');
      return;
    }
    if (retornoForm.conduta.length < 20) {
      toast.error('A conduta/observação deve ter no mínimo 20 caracteres.');
      return;
    }
    setEnviandoRetorno(true);
    try {
      await api.put(`/externa/encaminhamento/${encRetorno.id}/status`, {
        status_novo: 'RETORNO_UBS',
        resultado: retornoForm.resultado,
        conduta: retornoForm.conduta,
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
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-on-background text-base">{enc.paciente_nome}</h3>
                  <span className="text-xs font-mono bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant">
                    {enc.paciente_cra || 'S/CRA'}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant mb-2">Origem: {enc.ubs_origem || 'UBS'}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">
                    {enc.especialidade}
                  </span>
                  {enc.prioridade && (
                    <span className={`text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-wide border ${
                      enc.prioridade === 'VERMELHO' ? 'bg-red-50 text-red-700 border-red-200' :
                      enc.prioridade === 'AMARELO' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {enc.prioridade === 'VERMELHO' ? 'ALTA' : enc.prioridade === 'AMARELO' ? 'MÉDIA' : 'BAIXA'}
                    </span>
                  )}
                  {enc.data_agendamento && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {new Date(enc.data_agendamento).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full md:w-auto border-t border-surface-variant pt-3 md:border-none md:pt-0 flex md:flex-col md:items-end justify-between items-center gap-2">
                {/* Status em texto se não houver botão, ou no lugar do botão dependendo do state */}
                
                {enc.status === 'AGUARDANDO_VAGA' && (
                  <button
                    onClick={() => confirmarRecebimento(enc.id)}
                    className="w-full md:w-auto px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Confirmar Recebimento
                  </button>
                )}

                {enc.status === 'RECEBIDO' && (
                  agendandoId === enc.id ? (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <input
                        type="datetime-local"
                        value={dataAgendamento}
                        onChange={(e) => setDataAgendamento(e.target.value)}
                        className="px-3 py-2 bg-surface-container-high border border-outline rounded-xl text-sm outline-none"
                      />
                      <button onClick={() => confirmarAgendamento(enc)} className="p-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200">
                        <span className="material-symbols-outlined">check</span>
                      </button>
                      <button onClick={() => setAgendandoId(null)} className="p-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => iniciarAgendamento(enc)}
                      className="w-full md:w-auto px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-100 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">event</span>
                      Agendar Procedimento
                    </button>
                  )
                )}

                {enc.status === 'AGUARDANDO_CONFIRMACAO' && (
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold text-center w-full md:w-auto block">
                    Aguardando confirmação do paciente
                  </span>
                )}

                {enc.status === 'CONFIRMADO_PACIENTE' && (
                  <button
                    onClick={() => abrirModalRetorno(enc)}
                    className="w-full md:w-auto px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
                    Registrar Retorno
                  </button>
                )}

                {enc.status === 'RETORNO_UBS' && (
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 w-full md:w-auto justify-center">
                    <span className="material-symbols-outlined text-[14px]">task_alt</span>
                    Concluído
                  </span>
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
                  value={retornoForm.resultado}
                  onChange={(e) => setRetornoForm(prev => ({ ...prev, resultado: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
                >
                  <option value="">Selecione...</option>
                  {RESULTADOS_PROCEDIMENTO.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-on-surface-variant block mb-1">Conduta e Observações *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Descreva a conduta clínica ou motivo de cancelamento (min. 20 caracteres)"
                  value={retornoForm.conduta}
                  onChange={(e) => setRetornoForm(prev => ({ ...prev, conduta: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none resize-none"
                />
                <div className="text-right mt-1">
                  <span className={`text-xs ${retornoForm.conduta.length < 20 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {retornoForm.conduta.length}/20 min
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
                disabled={enviandoRetorno || retornoForm.conduta.length < 20 || !retornoForm.resultado}
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
