/**
 * PÁGINA: DashboardPaciente.jsx + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Tela principal do portal do paciente. Exibe o nome, UBS de referência
 *         e as solicitações ativas do paciente logado.
 *         Usa PacienteLayout para centralizar o conteúdo no desktop.
 *
 * API: GET /api/paciente/meus-dados
 *      GET /api/paciente/minhas-solicitacoes
 *      GET /api/paciente/comunicados
 *      GET /api/paciente/agendamentos/meus
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PacienteLayout from '../../components/paciente/PacienteLayout';
import { STATUS_LABELS, STATUS_CORES, formatarDataBR } from '../../utils/statusHelper';

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: QuickAccessCard
// FUNÇÃO: Card de acesso rápido na home screen. Exibe ícone, título, valor resumido
//         e navega ao clicar. Usado no grid 2x2 do Dashboard.
// PROPS:
//   - icon: string — Material Symbol
//   - titulo: string — nome do módulo
//   - valor: string — resumo do estado atual
//   - cor: string — classe Tailwind para a cor do ícone (ex: 'text-blue-600')
//   - bg: string — classe Tailwind para o fundo do ícone (ex: 'bg-blue-50')
//   - rota: string — rota de destino
//   - badge: number|null — número vermelho no canto superior direito (opcional)
//   - navigate: function — passado do pai
// ─────────────────────────────────────────────────────────────────────────────
function QuickAccessCard({ icon, titulo, valor, cor, bg, rota, badge, navigate }) {
  return (
    <button
      onClick={() => navigate(rota)}
      className="flex-1 min-w-0 bg-surface-container-lowest rounded-2xl border border-surface-variant p-4 text-left shadow-sm hover:shadow-md active:scale-[0.98] transition-all relative"
    >
      {/* Badge de notificação no canto superior direito */}
      {badge > 0 && (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-extrabold w-4 h-4 flex items-center justify-center rounded-full">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
        <span className={`material-symbols-outlined text-xl ${cor}`}>{icon}</span>
      </div>
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">{titulo}</p>
      <p className="text-sm font-bold text-on-surface leading-tight truncate">{valor}</p>
    </button>
  );
}

