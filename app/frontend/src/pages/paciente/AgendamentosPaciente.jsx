/**
 * PÁGINA: AgendamentosPaciente.jsx — Épico 4 + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Permite ao paciente ver horários disponíveis e reservar atendimento.
 *         Usa PacienteLayout para centralização no desktop.
 *         Modal de reserva ancorado à base do container no mobile.
 *
 * API: GET  /api/paciente/agendamentos/disponiveis
 *      GET  /api/paciente/agendamentos/meus
 *      POST /api/paciente/agendamento/:id/reservar
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PacienteLayout from '../../components/paciente/PacienteLayout';

const STATUS_BADGE = {
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

export default function AgendamentosPaciente() {
  const location = useLocation();
  const meusAgendamentosRef = useRef(null); // Referência para rolagem suave pós-agendamento
  const [disponiveis, setDisponiveis] = useState([]);
  const [meus, setMeus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [slotSelecionado, setSlotSelecionado] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [reservando, setReservando] = useState(false);
  const [erro, setErro] = useState(false);

  // Controla o modal de confirmação de cancelamento e o feedback de carregamento da requisição
  const [cancelando, setCancelando] = useState(false);
  // Objeto do agendamento que o paciente selecionou para cancelar
  const [agendamentoCancelando, setAgendamentoCancelando] = useState(null);

  const carregarTodos = () => {
    setLoading(true);
    setErro(false);
    Promise.all([
      api.get('/paciente/agendamentos/disponiveis'),
      api.get('/paciente/agendamentos/meus'),
    ])
      .then(([resDisp, resMeus]) => {
        setDisponiveis(resDisp.data);
        setMeus(resMeus.data);
      })
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregarTodos(); }, []);

  // Abre automaticamente o modal de reserva quando o paciente chega via FAB "+"
  // com uma categoria de intake selecionada. Só executa após o carregamento completo.
  useEffect(() => {
    if (!loading && location.state?.abrirModal) {
      if (disponiveis.length > 0) {
        // Pré-seleciona o primeiro slot disponível e preenche o motivo sugerido
        setSlotSelecionado(disponiveis[0]);
        setMotivo(location.state.motivoSugerido || '');
        setModalAberto(true);
      } else {
        // Nenhum horário disponível: informa o paciente sem abrir o modal
        toast('Não há horários disponíveis no momento. Tente novamente em breve.', {
          icon: '📅',
        });
      }
      // Limpa o state do router para evitar re-trigger em navegação futura
      // (substitui o history entry atual sem o state)
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const abrirModal = (slot) => {
    setSlotSelecionado(slot);
    setMotivo('');
    setModalAberto(true);
  };

  const handleReservar = async (e) => {
    e.preventDefault();
    setReservando(true);
    try {
      await api.post(`/paciente/agendamento/${slotSelecionado.id}/reservar`, { motivo });
      toast.success('Agendamento confirmado! ✓');
      setModalAberto(false);
      carregarTodos();
      // Rola a tela suavemente para a seção "Meus Agendamentos" para feedback imediato do novo slot reservado
      setTimeout(() => {
        meusAgendamentosRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao reservar agendamento.');
    } finally {
      setReservando(false);
    }
  };

  // Abre o modal de confirmação para cancelar o agendamento informado
  const abrirConfirmacaoCancelamento = (ag) => {
    setAgendamentoCancelando(ag);
  };

  // Executa o cancelamento após confirmação do paciente no modal
  const handleCancelar = async () => {
    if (!agendamentoCancelando) return;
    setCancelando(true);
    try {
      await api.put(`/paciente/agendamento/${agendamentoCancelando.id}/cancelar`);
      toast.success('Agendamento cancelado.');
      setAgendamentoCancelando(null);
      carregarTodos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cancelar agendamento.');
    } finally {
      setCancelando(false);
    }
  };

  const formatarDataHora = (dt) => {
    const dateStr = dt.includes('T') ? dt : dt + 'T12:00:00';
    const data = new Date(dateStr).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    const hora = new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    // Capitaliza apenas a primeira letra do dia da semana (português correto).
    // NÃO usar CSS 'capitalize' pois capitaliza cada palavra individualmente.
    const str = `${data}, às ${hora}`;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Formato compacto para listagem de horários: "Dom, 12/07 · 14:00"
  // Usado nos cards de horários disponíveis para evitar quebra de linha.
  const formatarSlotCompacto = (dt) => {
    const dateStr = dt.includes('T') ? dt : dt + 'T12:00:00';
    const d = new Date(dateStr);
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dia = diasSemana[d.getDay()];
    const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dia}, ${data} · ${hora}`;
  };

  return (
    <PacienteLayout>
      {/* ── Cabeçalho verde ── */}
      <header className="bg-primary pt-12 pb-4 px-6">
        <h1 className="text-on-primary text-2xl font-extrabold">Agendamentos</h1>
        <p className="text-white/70 text-sm mt-1">Agende um atendimento presencial</p>
      </header>

      <main className="px-6 py-5 space-y-5">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-surface-container-low rounded-2xl animate-pulse" />)
        ) : erro ? (
          <>
            {/* Estado de erro com retry — exibido quando a API não responde ou retorna falha. */}
            {/* Evita que o paciente veja uma lista vazia enganosa por falha de rede. */}
            <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
              <span className="material-symbols-outlined text-5xl text-red-400">wifi_off</span>
              <p className="text-on-surface-variant text-center text-sm">
                Não foi possível carregar os dados.<br />Verifique sua conexão e tente novamente.
              </p>
              <button
                onClick={carregarTodos}
                className="bg-primary text-on-primary px-6 py-2 rounded-full text-sm font-semibold"
              >
                Tentar novamente
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ── Horários Disponíveis ── */}
            <section>
              <h2 className="text-xl font-extrabold text-on-background mb-4">Horários Disponíveis</h2>
              {disponiveis.length > 0 ? (
                <div className="space-y-4">
                  {disponiveis.map(slot => (
                    <div key={slot.id} className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-4 flex justify-between items-center gap-4">
                      <div>
                        <p className="font-bold text-on-background text-sm">{formatarSlotCompacto(slot.data_hora)}</p>
                        <p className="text-xs text-on-surface-variant font-medium mt-0.5">{slot.duracao_minutos} min</p>
                      </div>
                      <button onClick={() => abrirModal(slot)}
                        className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm flex-shrink-0">
                        Reservar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-on-surface-variant font-medium bg-surface-container-lowest rounded-2xl border border-surface-variant">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">event_busy</span>
                  Nenhum horário disponível no momento.
                </div>
              )}
            </section>

            {/* ── Meus Agendamentos ── */}
            <section ref={meusAgendamentosRef}>
              <h2 className="text-xl font-extrabold text-on-background mb-4">Meus Agendamentos</h2>
              {meus.length > 0 ? (
                <div className="space-y-4">
                  {meus.map(ag => (
                    <div key={ag.id} className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-on-background text-sm">{formatarDataHora(ag.data_hora)}</p>
                          <p className="text-xs text-on-surface-variant font-medium mt-1">{ag.duracao_minutos} minutos</p>
                          {ag.motivo && <p className="text-xs text-on-surface-variant italic mt-1">{ag.motivo}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_BADGE[ag.status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[ag.status] || ag.status}
                          </span>
                          {/* Botão cancelar: só aparece em agendamentos reservados (não concluídos) */}
                          {ag.status === 'reservado' && (
                            <button
                              onClick={() => abrirConfirmacaoCancelamento(ag)}
                              className="text-xs font-bold text-red-500 border border-red-200 px-3 py-1 rounded-xl hover:bg-red-50 transition-colors"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-on-surface-variant font-medium bg-surface-container-lowest rounded-2xl border border-surface-variant">
                  Você ainda não tem agendamentos.
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* ── Modal: Confirmar Reserva ── */}
      {modalAberto && slotSelecionado && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalAberto(false)} />
          <div className="relative w-full sm:max-w-md bg-surface-container-lowest rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl">
            <header className="p-6 border-b border-surface-variant">
              <h3 className="text-xl font-extrabold text-center">Confirmar Agendamento</h3>
            </header>
            <form onSubmit={handleReservar} className="p-6 space-y-5">
              <div className="bg-primary/10 rounded-2xl p-4 text-center">
                <p className="text-primary font-extrabold text-sm">{formatarDataHora(slotSelecionado.data_hora)}</p>
                <p className="text-primary/70 text-xs font-medium">{slotSelecionado.duracao_minutos} minutos</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Observações {motivo ? '' : '(opcional)'}</label>
                <textarea rows={3} placeholder="Ex: Tenho dificuldade de locomoção, necessito de acompanhante, trarei documentos antigos..." value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
                {/* Dica: quando pré-preenchido pelo FAB, lembra o paciente de complementar */}
                {motivo && (
                  <p className="text-xs text-on-surface-variant">
                    Complete com mais detalhes se quiser.
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 h-14 rounded-2xl border border-outline font-bold">Cancelar</button>
                <button type="submit" disabled={reservando} className="flex-1 h-14 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">
                  {reservando ? 'Reservando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar Cancelamento ── */}
      {agendamentoCancelando && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          {/* Overlay semitransparente com blur */}
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => !cancelando && setAgendamentoCancelando(null)}
          />
          <div className="relative w-full sm:max-w-md bg-surface-container-lowest rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl">
            <div className="p-6 text-center">
              {/* Ícone de aviso */}
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-500 text-3xl">event_busy</span>
              </div>
              <h3 className="text-xl font-extrabold text-on-background mb-2">Cancelar agendamento?</h3>
              {/* Exibe data/hora do agendamento que será cancelado */}
              <p className="text-sm text-on-surface-variant mb-1 font-medium">
                {formatarDataHora(agendamentoCancelando.data_hora)}
              </p>
              <p className="text-xs text-on-surface-variant mb-6">
                Esta ação não pode ser desfeita. Se quiser reagendar, precisará escolher um novo horário disponível.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAgendamentoCancelando(null)}
                  disabled={cancelando}
                  className="flex-1 h-14 rounded-2xl border border-outline font-bold disabled:opacity-50"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleCancelar}
                  disabled={cancelando}
                  className="flex-1 h-14 rounded-2xl bg-red-500 text-white font-bold disabled:opacity-50"
                >
                  {cancelando ? 'Cancelando...' : 'Confirmar cancelamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PacienteLayout>
  );
}
