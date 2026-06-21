/**
 * PÁGINA: RegulacaoGestor.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Gerencia os encaminhamentos de pacientes para a regulação de saúde externa (CROSS).
 * API: GET /api/gestor/encaminhamentos
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import GestorLayout from '../../components/gestor/GestorLayout';
import api from '../../services/api';

const PRIORIDADE_CORES = {
  VERMELHO: 'bg-red-100 text-red-800 border-red-200',
  AMARELO: 'bg-amber-100 text-amber-800 border-amber-200',
  VERDE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const PRIORIDADE_LABELS = {
  VERMELHO: 'Alta',
  AMARELO:  'Média',
  VERDE:    'Baixa',
};

const STATUS_LABELS = {
  AGUARDANDO_VAGA: 'Aguardando Vaga',
  AGENDADO: 'Agendado',
  REALIZADO: 'Realizado',
  CANCELADO: 'Cancelado',
};

export default function RegulacaoGestor() {
  const navigate = useNavigate();
  const [encaminhamentos, setEncaminhamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  // Estados do modal de criação
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [criando, setCriando] = useState(false);

  // Lista de pacientes para o select
  const [pacientes, setPacientes] = useState([]);

  // Solicitações ativas do paciente selecionado (para o bridge opcional)
  const [solicitacoesDisponiveis, setSolicitacoesDisponiveis] = useState([]);
  const [agendandoId, setAgendandoId] = useState(null);
  const [dataAgendamento, setDataAgendamento] = useState('');

  // Formulário de novo encaminhamento
  const FORM_INICIAL = {
    paciente_id:   '',
    destino:       '',
    especialidade: '',
    prioridade:    'AMARELO',
    observacoes:   '',
    solicitacao_id: '',
  };
  const [form, setForm] = useState(FORM_INICIAL);

  // Carrega encaminhamentos e lista de pacientes ao montar o componente
  useEffect(() => {
    fetchEncaminhamentos();
    api.get('/gestor/pacientes').then(r => setPacientes(r.data)).catch(() => {});
  }, []);

  const fetchEncaminhamentos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/gestor/encaminhamentos');
      setEncaminhamentos(data);
    } catch (err) {
      console.error('[RegulacaoGestor]', err);
      toast.error('Não foi possível carregar os encaminhamentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Quando o gestor seleciona um paciente, carrega as solicitações ativas dele
  // para permitir o bridge opcional com a regulação.
  const handlePacienteChange = async (pacienteId) => {
    setForm(prev => ({ ...prev, paciente_id: pacienteId, solicitacao_id: '' }));
    setSolicitacoesDisponiveis([]);
    if (!pacienteId) return;
    try {
      const { data } = await api.get(`/gestor/paciente/${pacienteId}`);
      // O endpoint /gestor/paciente/:id retorna o paciente com suas solicitações em data.solicitacoes
      const ativas = (data.solicitacoes || []).filter(s => !['concluido', 'cancelado'].includes(s.status));
      setSolicitacoesDisponiveis(ativas);
    } catch (err) {
      console.error('Erro ao carregar solicitações do paciente', err);
    }
  };

  // Cria o encaminhamento via POST e atualiza a lista localmente
  const handleCriar = async (e) => {
    e.preventDefault();
    setCriando(true);
    try {
      await api.post('/gestor/encaminhamento', {
        ...form,
        paciente_id:    Number(form.paciente_id),
        solicitacao_id: form.solicitacao_id ? Number(form.solicitacao_id) : null,
      });
      toast.success('Encaminhamento criado com sucesso!');
      setModalCriarAberto(false);
      setForm(FORM_INICIAL);
      setSolicitacoesDisponiveis([]);
      fetchEncaminhamentos(); // re-fetch da lista
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar encaminhamento.');
    } finally {
      setCriando(false);
    }
  };

  // Atualiza status do encaminhamento inline na tabela.
  // Para AGENDADO: usa window.prompt para data (solução simples para MVP).
  // Para REALIZADO: confirmação direta.
  // Abre a edicao inline da data. Evita window.prompt, que pode ser bloqueado
  // em navegadores mobile durante a demo em producao.
  const iniciarAgendamento = (enc) => {
    setAgendandoId(enc.id);
    setDataAgendamento(enc.data_agendamento ? enc.data_agendamento.slice(0, 10) : '');
  };

  // Cancela a escolha de data sem acionar a API.
  const cancelarAgendamento = () => {
    setAgendandoId(null);
    setDataAgendamento('');
  };

  // Confirma o agendamento somente quando uma data foi preenchida.
  const confirmarAgendamento = async (enc) => {
    if (!dataAgendamento) {
      toast.error('Informe a data do agendamento.');
      return;
    }

    await handleAtualizarStatus(enc, 'AGENDADO', dataAgendamento);
    cancelarAgendamento();
  };

  const handleAtualizarStatus = async (enc, novoStatus, data_agendamento = null) => {
    try {
      await api.put(`/gestor/encaminhamento/${enc.id}/status`, {
        status_novo: novoStatus,
        data_agendamento,
      });
      toast.success(`Encaminhamento atualizado para ${STATUS_LABELS[novoStatus]}.`);
      fetchEncaminhamentos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar status.');
    }
  };

  const filtered = encaminhamentos.filter(enc => 
    filtroStatus === 'TODOS' || enc.status === filtroStatus
  );

  // Métrica de alertas
  const vencidos = encaminhamentos.filter(e => 
    e.status === 'AGUARDANDO_VAGA' && 
    ((e.prioridade === 'VERMELHO' && e.dias_na_fila > 2) || 
     (e.prioridade === 'AMARELO' && e.dias_na_fila > 15))
  ).length;

  return (
    <GestorLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-background">Regulação Externa</h1>
          <p className="text-on-surface-variant mt-1">Gerencie os encaminhamentos para CAPS, AMEs, UPAs e Hospitais.</p>
        </div>
        <button
          onClick={() => setModalCriarAberto(true)}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined">post_add</span>
          Novo Encaminhamento
        </button>
      </div>

      {vencidos > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 shadow-sm animate-pulse">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-red-600">warning</span>
          </div>
          <div>
            <h3 className="font-bold text-red-800">Alerta de SLAs Vencidos</h3>
            <p className="text-sm text-red-700 mt-1">
              Existem {vencidos} pacientes prioritários aguardando vaga acima do tempo máximo aceitável. Contate a CROSS.
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-variant overflow-hidden mb-6">
        <div className="p-4 border-b border-surface-variant flex gap-2 overflow-x-auto no-scrollbar">
          {['TODOS', 'AGUARDANDO_VAGA', 'AGENDADO', 'REALIZADO'].map(status => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                filtroStatus === status
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {status === 'TODOS' ? 'Todos' : STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-lowest border-b border-surface-variant text-sm text-on-surface-variant">
              <tr>
                <th className="px-6 py-4 font-semibold">Paciente</th>
                <th className="px-6 py-4 font-semibold">Destino</th>
                <th className="px-6 py-4 font-semibold">Prioridade</th>
                <th className="px-6 py-4 font-semibold">Tempo na Fila</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-on-surface-variant">
                    Carregando encaminhamentos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-on-surface-variant">
                    Nenhum encaminhamento encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((enc) => {
                  const isCritico = enc.status === 'AGUARDANDO_VAGA' && 
                    ((enc.prioridade === 'VERMELHO' && enc.dias_na_fila > 2) || 
                     (enc.prioridade === 'AMARELO' && enc.dias_na_fila > 15));

                  return (
                    <tr key={enc.id} className={`hover:bg-surface-container-lowest transition-colors ${isCritico ? 'bg-red-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-on-background">{enc.paciente_nome}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">
                          Sol: {new Date(enc.data_solicitacao).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-on-background">{enc.destino}</div>
                        <div className="text-sm text-on-surface-variant">{enc.especialidade}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${PRIORIDADE_CORES[enc.prioridade]}`}>
                          {PRIORIDADE_LABELS[enc.prioridade] || enc.prioridade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {enc.status === 'AGUARDANDO_VAGA' ? (
                          <div className={`font-bold ${isCritico ? 'text-red-600' : 'text-on-background'}`}>
                            {enc.dias_na_fila} dias
                          </div>
                        ) : (
                          <span className="text-on-surface-variant">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                          enc.status === 'AGUARDANDO_VAGA' ? 'bg-amber-100 text-amber-800' :
                          enc.status === 'AGENDADO' ? 'bg-blue-100 text-blue-800' :
                          enc.status === 'REALIZADO' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            enc.status === 'AGUARDANDO_VAGA' ? 'bg-amber-500 animate-pulse' :
                            enc.status === 'AGENDADO' ? 'bg-blue-500' :
                            enc.status === 'REALIZADO' ? 'bg-emerald-500' :
                            'bg-gray-500'
                          }`} />
                          {STATUS_LABELS[enc.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Fluxo de Agendamento Inline (Evita window.prompt no iOS) */}
                          {agendandoId === enc.id ? (
                            <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-surface-variant">
                              <input
                                type="date"
                                value={dataAgendamento}
                                onChange={(e) => setDataAgendamento(e.target.value)}
                                className="px-2 py-1 text-xs bg-surface-container-highest border border-outline rounded-lg outline-none font-medium text-on-surface"
                              />
                              <button
                                onClick={() => confirmarAgendamento(enc)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center"
                                title="Confirmar"
                              >
                                <span className="material-symbols-outlined text-sm">check</span>
                              </button>
                              <button
                                onClick={cancelarAgendamento}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                                title="Cancelar"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Avançar status */}
                              {enc.status === 'AGUARDANDO_VAGA' && (
                                <button
                                  onClick={() => iniciarAgendamento(enc)}
                                  className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  Marcar Agendado
                                </button>
                              )}
                              {enc.status === 'AGENDADO' && (
                                <button
                                  onClick={() => handleAtualizarStatus(enc, 'REALIZADO')}
                                  className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                                >
                                  Marcar Realizado
                                </button>
                              )}
                            </>
                          )}
                          {/* Ver paciente */}
                          <button
                            onClick={() => navigate('/gestor/paciente/' + enc.paciente_id)}
                            className="text-primary hover:bg-primary/10 p-2 rounded-lg text-sm transition-colors"
                            title="Ver Paciente"
                          >
                            <span className="material-symbols-outlined text-lg">open_in_new</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* ── Modal: Novo Encaminhamento ── */}
      {modalCriarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalCriarAberto(false)} />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <header className="p-6 border-b border-surface-variant flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-on-background">Novo Encaminhamento</h3>
              <button onClick={() => setModalCriarAberto(false)} className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </header>
            <form onSubmit={handleCriar} className="p-6 space-y-4">

              {/* Paciente */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Paciente *</label>
                <select
                  required
                  value={form.paciente_id}
                  onChange={e => handlePacienteChange(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
                >
                  <option value="">Selecione o paciente</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              {/* Destino */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Destino *</label>
                <select
                  required
                  value={form.destino}
                  onChange={e => setForm(prev => ({ ...prev, destino: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
                >
                  <option value="">Selecione</option>
                  <option value="AME">AME</option>
                  <option value="CAPS">CAPS</option>
                  <option value="UPA">UPA</option>
                  <option value="HOSPITAL_MUNICIPAL">Hospital Municipal</option>
                  <option value="CENTRO_ESPECIALIDADES">Centro de Especialidades</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>

              {/* Especialidade */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Especialidade *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Ortopedia, Psiquiatria, Cardiologia..."
                  value={form.especialidade}
                  onChange={e => setForm(prev => ({ ...prev, especialidade: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
                />
              </div>

              {/* Prioridade */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Prioridade *</label>
                <div className="flex gap-2">
                  {[
                    { valor: 'VERDE',    label: 'Baixa',  cor: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                    { valor: 'AMARELO',  label: 'Média',  cor: 'bg-amber-100 text-amber-800 border-amber-300' },
                    { valor: 'VERMELHO', label: 'Alta',   cor: 'bg-red-100 text-red-800 border-red-300' },
                  ].map(p => (
                    <button
                      key={p.valor}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, prioridade: p.valor }))}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                        form.prioridade === p.valor
                          ? p.cor + ' border-current'
                          : 'bg-surface-container-high text-on-surface-variant border-transparent'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bridge: solicitação ativa (opcional) */}
              {solicitacoesDisponiveis.length > 0 && (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-on-surface-variant">
                    Vincular a solicitação <span className="font-normal text-on-surface-variant/60">(opcional)</span>
                  </label>
                  <select
                    value={form.solicitacao_id}
                    onChange={e => setForm(prev => ({ ...prev, solicitacao_id: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
                  >
                    <option value="">Sem vínculo (encaminhamento avulso)</option>
                    {solicitacoesDisponiveis.map(s => (
                      <option key={s.id} value={s.id}>{s.descricao_paciente} — {s.status}</option>
                    ))}
                  </select>
                  <p className="text-xs text-on-surface-variant">
                    Se vinculado, a solicitação avançará para "Aguardando Regulação" automaticamente.
                  </p>
                </div>
              )}

              {/* Observações */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Observações <span className="font-normal">(opcional)</span></label>
                <textarea
                  rows={2}
                  placeholder="Ex: Paciente já passou por triagem, urgência clínica documentada..."
                  value={form.observacoes}
                  onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalCriarAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline font-bold text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={criando} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold text-sm disabled:opacity-50">
                  {criando ? 'Criando...' : 'Criar Encaminhamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GestorLayout>
  );
}