// Formata o próximo agendamento de forma curta — "Seg, 23/06 às 10:00"
const formatarProximoAg = (dataHora) => {
  if (!dataHora) return null;
  const dateStr = dataHora.includes('T') ? dataHora : dataHora + 'T12:00:00';
  const d = new Date(dateStr);
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dia = diasSemana[d.getDay()];
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia}, ${data} às ${hora}`;
};

export default function DashboardPaciente() {
  const [sols, setSols] = useState([]);
  const [paciente, setPaciente] = useState({});
  const [unreadComunicados, setUnreadComunicados] = useState(0);
  const [proximoAgendamento, setProximoAgendamento] = useState(null);
  const [pendenciasConfirmacao, setPendenciasConfirmacao] = useState([]);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const navigate = useNavigate();

  // Função separada para permitir retry em caso de erro
  const fetchDados = () => {
    setLoading(true);
    setErro(false);
    Promise.all([
      api.get('/paciente/meus-dados'),
      api.get('/paciente/minhas-solicitacoes'),
      api.get('/paciente/comunicados'),
      api.get('/paciente/agendamentos/meus'),
      api.get('/paciente/encaminhamentos?status=AGUARDANDO_CONFIRMACAO')
    ])
      .then(([rDados, rSols, rComuns, rAgendamentos, rPendencias]) => {
        setPaciente(rDados.data);
        setSols(rSols.data);
        setUnreadComunicados(rComuns.data.filter(c => !c.lido).length);
        setPendenciasConfirmacao(rPendencias.data || []);

        // Filtra agendamentos futuros e pega o mais próximo
        const agora = new Date();
        const futuros = rAgendamentos.data
          .filter(ag => ag.status === 'reservado' && new Date(ag.data_hora) > agora)
          .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
        setProximoAgendamento(futuros[0] || null);
      })
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDados(); }, []);

  const confirmarPresenca = async (id) => {
    setConfirmandoId(id);
    try {
      await api.put(`/paciente/encaminhamento/${id}/confirmar`);
      import('react-hot-toast').then(({ default: toast }) => toast.success('Presença confirmada! ✓'));
      setPendenciasConfirmacao(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      import('react-hot-toast').then(({ default: toast }) => toast.error('Erro ao confirmar presença.'));
    } finally {
      setConfirmandoId(null);
    }
  };

  // Exibe esqueleto animado enquanto os dados carregam
  if (loading) {
    return (
      <PacienteLayout>
        <div className="animate-pulse space-y-4">
          <div className="bg-primary pt-4 pb-12 px-6 rounded-b-[1.5rem] md:pt-6 md:pb-10 md:rounded-b-none">
            <div className="h-3.5 w-20 bg-white/30 rounded mb-2"></div>
            <div className="h-6 w-40 bg-white/40 rounded"></div>
          </div>
          
          {/* Skeleton do grid de acesso rápido */}
          <div className="px-6 pt-4 pb-2 max-w-5xl mx-auto w-full">
            <div className="flex gap-3 mb-3">
              <div className="flex-1 h-28 bg-surface-container-low rounded-2xl" />
              <div className="flex-1 h-28 bg-surface-container-low rounded-2xl" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 h-28 bg-surface-container-low rounded-2xl" />
              <div className="flex-1 h-28 bg-surface-container-low rounded-2xl" />
            </div>
          </div>

          <div className="px-6 relative z-20 space-y-4 max-w-5xl mx-auto w-full pb-28">
            <div className="h-5 w-48 bg-surface-container-low rounded mb-4" />
            {[1, 2].map(i => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-variant">
                <div className="h-5 w-3/4 bg-surface-container-high rounded mb-3"></div>
                <div className="h-12 bg-surface-container-high rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </PacienteLayout>
    );
  }

  // Exibe mensagem amigável se as APIs falharem — com botão de nova tentativa
  if (erro) {
    return (
      <PacienteLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">
            wifi_off
          </span>
          <p className="font-bold text-on-surface text-lg">
            Não conseguimos carregar seus dados
          </p>
          <p className="text-sm text-on-surface-variant">
            Verifique sua conexão e tente novamente.
          </p>
          <button
            onClick={fetchDados}
            className="mt-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </PacienteLayout>
    );
  }

  return (
    <PacienteLayout>
      {/* ── Cabeçalho verde com nome e UBS ── */}
      <header className="bg-primary pt-4 pb-8 px-6 rounded-b-[1.5rem] md:pt-6 md:pb-10 md:rounded-b-none relative overflow-hidden flex justify-center">
        <div className="relative z-10 w-full max-w-5xl flex justify-between items-start">
          <div>
            <p className="text-white/80 text-[11px] font-bold tracking-wider uppercase mb-0.5">Bem-vindo(a)</p>
            <h1 className="text-on-primary text-xl font-bold">{paciente.nome || 'Carregando...'}</h1>
            <div className="flex items-center gap-1.5 mt-2 bg-white/10 w-fit px-2.5 py-1 rounded-full backdrop-blur-sm">
              <span className="material-symbols-outlined text-white text-[14px]">location_on</span>
              <span className="text-white text-[11px] font-medium">{paciente.ubs?.nome || '...'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Pendências de Confirmação ── */}
      {pendenciasConfirmacao.map(pend => (
        <section key={pend.id} className="px-6 pt-4 max-w-5xl mx-auto w-full">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex gap-3 relative z-10">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl">event_available</span>
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-blue-900 text-sm mb-1">Confirmação pendente</h3>
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  Procedimento: <strong>{pend.especialidade}</strong><br/>
                  Data: <strong>{formatarProximoAg(pend.data_agendamento)}</strong><br/>
                  Local: <strong>{pend.destino}</strong>
                </p>
                <button
                  onClick={() => confirmarPresenca(pend.id)}
                  disabled={confirmandoId === pend.id}
                  className="mt-3 w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-transform disabled:opacity-50 shadow-sm"
                >
                  {confirmandoId === pend.id ? 'Confirmando...' : 'Confirmar Presença'}
                </button>
              </div>
            </div>
            {/* Decoração de fundo */}
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[100px] text-blue-500/10 pointer-events-none select-none">
              schedule
            </span>
          </div>
        </section>
      ))}

      {/* ── Grid de acesso rápido aos módulos ── */}
      <section className="px-6 pt-4 pb-2 max-w-5xl mx-auto w-full">
        <div className="flex gap-3 mb-3">
          <QuickAccessCard
            icon="notifications"
            titulo="Avisos"
            valor={unreadComunicados > 0 ? `${unreadComunicados} novo${unreadComunicados > 1 ? 's' : ''}` : 'Sem novidades'}
            cor="text-blue-600"
            bg="bg-blue-50"
            rota="/paciente/comunicados"
            badge={unreadComunicados}
            navigate={navigate}
          />
          <QuickAccessCard
            icon="calendar_month"
            titulo="Próximo Agendamento"
            valor={proximoAgendamento ? formatarProximoAg(proximoAgendamento.data_hora) : 'Sem agendamentos'}
            cor="text-emerald-600"
            bg="bg-emerald-50"
            rota="/paciente/agendamentos"
            badge={null}
            navigate={navigate}
          />
        </div>
        <div className="flex gap-3">
          <QuickAccessCard
            icon="medication"
            titulo="Medicamentos"
            valor="Consultar estoque"
            cor="text-purple-600"
            bg="bg-purple-50"
            rota="/paciente/medicamentos"
            badge={null}
            navigate={navigate}
          />
          <QuickAccessCard
            icon="folder_open"
            titulo="Solicitações"
            valor={sols.length > 0 ? `${sols.length} ativa${sols.length > 1 ? 's' : ''}` : 'Nenhuma ativa'}
            cor="text-primary"
            bg="bg-primary/10"
            rota="/paciente/solicitacoes"
            badge={null}
            navigate={navigate}
          />
        </div>
      </section>

      {/* ── Conteúdo principal ── */}
      <main className="px-6 mt-2 md:pb-12 relative z-20 space-y-6 pb-28 max-w-5xl mx-auto w-full">
        {/* Linha de título com atalho para histórico completo */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-extrabold text-on-surface leading-tight">Minhas Solicitações Ativas</h2>
          <button
            onClick={() => navigate('/paciente/solicitacoes')}
            className="text-primary text-sm font-semibold flex items-center gap-0.5 hover:underline"
          >
            Ver todas
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
        <div className="space-y-4">
          {sols.map(sol => (
            <button
              key={sol.id}
              onClick={() => navigate(`/paciente/solicitacao/${sol.id}`)}
              className={`w-full text-left bg-surface-container-lowest p-4 rounded-2xl shadow-sm border-y border-r transition-all hover:scale-[1.01] hover:shadow-md active:scale-[0.99] duration-200 ${
                sol.prioridade === 'urgente'
                  ? 'border-l-4 border-l-red-500 border-red-300'
                  : 'border-l-4 border-l-primary border-surface-variant'
              }`}
            >
              <div className="flex justify-between items-start mb-3 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                    <span className="material-symbols-outlined">
                      {sol.tipo === 'exame' ? 'biotech' : 
                       sol.tipo === 'consulta' ? 'medical_services' :
                       sol.tipo === 'procedimento' ? 'healing' :
                       sol.tipo === 'cirurgia' ? 'local_hospital' : 'event_note'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-primary tracking-wider uppercase block mb-0.5">
                      {sol.tipo === 'exame' ? 'Exame' :
                       sol.tipo === 'consulta' ? 'Consulta' :
                       sol.tipo === 'procedimento' ? 'Procedimento' :
                       sol.tipo === 'cirurgia' ? 'Cirurgia' : sol.tipo}
                    </span>
                    <h3 className="font-bold text-on-surface leading-tight text-sm">{sol.descricao_paciente}</h3>
                  </div>
                </div>
                {/* Indicador discreto de última movimentação no canto do card */}
                <div className="text-right flex-shrink-0 select-none">
                  <span className="text-[9px] font-bold text-on-surface-variant/65 block uppercase tracking-wider leading-none mb-0.5">Movimentado</span>
                  <span className="text-[11px] font-extrabold text-on-surface-variant/80">{formatarDataBR(sol.atualizado_em || sol.criado_em)}</span>
                </div>
              </div>
              {/* O status técnico nunca é exibido diretamente ao paciente. */}
              <div className={`rounded-xl p-3 ${STATUS_CORES[sol.status] || 'bg-surface-container-low text-on-surface'}`}>
                <p className="text-sm font-semibold">
                  {STATUS_LABELS[sol.status] || 'Status em atualização'}
                </p>
                {sol.data_prevista && (
                  <p className="text-xs opacity-80 mt-1">Previsão: {formatarDataBR(sol.data_prevista)}</p>
                )}
              </div>
            </button>
          ))}
          {sols.length === 0 && (
            <p className="text-center text-on-surface-variant p-6">Nenhuma solicitação ativa.</p>
          )}
        </div>
      </main>
    </PacienteLayout>
  );
}
