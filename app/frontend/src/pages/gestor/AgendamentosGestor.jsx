// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA: AgendamentosGestor.jsx
// FUNÇÃO: Gerencia a agenda e slots de consultas da equipe gestora da UBS.
//         Permite criar grades de horários em lote, gerenciar agendamentos
//         individuais, atualizar status de reservas e realizar exclusão
//         em massa de slots disponíveis.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import GestorLayout from '../../components/gestor/GestorLayout';

// Mapa cromático e de estilos translúcidos para badges de status de agendamento
const STATUS_ESTILO = {
  disponivel: {
    badge: 'bg-emerald-500/10 text-emerald-855 border-emerald-500/25',
    dot: 'bg-emerald-500',
  },
  reservado: {
    badge: 'bg-amber-500/10 text-amber-855 border-amber-500/25',
    dot: 'bg-amber-500',
  },
  concluido: {
    badge: 'bg-gray-500/10 text-gray-750 border-gray-500/25',
    dot: 'bg-gray-500',
  },
  cancelado: {
    badge: 'bg-red-500/10 text-red-800 border-red-500/25',
    dot: 'bg-red-500',
  },
};

const STATUS_LABEL = {
  disponivel: 'Disponível',
  reservado:  'Reservado',
  concluido:  'Concluído',
  cancelado:  'Cancelado',
};

const HORARIO_MINIMO = '07:00';
const HORARIO_MAXIMO = '18:00';
const ERRO_HORARIO_FUNCIONAMENTO = 'Horário fora do funcionamento da UBS (07h às 18h).';

// Converte string 'HH:MM' em minutos inteiros desde a meia-noite
function minutosDoHorario(horario) {
  const [hora, minuto] = horario.split(':').map(Number);
  return hora * 60 + minuto;
}

// Valida se o horário se encontra dentro do funcionamento da UBS (07h às 18h)
function horarioDentroFuncionamento(horario) {
  const minutos = minutosDoHorario(horario);
  return minutos >= minutosDoHorario(HORARIO_MINIMO) && minutos < minutosDoHorario(HORARIO_MAXIMO);
}

