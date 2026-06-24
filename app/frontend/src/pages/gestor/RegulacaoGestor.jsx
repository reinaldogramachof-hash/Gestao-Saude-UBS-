// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA: RegulacaoGestor.jsx
// FUNÇÃO: Gerencia os encaminhamentos de pacientes para a regulação de saúde
//         externa (CROSS) para CAPS, AMEs, UPAs, Hospitais e Centros de Especialidades.
//         Permite criar novos encaminhamentos, vincular exames/consultas existentes
//         (ponte de fluxo automática) e atualizar status inline.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import GestorLayout from '../../components/gestor/GestorLayout';
import api from '../../services/api';

// Paleta translúcida com borda fina de alta definição para as badges de prioridade
const PRIORIDADE_ESTILO = {
  VERMELHO: 'bg-red-500/10 text-red-855 border-red-500/25',
  AMARELO: 'bg-amber-500/10 text-amber-855 border-amber-500/25',
  VERDE: 'bg-emerald-500/10 text-emerald-855 border-emerald-500/25',
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

// Paleta translúcida com bolinha de cor sólida para simular status ativos
const STATUS_ESTILO = {
  AGUARDANDO_VAGA: {
    badge: 'bg-amber-500/10 text-amber-855 border-amber-500/25',
    dot: 'bg-amber-500',
  },
  AGENDADO: {
    badge: 'bg-blue-500/10 text-blue-850 border-blue-500/25',
    dot: 'bg-blue-500',
  },
  REALIZADO: {
    badge: 'bg-emerald-500/10 text-emerald-855 border-emerald-500/25',
    dot: 'bg-emerald-500',
  },
  CANCELADO: {
    badge: 'bg-gray-500/10 text-gray-750 border-gray-500/25',
    dot: 'bg-gray-500',
  },
};

export default function RegulacaoGestor() {
  const navigate = useNavigate();
  const [encaminhamentos, setEncaminhamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  // Controle de estados de novos encaminhamentos
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [criando, setCriando] = useState(false);

  const [pacientes, setPacientes] = useState([]);
  const [solicitacoesDisponiveis, setSolicitacoesDisponiveis] = useState([]);
  const [agendandoId, setAgendandoId] = useState(null);
  const [dataAgendamento, setDataAgendamento] = useState('');

  // Roteiro inicial limpo do formulário
  const FORM_INICIAL = {
    paciente_id:   '',
    destino:       '',
    especialidade: '',
    prioridade:    'AMARELO',
    observacoes:   '',
    solicitacao_id: '',
  };
  const [form, setForm] = useState(FORM_INICIAL);

  // Efetua a carga de encaminhamentos e pacientes no montante do componente
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
      console.error('[RegulacaoGestor] Erro ao carregar encaminhamentos:', err);
      toast.error('Não foi possível carregar os encaminhamentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Carrega as solicitações ativas do paciente selecionado para permitir bridge opcional
  const handlePacienteChange = async (pacienteId) => {
    setForm(prev => ({ ...prev, paciente_id: pacienteId, solicitacao_id: '' }));
    setSolicitacoesDisponiveis([]);
    if (!pacienteId) return;
    try {
      const { data } = await api.get(`/gestor/paciente/${pacienteId}`);
      const ativas = (data.solicitacoes || []).filter(s => !['concluido', 'cancelado'].includes(s.status));
      setSolicitacoesDisponiveis(ativas);
    } catch (err) {
      console.error('[RegulacaoGestor] Erro ao carregar solicitações do paciente:', err);
    }
  };

  // Envia os dados de criação para a API e atualiza a grade
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
      fetchEncaminhamentos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar encaminhamento.');
    } finally {
      setCriando(false);
    }
  };

  // Inicia o fluxo inline de inserção da data de agendamento na CROSS
  const iniciarAgendamento = (enc) => {
    setAgendandoId(enc.id);
    setDataAgendamento(enc.data_agendamento ? enc.data_agendamento.slice(0, 10) : '');
  };

  const cancelarAgendamento = () => {
    setAgendandoId(null);
    setDataAgendamento('');
  };

  const confirmarAgendamento = async (enc) => {
    if (!dataAgendamento) {
      toast.error('Informe a data do agendamento.');
      return;
    }
    await handleAtualizarStatus(enc, 'AGENDADO', dataAgendamento);
    cancelarAgendamento();
  };

  // Atualiza o status de vaga do encaminhamento
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

  // Calcula contagem de encaminhamentos com SLA vencido com base na prioridade e dias na fila
  const vencidos = encaminhamentos.filter(e => 
    e.status === 'AGUARDANDO_VAGA' && 
    ((e.prioridade === 'VERMELHO' && e.dias_na_fila > 2) || 
     (e.prioridade === 'AMARELO' && e.dias_na_fila > 15))
  ).length;

  return (
    <GestorLayout>
      {/* ── Cabeçalho Principal ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8 select-none animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">Regulação Externa</h1>
          <p className="text-on-surface-variant font-semibold mt-1 text-sm">Gerencie os encaminhamentos para CAPS, AMEs, UPAs e Hospitais via CROSS.</p>
        </div>
        <button
          onClick={() => setModalCriarAberto(true)}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined">post_add</span>
          Novo Encaminhamento
        </button>
      </div>

      {/* ── Alerta de SLA Vencido Premium (HSL & Pulsante) ── */}
      {vencidos > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 shadow-sm animate-pulse select-none">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-red-600">warning</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-red-800 text-sm md:text-base">Alerta de SLAs Vencidos</h3>
            <p className="text-xs md:text-sm text-red-700 font-semibold mt-1 leading-relaxed">
              Existem <strong>{vencidos} paciente(s) prioritário(s)</strong> aguardando vaga acima do tempo máximo aceitável. Contate a CROSS com urgência.
            </p>
          </div>
        </div>
      )}

      {/* ── Abas de Filtro de Status (Pílula Deslizante) ── */}
      <div className="flex bg-surface-container-high/50 backdrop-blur-md p-1 rounded-xl max-w-2xl mb-6 border border-surface-variant/30 select-none overflow-x-auto">
        {['TODOS', 'AGUARDANDO_VAGA', 'AGENDADO', 'REALIZADO'].map(status => (
          <button
            key={status}
            type="button"
            onClick={() => setFiltroStatus(status)}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs md:text-sm whitespace-nowrap transition-all duration-200 ${
              filtroStatus === status
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {status === 'TODOS' ? 'Todos' : STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* ── Tabela de Encaminhamentos de Alta Definição ── */}
      <div className="bg-surface-container-lowest rounded-3xl border border-surface-variant shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left relative">
            <thead className="sticky top-0 z-10 bg-surface-container-low/90 border-b border-surface-variant shadow-sm backdrop-blur-md select-none">
              <tr className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="p-4 md:p-5">Paciente</th>
                <th className="p-4 md:p-5">Destino / Especialidade</th>
                <th className="p-4 md:p-5">Prioridade</th>
                <th className="p-4 md:p-5">Tempo na Fila</th>
                <th className="p-4 md:p-5">Status</th>
                <th className="p-4 md:p-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {loading ? (
                <tr className="animate-pulse select-none">
                  <td colSpan="6" className="p-8 text-center text-on-surface-variant font-semibold">
                    Carregando encaminhamentos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr className="select-none">
                  <td colSpan="6" className="p-16 text-center text-on-surface-variant font-semibold">
                    Nenhum encaminhamento localizado para este filtro.
                  </td>
                </tr>
              ) : (
                filtered.map((enc) => {
                  const isCritico = enc.status === 'AGUARDANDO_VAGA' && 
                    ((enc.prioridade === 'VERMELHO' && enc.dias_na_fila > 2) || 
                     (enc.prioridade === 'AMARELO' && enc.dias_na_fila > 15));

                  return (
                    <tr key={enc.id} className={`hover:bg-surface-container-low/30 transition-colors ${isCritico ? 'bg-red-500/5' : ''}`}>
                      {/* Dados do Paciente */}
                      <td className="p-4 md:p-5">
                        <div className="font-bold text-on-background">{enc.paciente_nome}</div>
                        <div className="text-xs text-on-surface-variant font-semibold mt-0.5 select-none">
                          Sol.: {new Date(enc.data_solicitacao).toLocaleDateString('pt-BR')}
                        </div>
                      </td>

                      {/* Destino / Unidade e Especialidade */}
                      <td className="p-4 md:p-5">
                        <div className="font-bold text-on-background">{enc.destino}</div>
                        <div className="text-xs text-on-surface-variant font-semibold mt-0.5">{enc.especialidade}</div>
                      </td>

                      {/* Prioridade Translúcida */}
                      <td className="p-4 md:p-5 select-none">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${PRIORIDADE_ESTILO[enc.prioridade]}`}>
                          {PRIORIDADE_LABELS[enc.prioridade] || enc.prioridade}
                        </span>
                      </td>

                      {/* Tempo na Fila (com realce de SLA) */}
                      <td className="p-4 md:p-5">
                        {enc.status === 'AGUARDANDO_VAGA' ? (
                          <div className={`font-black text-sm ${isCritico ? 'text-red-655 animate-pulse' : 'text-on-background'}`}>
                            {enc.dias_na_fila} dias
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/65 text-sm select-none">—</span>
                        )}
                      </td>

                      {/* Status com Bolinha Sólida */}
                      <td className="p-4 md:p-5 select-none">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          STATUS_ESTILO[enc.status]?.badge || 'bg-gray-500/10 text-gray-750 border-gray-500/25'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            STATUS_ESTILO[enc.status]?.dot || 'bg-gray-500'
                          } ${enc.status === 'AGUARDANDO_VAGA' ? 'animate-pulse' : ''}`} />
                          {STATUS_LABELS[enc.status]}
                        </span>
                      </td>

                      {/* Ações contextuais e atalhos */}
                      <td className="p-4 md:p-5 text-right select-none">
                        <div className="flex items-center justify-end gap-2">
                          {/* Agendamento inline moderno */}
                          {agendandoId === enc.id ? (
                            <div className="flex items-center gap-1.5 bg-surface-container-high/60 border border-surface-variant/50 p-1 rounded-xl shadow-inner animate-scale-up">
                              <input
                                type="date"
                                value={dataAgendamento}
                                onChange={(e) => setDataAgendamento(e.target.value)}
                                className="px-2.5 py-1.5 text-xs bg-white border border-outline-variant rounded-lg outline-none font-semibold text-on-surface"
                              />
                              <button
                                onClick={() => confirmarAgendamento(enc)}
                                className="w-8 h-8 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-850 rounded-lg transition-colors flex items-center justify-center border border-emerald-500/20 active:scale-95"
                                title="Confirmar data"
                              >
                                <span className="material-symbols-outlined text-base font-black">check</span>
                              </button>
                              <button
                                onClick={cancelarAgendamento}
                                className="w-8 h-8 bg-red-500/10 hover:bg-red-500/20 text-red-800 rounded-lg transition-colors flex items-center justify-center border border-red-500/20 active:scale-95"
                                title="Cancelar"
                              >
                                <span className="material-symbols-outlined text-base font-black">close</span>
                              </button>
                            </div>
                          ) : (
                            <>
                              {enc.status === 'AGUARDANDO_VAGA' && (
                                <button
                                  onClick={() => iniciarAgendamento(enc)}
                                  className="px-3.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 border border-blue-500/20 font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm"
                                >
                                  Marcar Agendado
                                </button>
                              )}
                              {enc.status === 'AGENDADO' && (
                                <button
                                  onClick={() => handleAtualizarStatus(enc, 'REALIZADO')}
                                  className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border border-emerald-500/20 font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm"
                                >
                                  Marcar Realizado
                                </button>
                              )}
                            </>
                          )}

                          {/* Atalho Clínico de Prontuários */}
                          <button
                            onClick={() => navigate('/gestor/paciente/' + enc.paciente_id)}
                            className="w-9 h-9 bg-surface-container-high hover:bg-primary text-on-surface hover:text-white border border-surface-variant/60 hover:border-primary rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                            title="Ver Prontuário"
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
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalCriarAberto(false)} />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-surface-variant/40 transition-all animate-scale-up">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center shrink-0 select-none">
              <h3 className="text-xl font-extrabold text-on-background">Novo Encaminhamento</h3>
              <button onClick={() => setModalCriarAberto(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleCriar} className="p-6 md:p-8 space-y-5 overflow-y-auto">

              {/* Paciente */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Paciente*</label>
                <select
                  required
                  value={form.paciente_id}
                  onChange={e => handlePacienteChange(e.target.value)}
                  className="w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-semibold text-sm transition-all"
                >
                  <option value="">Selecione o paciente</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              {/* Destino */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Unidade de Destino*</label>
                <select
                  required
                  value={form.destino}
                  onChange={e => setForm(prev => ({ ...prev, destino: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-semibold text-sm transition-all"
                >
                  <option value="">Selecione a unidade</option>
                  <option value="AME">AME</option>
                  <option value="CAPS">CAPS</option>
                  <option value="UPA">UPA</option>
                  <option value="HOSPITAL_MUNICIPAL">Hospital Municipal</option>
                  <option value="CENTRO_ESPECIALIDADES">Centro de Especialidades</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>

              {/* Especialidade */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Especialidade / Procedimento*</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Ortopedia, Psiquiatria, Tomografia..."
                  value={form.especialidade}
                  onChange={e => setForm(prev => ({ ...prev, especialidade: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-semibold text-sm transition-all"
                />
              </div>

              {/* Prioridade em Chips */}
              <div className="space-y-2 select-none">
                <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Grau de Prioridade*</label>
                <div className="flex gap-2.5">
                  {[
                    { valor: 'VERDE',    label: 'Baixa',  cor: 'bg-emerald-500/10 text-emerald-855 border-emerald-500/25' },
                    { valor: 'AMARELO',  label: 'Média',  cor: 'bg-amber-500/10 text-amber-855 border-amber-500/25' },
                    { valor: 'VERMELHO', label: 'Alta',   cor: 'bg-red-500/10 text-red-855 border-red-500/25' },
                  ].map(p => (
                    <button
                      key={p.valor}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, prioridade: p.valor }))}
                      className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold transition-all duration-255 active:scale-95 flex items-center justify-center gap-1.5 ${
                        form.prioridade === p.valor
                          ? p.cor + ' border-current shadow-sm'
                          : 'bg-surface-container-high/60 text-on-surface-variant border-transparent hover:bg-surface-container-high'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bridge/Vínculo de Solicitação (Exibição Condicional de Alta Fidelidade) */}
              {solicitacoesDisponiveis.length > 0 && (
                <div className="text-xs text-primary bg-primary/5 border border-primary/20 rounded-2xl p-4 shadow-inner space-y-2">
                  <label className="font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">link</span>
                    Vincular a Solicitação (Opcional)
                  </label>
                  <select
                    value={form.solicitacao_id}
                    onChange={e => setForm(prev => ({ ...prev, solicitacao_id: e.target.value }))}
                    className="w-full h-12 px-4 bg-white border border-surface-variant/40 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-semibold text-sm transition-all"
                  >
                    <option value="">Sem vínculo (encaminhamento avulso)</option>
                    {solicitacoesDisponiveis.map(s => (
                      <option key={s.id} value={s.id}>{s.descricao_paciente} — {STATUS_LABELS[s.status] || s.status}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-on-surface-variant/90 font-medium leading-relaxed">
                    Se selecionado, o status da solicitação na fila avançará para <strong>"Aguardando Regulação"</strong> automaticamente.
                  </p>
                </div>
              )}

              {/* Observações */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Observações (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Anotações complementares sobre triagem ou laudo CROSS..."
                  value={form.observacoes}
                  onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-semibold text-sm transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2 select-none">
                <button type="button" onClick={() => setModalCriarAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline-variant text-on-surface font-bold hover:bg-surface-container-low transition-colors text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={criando} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold hover:shadow-md transition-all active:scale-95 text-sm disabled:opacity-50">
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
