/**
 * PÁGINA: AgendamentosGestor.jsx — Épico 4 + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Gerencia slots de atendimento, cria horários únicos ou repetidos,
 *         resume a agenda e vincula reservas ao perfil do paciente.
 * PROPS: Nenhuma. Usa useNavigate para abrir pacientes vinculados.
 *         Usa GestorLayout para layout responsivo.
 *         Cards adaptativos para mobile com ações contextuais.
 *
 * API: GET    /api/gestor/agendamentos
 *      POST   /api/gestor/agendamento
 *      PUT    /api/gestor/agendamento/:id
 *      DELETE /api/gestor/agendamento/:id
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import GestorLayout from '../../components/gestor/GestorLayout';

const STATUS_COLORS = {
  disponivel: 'bg-emerald-100 text-emerald-700',
  reservado:  'bg-amber-100 text-amber-700',
  concluido:  'bg-gray-100 text-gray-600',
  cancelado:  'bg-red-100 text-red-600',
};

const STATUS_LABEL = {
  disponivel: 'Disponível',
  reservado:  'Reservado',
  concluido:  'Concluído',
  cancelado:  'Cancelado',
};

export default function AgendamentosGestor() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({
    data_inicio:          '',
    hora_inicio:          '08:00',
    hora_fim:             '12:00',
    intervalo_minutos:    30,
    repetir_dias:         1,
    pular_fins_de_semana: true,
  });

  const carregarAgendamentos = () => {
    setLoading(true);
    setErro('');
    api.get('/gestor/agendamentos')
      .then(r => setAgendamentos(r.data))
      .catch(() => setErro('Não foi possível carregar os agendamentos.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregarAgendamentos(); }, []);

  // Filtragem local por status sem nova requisição
  const agendamentosFiltrados = filtroStatus === 'todos'
    ? agendamentos
    : agendamentos.filter(a => a.status === filtroStatus);

  // Agrupa agendamentos filtrados por data (YYYY-MM-DD)
  const agrupados = agendamentosFiltrados.reduce((acc, ag) => {
    const dia = ag.data_hora.slice(0, 10);
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(ag);
    return acc;
  }, {});

  const diasOrdenados = Object.keys(agrupados).sort();

  // O resumo usa a lista completa para não mudar quando o gestor troca de aba.
  const hoje = new Date().toDateString();
  const resumo = {
    disponiveis: agendamentos.filter((item) => item.status === 'disponivel').length,
    reservados: agendamentos.filter((item) => item.status === 'reservado').length,
    concluidosHoje: agendamentos.filter(
      (item) => item.status === 'concluido' && new Date(item.data_hora).toDateString() === hoje
    ).length,
  };

  // Criar nova grade de horários em lote
  const handleCriar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const { data } = await api.post('/gestor/agendamentos/lote', form);
      toast.success(`${data.criados} horário(s) criado(s) com sucesso!`);
      setModalAberto(false);
      setForm({ data_inicio: '', hora_inicio: '08:00', hora_fim: '12:00',
                intervalo_minutos: 30, repetir_dias: 1, pular_fins_de_semana: true });
      carregarAgendamentos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar grade de horários.');
    } finally {
      setEnviando(false);
    }
  };

  const handleAtualizarStatus = async (id, novoStatus) => {
    try {
      await api.put(`/gestor/agendamento/${id}`, { status: novoStatus });
      toast.success(`Marcado como "${STATUS_LABEL[novoStatus]}".`);
      carregarAgendamentos();
    } catch {
      toast.error('Erro ao atualizar agendamento.');
    }
  };

  const handleExcluir = async (id) => {
    try {
      await api.delete(`/gestor/agendamento/${id}`);
      toast.success('Horário removido.');
      setAgendamentos(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao excluir.');
    }
  };

  const ABAS = [
    { label: 'Todos', value: 'todos' },
    { label: 'Disponíveis', value: 'disponivel' },
    { label: 'Reservados', value: 'reservado' },
    { label: 'Concluídos', value: 'concluido' },
  ];

  return (
    <GestorLayout>
      {/* ── Cabeçalho responsivo ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">Agendamentos</h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm">Gerencie os horários de atendimento.</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined">add</span>
          Novo Horário
        </button>
      </div>

      {/* Resumo derivado localmente da agenda já carregada. */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
        {[
          { label: 'Disponíveis', valor: resumo.disponiveis, cor: 'text-emerald-700' },
          { label: 'Reservados', valor: resumo.reservados, cor: 'text-amber-700' },
          { label: 'Concluídos hoje', valor: resumo.concluidosHoje, cor: 'text-primary' },
        ].map((item) => (
          <div key={item.label} className="bg-surface-container-lowest rounded-2xl border border-surface-variant shadow-sm p-3 md:p-5 text-center">
            <p className={`text-2xl md:text-3xl font-extrabold ${item.cor}`}>{item.valor}</p>
            <p className="text-xs md:text-sm font-bold text-on-surface-variant mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs de filtro com scroll horizontal ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {ABAS.map(aba => (
          <button
            key={aba.value}
            onClick={() => setFiltroStatus(aba.value)}
            className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${filtroStatus === aba.value ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'}`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* ── Lista de Agendamentos ── */}
      {loading ? (
        <div className="space-y-4">{Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-surface-container-low rounded-2xl animate-pulse" />)}</div>
      ) : erro ? (
        <div className="py-16 text-center bg-surface-container-lowest rounded-2xl border border-red-200">
          <p className="font-bold text-on-background">{erro}</p>
          <button onClick={carregarAgendamentos} className="mt-4 h-12 px-6 bg-primary text-white font-bold rounded-2xl">Tentar novamente</button>
        </div>
      ) : agendamentosFiltrados.length > 0 ? (
        <div className="space-y-4 md:space-y-6">
          {diasOrdenados.map(dia => (
            <div key={dia}>
              {/* Cabeçalho de Data Agrupada */}
              <div className="sticky top-0 z-10 bg-surface-container-low px-2 py-2 border-b border-surface-variant mb-3 mt-4 first:mt-0">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  {new Date(dia + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long', day: '2-digit', month: 'long'
                  })}
                </p>
              </div>
              <div className="space-y-3 md:space-y-4">
                {agrupados[dia].map(ag => (
                  <div key={ag.id} className="bg-surface-container-lowest rounded-xl md:rounded-2xl border border-surface-variant p-4 md:p-6 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex gap-3 md:gap-5 items-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined">calendar_month</span>
                      </div>
                      <div>
                        <p className="font-extrabold text-on-background">
                          {new Date(ag.data_hora).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-on-surface-variant font-medium">{ag.duracao_minutos} min</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[ag.status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[ag.status] || ag.status}
                          </span>
                          {ag.paciente_nome && (
                            <span className="text-xs font-semibold text-on-surface-variant">Paciente: {ag.paciente_nome}</span>
                          )}
                        </div>
                        {ag.motivo && <p className="text-xs text-on-surface-variant italic mt-0.5">{ag.motivo}</p>}
                        {ag.status === 'reservado' && ag.paciente_id && (
                          <button onClick={() => navigate(`/gestor/paciente/${ag.paciente_id}`)} className="mt-2 text-xs font-bold text-primary hover:underline">
                            → Ver paciente
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Ações contextuais por status */}
                    <div className="flex gap-2">
                      {ag.status === 'disponivel' && (
                        <button onClick={() => handleExcluir(ag.id)}
                          className="w-9 h-9 rounded-xl hover:bg-red-50 hover:text-red-600 text-on-surface-variant flex items-center justify-center transition-colors">
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      )}
                      {ag.status === 'reservado' && (
                        <>
                          <button onClick={() => handleAtualizarStatus(ag.id, 'concluido')}
                            className="px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs hover:bg-emerald-200 transition-colors">Concluir</button>
                          <button onClick={() => handleAtualizarStatus(ag.id, 'cancelado')}
                            className="px-3 py-1.5 bg-red-100 text-red-600 font-bold rounded-lg text-xs hover:bg-red-200 transition-colors">Cancelar</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-on-surface-variant font-medium bg-surface-container-lowest rounded-2xl border border-surface-variant">
          <span className="material-symbols-outlined text-5xl block mb-4 opacity-30">calendar_month</span>
          Nenhum agendamento encontrado para este filtro.
        </div>
      )}

      {/* ── Modal: Novo Horário ── */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalAberto(false)} />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center shrink-0">
              <h3 className="text-xl font-extrabold">Novo Horário</h3>
              <button onClick={() => setModalAberto(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleCriar} className="p-6 md:p-8 space-y-5 overflow-y-auto">
              
              {/* Data de início */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Data de início*</label>
                <input required type="date" value={form.data_inicio}
                  onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
              </div>

              {/* Horário: início → fim */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Das*</label>
                  <input type="time" value={form.hora_inicio}
                    onChange={e => setForm(p => ({ ...p, hora_inicio: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Até*</label>
                  <input type="time" value={form.hora_fim}
                    onChange={e => setForm(p => ({ ...p, hora_fim: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
              </div>

              {/* Intervalo */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Intervalo entre consultas*</label>
                <select value={form.intervalo_minutos}
                  onChange={e => setForm(p => ({ ...p, intervalo_minutos: Number(e.target.value) }))}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora</option>
                </select>
              </div>

              {/* Repetir por N dias + pular fins de semana */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Repetir por</label>
                  <select value={form.repetir_dias}
                    onChange={e => setForm(p => ({ ...p, repetir_dias: Number(e.target.value) }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                    {[1,5,10,15,20,30].map(d => <option key={d} value={d}>{d} {d===1?'dia':'dias'}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Fins de semana</label>
                  <button type="button"
                    onClick={() => setForm(p => ({ ...p, pular_fins_de_semana: !p.pular_fins_de_semana }))}
                    className={`w-full h-12 rounded-xl border-2 font-bold text-sm transition-colors ${
                      form.pular_fins_de_semana
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-surface-variant bg-surface-container-high text-on-surface-variant'
                    }`}>
                    {form.pular_fins_de_semana ? 'Pular sáb/dom ✓' : 'Incluir todos'}
                  </button>
                </div>
              </div>

              {/* Preview: quantos slots serão criados */}
              {form.data_inicio && form.hora_inicio < form.hora_fim && (
                <p className="text-xs text-on-surface-variant bg-surface-container-high rounded-xl px-4 py-3">
                  ℹ️ Serão criados aprox. <strong>
                    {Math.floor(
                      (Number(form.hora_fim.split(':')[0]) * 60 + Number(form.hora_fim.split(':')[1]) -
                       Number(form.hora_inicio.split(':')[0]) * 60 - Number(form.hora_inicio.split(':')[1]))
                      / form.intervalo_minutos
                    ) * form.repetir_dias} slots</strong> (excluindo fins de semana se marcado).
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline font-bold">Cancelar</button>
                <button type="submit" disabled={enviando} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">
                  {enviando ? 'Criando...' : 'Criar Horários'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GestorLayout>
  );
}
