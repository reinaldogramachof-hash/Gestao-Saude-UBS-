/**
 * PÁGINA: SolicitacoesPaciente.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Lista TODAS as solicitações do paciente logado — ativas e históricas.
 *         As solicitações ativas (em análise, autorizadas, etc.) aparecem
 *         primeiro em uma seção separada. Concluídas e canceladas ficam abaixo
 *         na seção "Histórico".
 *         Clicar em qualquer solicitação navega para o detalhe (/paciente/solicitacao/:id).
 *
 * API: GET /api/paciente/todas-solicitacoes
 * LAYOUT: PacienteLayout (mobile-first, 375px)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PacienteLayout from '../../components/paciente/PacienteLayout';
import { STATUS_LABELS, STATUS_CORES, formatarDataBR } from '../../utils/statusHelper';

// Ordem linear dos status exibidos no mini-stepper. Fica fora do componente
// para evitar recriacao a cada render e manter o fluxo facil de auditar.
const FLUXO = [
  'em_analise',
  'aguardando_regulacao',
  'autorizado',
  'data_marcada',
  'encaminhado_externo',   // fase virtual — não existe em solicitacoes.status
  'retorno_ubs',           // fase virtual — não existe em solicitacoes.status
  'concluido',
];

const FLUXO_LABELS = [
  'Análise',
  'Regulação',
  'Autorizado',
  'Agendado',
  'Na unidade',
  'Retorno',
  'Concluído',
];

// Mapeia o status real + encaminhamento_status para a posição no FLUXO estendido
function calcularPosicaoFluxo(sol) {
  if (sol.status === 'concluido') return 6;
  if (sol.status === 'cancelado') return -1; // stepper oculto

  // Se tem encaminhamento externo, reflete a fase real
  const encStatus = sol.encaminhamento_status;
  if (encStatus === 'RETORNO_UBS') return 5;
  if (['AGUARDANDO_CONFIRMACAO', 'CONFIRMADO_PACIENTE', 'AGENDADO'].includes(encStatus)) return 4;
  if (['AGUARDANDO_VAGA', 'RECEBIDO'].includes(encStatus)) return 4;

  // Sem encaminhamento — usa posição normal no fluxo original
  const mapa = {
    'em_analise': 0,
    'aguardando_regulacao': 1,
    'autorizado': 2,
    'data_marcada': 3,
  };
  return mapa[sol.status] ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: CardSolicitacao
// FUNÇÃO: Card individual de uma solicitação — reutilizado nas seções
//         "Em andamento" e "Histórico". Definido FORA do componente pai para
//         evitar que o React recrie e desmonte os cards a cada re-render
//         (quando definido dentro, React trata como novo componente por referência).
// PROPS:
//   - sol: object — dados da solicitação
//   - navigate: function — passado do pai para manter o hook fora deste componente
// ─────────────────────────────────────────────────────────────────────────────
function CardSolicitacao({ sol, navigate }) {
  return (
    <button
      onClick={() => navigate(`/paciente/solicitacao/${sol.id}`)}
      className={`w-full text-left bg-white p-4 rounded-2xl shadow-sm border-y border-r transition-all hover:scale-[1.01] hover:shadow-md active:scale-[0.99] duration-200 ${
        sol.prioridade === 'urgente'
          ? 'border-l-4 border-l-red-500 border-red-300'
          : 'border-l-4 border-l-primary border-surface-variant'
      }`}
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-lg">
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
            <h3 className="font-bold text-on-surface text-sm leading-tight">{sol.descricao_paciente}</h3>
          </div>
        </div>
        {/* Indicador discreto de última movimentação no canto do card */}
        <div className="text-right flex-shrink-0 select-none">
          <span className="text-[9px] font-bold text-on-surface-variant/65 block uppercase tracking-wider leading-none mb-0.5">Movimentado</span>
          <span className="text-[11px] font-extrabold text-on-surface-variant/80">{formatarDataBR(sol.atualizado_em || sol.criado_em)}</span>
        </div>
      </div>
      {/* Mini-stepper de progresso da solicitacao estendido */}
      {(() => {
        const idx = calcularPosicaoFluxo(sol);
        if (idx === -1) return null;
        return (
          <div className="mb-4">
            <div className="flex items-center gap-1">
              {FLUXO.map((etapa, i) => (
                <div key={etapa} className="flex items-center gap-1 flex-1">
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
                      i < idx
                        ? 'bg-primary'
                        : i === idx
                        ? 'bg-primary ring-2 ring-primary/30'
                        : 'bg-surface-container-high'
                    }`}
                  />
                  {i < FLUXO.length - 1 && (
                    <div className={`h-0.5 flex-1 ${i < idx ? 'bg-primary' : 'bg-surface-container-high'}`} />
                  )}
                </div>
              ))}
            </div>
            {/* Labels visuais com fonte de 7px para caber perfeitamente no mobile */}
            <div className="flex justify-between mt-1 px-[2px]">
              {FLUXO_LABELS.map((label, i) => (
                <span
                  key={i}
                  className={`text-[7px] font-bold leading-none select-none transition-colors w-[42px] text-center ${
                    i === idx
                      ? 'text-primary font-extrabold'
                      : i < idx
                      ? 'text-on-surface-variant'
                      : 'text-on-surface-variant/40'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      <div className={`rounded-xl px-3 py-2 ${STATUS_CORES[sol.status] || 'bg-surface-container-low text-on-surface'}`}>
        <p className="text-sm font-semibold">{STATUS_LABELS[sol.status] || 'Status em atualização'}</p>
        {sol.data_prevista && (
          <p className="text-xs opacity-80 mt-0.5">Previsão: {formatarDataBR(sol.data_prevista)}</p>
        )}
      </div>
    </button>
  );
}

export default function SolicitacoesPaciente() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const navigate = useNavigate();

  // Busca o histórico completo ao montar a página
  const fetchTodas = () => {
    setLoading(true);
    setErro(false);
    api.get('/paciente/todas-solicitacoes')
      .then(r => setSolicitacoes(r.data))
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTodas(); }, []);

  // Status que indicam solicitação encerrada — vão para a seção Histórico
  const STATUS_ENCERRADO = ['concluido', 'cancelado'];

  // Separa ativas de históricas para exibição em seções distintas
  const ativas    = solicitacoes.filter(s => !STATUS_ENCERRADO.includes(s.status));
  const historico = solicitacoes.filter(s =>  STATUS_ENCERRADO.includes(s.status));

  // Skeleton de carregamento — mantém o layout consistente com o Dashboard
  if (loading) {
    return (
      <PacienteLayout>
        <div className="animate-pulse">
          <div className="bg-primary pt-12 pb-10 px-6">
            <div className="h-7 w-48 bg-white/30 rounded"></div>
          </div>
          <div className="px-6 pt-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-surface-variant">
                <div className="h-5 w-3/4 bg-surface-container-high rounded mb-3"></div>
                <div className="h-10 bg-surface-container-high rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </PacienteLayout>
    );
  }

  // Estado de erro com retry
  if (erro) {
    return (
      <PacienteLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">wifi_off</span>
          <p className="font-bold text-on-surface text-lg">Não conseguimos carregar suas solicitações</p>
          <p className="text-sm text-on-surface-variant">Verifique sua conexão e tente novamente.</p>
          <button onClick={fetchTodas} className="mt-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl text-sm">
            Tentar novamente
          </button>
        </div>
      </PacienteLayout>
    );
  }

  return (
    <PacienteLayout>
      {/* ── Cabeçalho simples (sem o hero verde com nome — só o título da seção) ── */}
      <header className="bg-primary pt-12 pb-4 px-6">
        <button
          onClick={() => navigate('/paciente/dashboard')}
          className="flex items-center gap-1 text-white/80 text-sm mb-4 hover:text-white"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Voltar
        </button>
        <h1 className="text-on-primary text-2xl font-extrabold">Minhas Solicitações</h1>
        <p className="text-white/70 text-sm mt-1">
          {solicitacoes.length} solicitação{solicitacoes.length !== 1 ? 'ões' : ''} no total
        </p>
      </header>

      {/* ── Conteúdo principal com padding-bottom para não sumir atrás do nav ── */}
      <main className="px-6 py-5 space-y-5 pb-28">

        {/* Seção: Solicitações Ativas */}
        {ativas.length > 0 && (
          <section>
            <h2 className="text-base font-extrabold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">pending</span>
              Em andamento ({ativas.length})
            </h2>
            <div className="space-y-4">
              {ativas.map(sol => <CardSolicitacao key={sol.id} sol={sol} navigate={navigate} />)}
            </div>
          </section>
        )}

        {/* Seção: Histórico (concluídas + canceladas) */}
        {historico.length > 0 && (
          <section>
            <h2 className="text-base font-extrabold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">history</span>
              Histórico ({historico.length})
            </h2>
            <div className="space-y-4">
              {historico.map(sol => <CardSolicitacao key={sol.id} sol={sol} navigate={navigate} />)}
            </div>
          </section>
        )}

        {/* Empty state quando não há nenhuma solicitação */}
        {solicitacoes.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-3 block">folder_open</span>
            <p className="font-semibold">Nenhuma solicitação registrada ainda.</p>
            <p className="text-sm mt-1">Suas consultas e exames aparecerão aqui quando cadastrados pela UBS.</p>
          </div>
        )}
      </main>
    </PacienteLayout>
  );
}