// Converte minutos inteiros em string 'HH:MM'
function formatarHorario(minutos) {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

export default function AgendamentosGestor() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState('');
  const [selecionados, setSelecionados] = useState([]);
  const [excluindoEmMassa, setExcluindoEmMassa] = useState(false);
  
  // Estado inicial estruturado do formulário de criação em lote
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

  // Filtragem local baseada nas abas
  const agendamentosFiltrados = filtroStatus === 'todos'
    ? agendamentos
    : agendamentos.filter(a => a.status === filtroStatus);

  // Agrupa os agendamentos filtrados por data para visualização organizada em tópicos
  const agrupados = agendamentosFiltrados.reduce((acc, ag) => {
    const dia = ag.data_hora.slice(0, 10);
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(ag);
    return acc;
  }, {});

  const diasOrdenados = Object.keys(agrupados).sort();

  // Resumo estatístico de slots calculados a partir da carga total
  const hoje = new Date().toDateString();
  const resumo = {
    disponiveis: agendamentos.filter((item) => item.status === 'disponivel').length,
    reservados: agendamentos.filter((item) => item.status === 'reservado').length,
    concluidosHoje: agendamentos.filter(
      (item) => item.status === 'concluido' && new Date(item.data_hora).toDateString() === hoje
    ).length,
  };

  // Projeção em lote para dar feedback imediato de slots a serem criados
  const horariosPreview = (() => {
    if (!form.hora_inicio || !form.hora_fim || form.hora_inicio >= form.hora_fim) return [];
    const inicio = minutosDoHorario(form.hora_inicio);
    const fim = minutosDoHorario(form.hora_fim);
    const horarios = [];
    for (let min = inicio; min < fim; min += Number(form.intervalo_minutos)) {
      horarios.push(formatarHorario(min));
    }
    return horarios;
  })();

  // Salva a nova grade de horários em lote
  const handleCriar = async (e) => {
    e.preventDefault();
    setErroFormulario('');

    if (!horarioDentroFuncionamento(form.hora_inicio) || minutosDoHorario(form.hora_fim) > minutosDoHorario(HORARIO_MAXIMO)) {
      setErroFormulario(ERRO_HORARIO_FUNCIONAMENTO);
      return;
    }

    setEnviando(true);
    try {
      const { data } = await api.post('/gestor/agendamentos/lote', form);
      toast.success(`${data.criados} horário(s) criado(s) com sucesso!`);
      setModalAberto(false);
      setErroFormulario('');
      setForm({ data_inicio: '', hora_inicio: '08:00', hora_fim: '12:00',
                intervalo_minutos: 30, repetir_dias: 1, pular_fins_de_semana: true });
      carregarAgendamentos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar grade de horários.');
    } finally {
      setEnviando(false);
    }
  };

  // Altera status clínico do agendamento (Reservado -> Concluído/Cancelado)
  const handleAtualizarStatus = async (id, novoStatus) => {
    try {
      await api.put(`/gestor/agendamento/${id}`, { status: novoStatus });
      toast.success(`Marcado como "${STATUS_LABEL[novoStatus]}".`);
      carregarAgendamentos();
    } catch {
      toast.error('Erro ao atualizar agendamento.');
    }
  };

  // Exclusão individual de slots disponíveis
  const handleExcluir = async (id) => {
    try {
      await api.delete(`/gestor/agendamento/${id}`);
      toast.success('Horário removido.');
      setAgendamentos(prev => prev.filter(a => a.id !== id));
      setSelecionados(prev => prev.filter(item => item !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao excluir.');
    }
  };

  // Seleção múltipla para exclusão em massa
  const toggleSelecionado = (id) => {
    setSelecionados(prev => (
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    ));
  };

  // Executa deleção em massa dos slots selecionados
  const handleExcluirSelecionados = async () => {
    if (selecionados.length === 0) return;

    const confirmado = window.confirm(
      `Excluir ${selecionados.length} horários disponíveis? Esta ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    setExcluindoEmMassa(true);
    try {
      const { data } = await api.delete('/gestor/agendamentos/em-massa', {
        data: { ids: selecionados },
      });
      toast.success(`${data.excluidos} horário(s) excluído(s).`);
      if (data.ignorados > 0) {
        toast(`${data.ignorados} horário(s) foram ignorados por não estarem disponíveis.`);
      }
      setSelecionados([]);
      carregarAgendamentos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao excluir horários selecionados.');
    } finally {
      setExcluindoEmMassa(false);
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
      {/* ── Cabeçalho Principal ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8 select-none animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">Agendamentos</h1>
          <p className="text-on-surface-variant font-semibold mt-1 text-sm">Gerencie os horários de consultas presenciais de gestão.</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined">more_time</span>
          Novo Horário
        </button>
      </div>

      {/* ── Resumos Estatísticos Premium (Gradientes HSL & Glassmorphism) ── */}
      <div className="grid grid-cols-3 gap-3 md:gap-5 mb-6 select-none">
        {[
          { label: 'Disponíveis', valor: resumo.disponiveis, cor: 'text-emerald-800', bg: 'from-emerald-500/5 to-emerald-500/10 border-emerald-500/20', icon: 'check_circle' },
          { label: 'Reservados', valor: resumo.reservados, cor: 'text-amber-800', bg: 'from-amber-500/5 to-amber-500/10 border-amber-500/20', icon: 'pending_actions' },
          { label: 'Concluídos hoje', valor: resumo.concluidosHoje, cor: 'text-primary', bg: 'from-primary/5 to-primary/10 border-primary/20', icon: 'verified' },
        ].map((item) => (
          <div key={item.label} className={`bg-gradient-to-br ${item.bg} rounded-2xl border p-4 md:p-6 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group`}>
            <div className="absolute top-2 right-2 md:top-3 md:right-3 w-7 md:w-9 h-7 md:h-9 rounded-xl bg-white/45 flex items-center justify-center text-on-surface-variant/80 group-hover:scale-110 transition-transform shadow-sm flex-shrink-0 backdrop-blur-md">
              <span className="material-symbols-outlined text-base md:text-lg">{item.icon}</span>
            </div>
            <p className={`text-2xl md:text-4xl font-black ${item.cor}`}>{item.valor}</p>
            <p className="text-[10px] md:text-xs font-extrabold text-on-surface-variant/90 uppercase tracking-wider mt-1.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ── Abas de Filtro de Navegação (Pílula Deslizante) ── */}
      <div className="flex bg-surface-container-high/50 backdrop-blur-md p-1 rounded-xl max-w-lg mb-6 border border-surface-variant/30 select-none overflow-x-auto">
        {ABAS.map(aba => (
          <button
            key={aba.value}
            type="button"
            onClick={() => setFiltroStatus(aba.value)}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs md:text-sm whitespace-nowrap transition-all duration-200 ${
              filtroStatus === aba.value
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* ── Barra de Ações em Massa de Alta Visibilidade ── */}
      {selecionados.length > 0 && (
        <div className="mb-6 bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <p className="text-sm font-extrabold text-red-850 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-655 animate-pulse">check_box</span>
            {selecionados.length} horários disponíveis selecionados para exclusão em massa
          </p>
          <button
            type="button"
            onClick={handleExcluirSelecionados}
            disabled={excluindoEmMassa}
            className="h-11 px-6 bg-red-655 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-500/10 hover:shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-xs">delete_sweep</span>
            {excluindoEmMassa ? 'Excluindo...' : 'Excluir selecionados'}
          </button>
        </div>
      )}

      {/* ── Grade Horária Agrupada por Data ── */}
      {loading ? (
        <div className="space-y-4 animate-pulse select-none">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-surface-container-low rounded-2xl" />
          ))}
        </div>
      ) : erro ? (
        <div className="py-16 text-center bg-surface-container-lowest rounded-3xl border border-red-200 p-8 select-none animate-fade-in">
          <p className="font-bold text-on-background">{erro}</p>
          <button onClick={carregarAgendamentos} className="mt-4 h-12 px-6 bg-primary text-white font-bold rounded-2xl shadow-sm">Tentar novamente</button>
        </div>
      ) : agendamentosFiltrados.length > 0 ? (
        <div className="space-y-6 md:space-y-8 animate-fade-in">
          {diasOrdenados.map(dia => (
            <div key={dia} className="space-y-3">
              {/* Cabeçalho Cronológico de Dia Agrupado */}
              <div className="sticky top-0 z-10 bg-surface-container-low/90 border-b border-surface-variant/80 px-3 py-2 rounded-xl mb-3 mt-4 first:mt-0 shadow-sm backdrop-blur-md select-none">
                <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {new Date(dia + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>

              {/* Grid de Agendamentos do Dia */}
              <div className="grid grid-cols-1 gap-3.5">
                {agrupados[dia].map(ag => (
                  <div key={ag.id} className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-4 md:p-5 flex flex-wrap justify-between items-center gap-4 hover:border-primary/25 hover:shadow-sm transition-all duration-200">
                    <div className="flex gap-4 items-center min-w-0 flex-1">
                      {/* Checkbox estilizado para lote */}
                      {ag.status === 'disponivel' && (
                        <input
                          type="checkbox"
                          checked={selecionados.includes(ag.id)}
                          onChange={() => toggleSelecionado(ag.id)}
                          aria-label={`Selecionar horário ${ag.id}`}
                          className="w-5 h-5 rounded-md border-surface-variant text-primary focus:ring-primary focus:ring-opacity-25 cursor-pointer transition-all"
                        />
                      )}
                      {/* Box Icone */}
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 border border-primary/20 text-primary rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 select-none">
                        <span className="material-symbols-outlined text-xl">schedule</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-on-background text-sm md:text-base">
                          {new Date(ag.data_hora).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-xs font-bold text-on-surface-variant/80 ml-2">({ag.duracao_minutos} min)</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap select-none">
                          {/* Badge de status translúcida */}
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                            STATUS_ESTILO[ag.status]?.badge || 'bg-gray-500/10 text-gray-750 border-gray-500/25'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              STATUS_ESTILO[ag.status]?.dot || 'bg-gray-500'
                            } ${ag.status === 'reservado' ? 'animate-pulse' : ''}`} />
                            {STATUS_LABEL[ag.status] || ag.status}
                          </span>
                          
                          {/* Detalhes do agendamento */}
                          {ag.paciente_nome && (
                            <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">person</span>
                              Paciente: {ag.paciente_nome}
                            </span>
                          )}
                        </div>

                        {/* Detalhamento do Motivo */}
                        {ag.motivo && (
                          <p className="text-xs text-on-surface-variant/85 italic mt-2 bg-surface-container-low/40 p-2.5 rounded-xl border border-surface-variant/30 select-text">
                            Motivo: "{ag.motivo}"
                          </p>
                        )}

                        {/* Atalhos para o Prontuário do Paciente em caso de Reservado */}
                        {ag.status === 'reservado' && ag.paciente_id && (
                          <button
                            onClick={() => navigate(`/gestor/paciente/${ag.paciente_id}`)}
                            className="mt-2 text-xs font-extrabold text-primary hover:text-primary-dark transition-colors flex items-center gap-0.5 select-none"
                          >
                            → Ver paciente
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Ações contextuais de slots */}
                    <div className="flex gap-2 flex-shrink-0 ml-auto sm:ml-0 select-none">
                      {ag.status === 'disponivel' && (
                        <button
                          onClick={() => handleExcluir(ag.id)}
                          title="Excluir horário disponível"
                          className="w-9 h-9 rounded-xl hover:bg-red-500/10 hover:text-red-700 text-on-surface-variant flex items-center justify-center transition-colors border border-transparent hover:border-red-500/20 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                      {ag.status === 'reservado' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAtualizarStatus(ag.id, 'concluido')}
                            className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border border-emerald-500/20 font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm"
                          >
                            Concluir
                          </button>
                          <button
                            onClick={() => handleAtualizarStatus(ag.id, 'cancelado')}
                            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-750 border border-red-500/20 font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-on-surface-variant font-semibold bg-surface-container-lowest rounded-3xl border border-surface-variant select-none animate-fade-in">
          <span className="material-symbols-outlined text-5xl block mb-4 opacity-30">calendar_month</span>
          Nenhum agendamento localizado para a visualização selecionada.
        </div>
      )}

      {/* ── Modal: Novo Horário em Lote (Grade Agenda) ── */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalAberto(false)} />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-surface-variant/40 transition-all animate-scale-up">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center shrink-0">
              <h3 className="text-xl font-extrabold text-on-background">Criar grade de horários</h3>
              <button onClick={() => setModalAberto(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleCriar} className="p-6 md:p-8 space-y-5 overflow-y-auto">
              
              {/* Data de início */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Data de Início*</label>
                <input required type="date" value={form.data_inicio}
                  onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-semibold text-sm transition-all" />
              </div>

              {/* Horário: início → fim */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Hora Início*</label>
                  <input required type="time" value={form.hora_inicio} min="07:00" max="18:00"
                    onChange={e => setForm(p => ({ ...p, hora_inicio: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-semibold text-sm transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Hora Fim*</label>
                  <input required type="time" value={form.hora_fim} min="07:00" max="18:00"
                    onChange={e => setForm(p => ({ ...p, hora_fim: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-semibold text-sm transition-all" />
                </div>
              </div>

              {/* Intervalo entre slots */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Intervalo entre consultas*</label>
                <select required value={form.intervalo_minutos}
                  onChange={e => setForm(p => ({ ...p, intervalo_minutos: Number(e.target.value) }))}
                  className="w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-semibold text-sm transition-all">
                  <option value={15}>15 minutos</option>
                  <option value={20}>20 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                </select>
              </div>

              {/* Repetição */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Repetir por quantos dias?</label>
                <select value={form.repetir_dias}
                  onChange={e => setForm(p => ({ ...p, repetir_dias: Number(e.target.value) }))}
                  className="w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-semibold text-sm transition-all">
                  <option value={1}>Apenas hoje</option>
                  <option value={5}>5 dias úteis</option>
                  <option value={10}>10 dias úteis</option>
                  <option value={20}>20 dias úteis</option>
                  <option value={30}>30 dias úteis</option>
                </select>
              </div>

              {/* Fins de semana */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-surface-variant/40">
                <span className="text-sm font-bold text-on-background">Incluir fins de semana</span>
                <button type="button"
                  onClick={() => setForm(p => ({ ...p, pular_fins_de_semana: !p.pular_fins_de_semana }))}
                  className={`w-12 h-6 rounded-full transition-colors ${!form.pular_fins_de_semana ? 'bg-primary' : 'bg-surface-variant'}`}>
                  <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${!form.pular_fins_de_semana ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {/* Preview de slots */}
              {horariosPreview.length > 0 && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="text-xs font-extrabold text-primary uppercase tracking-wider mb-2">
                    Preview — {horariosPreview.length} slots serão criados
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {horariosPreview.slice(0,8).map((h,i) => (
                      <span key={i} className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{h}</span>
                    ))}
                    {horariosPreview.length > 8 && (
                      <span className="text-xs text-on-surface-variant font-medium">+{horariosPreview.length - 8} mais</span>
                    )}
                  </div>
                </div>
              )}

              {/* Erro */}
              {erroFormulario && <p className="text-sm text-red-500 font-semibold">{erroFormulario}</p>}

              {/* Ações */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAberto(false)}
                  className="flex-1 h-12 rounded-xl border border-surface-variant font-bold text-xs uppercase tracking-wider hover:bg-surface-container-low transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all active:scale-[0.98]">
                  Criar Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GestorLayout>
  );
}
