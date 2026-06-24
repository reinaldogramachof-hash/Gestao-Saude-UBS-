// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA: PainelMedico.jsx
// FUNÇÃO: Painel de consulta clínica de prontuários exclusivo para médicos.
//         Permite buscar pacientes por nome ou CRA, visualizar prontuário e 
//         histórico de solicitações e evolução clínica em modo somente leitura (read-only),
//         garantindo privacidade e segurança.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
// formatarDataBR: corrige bug de fuso horário em strings de data sem horário (UTC-3)
import { formatarDataBR } from '../../utils/statusHelper';
import GestorLayout from '../../components/gestor/GestorLayout';

// Dicionário de tradução de tipos de unidade do SUS para linguagem simples
const TIPO_UNIDADE_LABEL = {
  ubs:                  'UBS',
  ame:                  'AME',
  caps:                 'CAPS',
  upa:                  'UPA',
  centro_especialidades:'Centro de Especialidades',
  hospital:             'Hospital',
  pronto_socorro:       'Pronto-Socorro',
  outro:                'Outro',
};

// Mapeamento de ícones do Material Symbols correspondentes ao tipo de unidade
const TIPO_UNIDADE_ICON = {
  ubs:                  'home_health',
  ame:                  'medical_services',
  caps:                 'psychology',
  upa:                  'local_hospital',
  centro_especialidades:'domain',
  hospital:             'local_hospital',
  pronto_socorro:       'emergency',
  outro:                'description',
};

// Mapa cromático e de estilos translúcidos para as badges de status de alta definição
const STATUS_ESTILO = {
  em_analise: {
    badge: 'bg-gray-500/10 text-gray-750 border-gray-500/20',
    dot: 'bg-gray-500',
  },
  aguardando_regulacao: {
    badge: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  autorizado: {
    badge: 'bg-blue-500/10 text-blue-850 border-blue-500/20',
    dot: 'bg-blue-500',
  },
  data_marcada: {
    badge: 'bg-teal-500/10 text-teal-800 border-teal-500/20',
    dot: 'bg-teal-500',
  },
  aguardando_resultado: {
    badge: 'bg-purple-500/10 text-purple-800 border-purple-500/20',
    dot: 'bg-purple-500',
  },
  concluido: {
    badge: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  cancelado: {
    badge: 'bg-red-500/10 text-red-800 border-red-500/20',
    dot: 'bg-red-500',
  },
};

const STATUS_LABEL = {
  em_analise:           'Em Análise',
  aguardando_regulacao: 'Ag. Regulação',
  autorizado:           'Autorizado',
  data_marcada:         'Data Marcada',
  aguardando_resultado: 'Ag. Resultado',
  concluido:            'Concluído',
  cancelado:            'Cancelado',
  urgente_escalado:     'Escalado para Urgente',
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: CardSolicitacaoMedico
// FUNÇÃO: Renderiza o card de solicitação clínica no painel médico.
//         Exibe o status com indicador de bolinha sólido, laudo médico e histórico
//         detalhado de forma somente leitura, impedindo modificações por médicos.
// ─────────────────────────────────────────────────────────────────────────────
function CardSolicitacaoMedico({ sol, alternarHistorico, historicosAbertos, historicos, carregarHistorico }) {
  return (
    <div className={`bg-surface-container-lowest rounded-2xl border border-surface-variant p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group/card-sol-med ${
      sol.prioridade === 'urgente' ? 'border-l-4 border-l-red-500' : ''
    }`}>
      {/* Badge discreta indicadora de urgência clínica */}
      {sol.prioridade === 'urgente' && (
        <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-bl-lg shadow-sm animate-pulse select-none">
          Urgente
        </div>
      )}

      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <h3 className="font-extrabold text-on-background text-base tracking-tight truncate">
              {sol.descricao_paciente}
            </h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-surface-container-high rounded text-on-surface-variant/90 uppercase tracking-wider flex-shrink-0 select-none">
              {sol.tipo}
            </span>
            {/* Chip de status translúcido com bolinha indicadora sólida */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border flex-shrink-0 select-none ${
              STATUS_ESTILO[sol.status]?.badge || 'bg-gray-500/10 text-gray-750 border-gray-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                STATUS_ESTILO[sol.status]?.dot || 'bg-gray-500'
              } ${sol.status === 'aguardando_regulacao' || sol.status === 'em_analise' ? 'animate-pulse' : ''}`} />
              {STATUS_LABEL[sol.status] || sol.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-on-surface-variant/80">
            {sol.data_prevista && (
              <p className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                Previsão de Atendimento: <strong className="text-on-surface">{formatarDataBR(sol.data_prevista)}</strong>
              </p>
            )}
            {sol.local_executor && (
              <p className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                Local: <strong className="text-on-surface">{sol.local_executor}</strong>
              </p>
            )}
          </div>

          {sol.observacao_paciente && (
            <p className="text-xs text-on-surface-variant/80 italic mt-2 bg-surface-container-low/40 p-2.5 rounded-xl border border-surface-variant/30">
              {sol.observacao_paciente}
            </p>
          )}

          {/* Resultado clínico / Laudo homologado formatado como documento oficial */}
          {(sol.resultado || sol.cid_10) && (
            <div className="mt-3.5 p-4 bg-emerald-500/5 border border-emerald-500/25 rounded-xl space-y-1.5 shadow-inner">
              <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
                Resultado / Laudo Clínico Homologado
              </p>
              {sol.cid_10 && (
                <p className="text-xs font-bold text-emerald-700">
                  <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 mr-1 select-all font-mono">
                    CID-10: {sol.cid_10}
                  </span>
                </p>
              )}
              {sol.resultado && (
                <p className="text-xs md:text-sm text-emerald-900 font-semibold leading-relaxed mt-1 select-text">
                  {sol.resultado}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Histórico cronológico das alterações de status da solicitação */}
      <div className="mt-4 pt-4 border-t border-surface-variant/60">
        <button
          onClick={() => alternarHistorico(sol.id)}
          className="flex items-center gap-1.5 text-xs font-extrabold text-primary hover:text-primary-dark uppercase tracking-wider transition-colors select-none"
          aria-expanded={Boolean(historicosAbertos[sol.id])}
        >
          <span className="material-symbols-outlined text-[17px]">
            {historicosAbertos[sol.id] ? 'expand_less' : 'history'}
          </span>
          {historicosAbertos[sol.id] ? 'Ocultar histórico' : 'Ver histórico de alterações'}
        </button>

        {historicosAbertos[sol.id] && (
          <div className="mt-4 animate-fade-in select-none">
            {historicos[sol.id]?.loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-14 bg-surface-container-high rounded-xl" />
                <div className="h-14 bg-surface-container-high rounded-xl" />
              </div>
            ) : historicos[sol.id]?.erro ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold">{historicos[sol.id].erro}</span>
                <button onClick={() => carregarHistorico(sol.id, true)} className="px-3 py-1.5 bg-white rounded-lg font-bold text-xs shadow-sm hover:shadow-md active:scale-95 transition-all">Tentar novamente</button>
              </div>
            ) : historicos[sol.id]?.itens?.length > 0 ? (
              <ol className="space-y-3 relative before:absolute before:inset-y-1 before:left-3 before:w-0.5 before:bg-surface-variant/40 pl-7">
                {historicos[sol.id].itens.map((item) => (
                  <li key={item.id} className="relative group/timeline-item">
                    {/* Nó marcador da evolução do status */}
                    <span className="absolute -left-7 top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface-container-lowest z-10 group-hover/timeline-item:scale-125 transition-transform" />
                    
                    <div className="p-4 rounded-xl bg-surface-container-low/50 border border-surface-variant/50 hover:bg-surface-container-low transition-colors duration-200">
                      <p className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-wide">
                        {new Date(item.alterado_em).toLocaleString('pt-BR')}
                        {item.gestor_nome ? ` • Gestor: ${item.gestor_nome}` : ''}
                      </p>
                      <p className="font-bold text-on-background mt-1.5 text-sm">
                        Mudança de: <span className="text-on-surface-variant font-medium">{item.status_anterior ? (STATUS_LABEL[item.status_anterior] || item.status_anterior) : 'Cadastro inicial'}</span>
                        {' → '}
                        Para: <span className="text-primary font-extrabold">{STATUS_LABEL[item.status_novo] || item.status_novo}</span>
                      </p>
                      {item.observacao && <p className="text-xs text-on-surface-variant/90 font-medium mt-1.5 italic select-text">Observação: "{item.observacao}"</p>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-on-surface-variant font-semibold">Nenhum evento de histórico registrado.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: PainelMedico
// ─────────────────────────────────────────────────────────────────────────────
export default function PainelMedico() {
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  const [pacientesLista, setPacientesLista] = useState([]);
  const [pacienteAtivo, setPacienteAtivo] = useState(null);
  const [loadingPaciente, setLoadingPaciente] = useState(false);
  const [historicos, setHistoricos] = useState({});
  const [historicosAbertos, setHistoricosAbertos] = useState({});
  const [atendimentos, setAtendimentos] = useState([]);
  const [loadingAtendimentos, setLoadingAtendimentos] = useState(false);

  // Controle de aba de visualização ativa do prontuário do paciente carregado
  // Opções: 'dados' (dados clínicos), 'solicitacoes' (pedidos de exames), 'linha_do_tempo' (evolução)
  const [abaAtiva, setAbaAtiva] = useState('dados');

  // Trata a busca de pacientes por CRA ou Nome
  const handleBusca = async (e) => {
    e.preventDefault();
    if (!busca.trim()) return;

    setBuscando(true);
    setBuscaRealizada(false);
    setPacienteAtivo(null);
    setPacientesLista([]);
    setHistoricos({});
    setHistoricosAbertos({});
    setAtendimentos([]);

    try {
      const { data } = await api.get(`/gestor/pacientes?busca=${encodeURIComponent(busca.trim())}`);

      if (data.length === 1) {
        // Unico paciente encontrado: carrega o prontuário direto, sem etapa de seleção
        carregarPerfil(data[0].id);
      } else {
        // Múltiplos pacientes ou nenhum: exibe listagem de seleção
        setPacientesLista(data);
        setBuscaRealizada(true);
      }
    } catch (err) {
      console.error('[PainelMedico] Erro na busca de paciente:', err);
      toast.error('Erro ao realizar busca de pacientes. Tente novamente.');
      setBuscaRealizada(true);
    } finally {
      setBuscando(false);
    }
  };

  // Efetua a carga de prontuário e evolução clínica de um paciente específico
  const carregarPerfil = async (id) => {
    setLoadingPaciente(true);
    setPacientesLista([]);
    setAtendimentos([]);
    setAbaAtiva('dados'); // Reinicia na aba de dados clínicos
    try {
      const { data } = await api.get(`/gestor/paciente/${id}`);
      setPacienteAtivo(data);
      
      // Carrega atendimentos passados (evolução clínica)
      setLoadingAtendimentos(true);
      try {
        const resAt = await api.get(`/gestor/paciente/${id}/atendimentos`);
        setAtendimentos(resAt.data);
      } catch (err) {
        console.error('[PainelMedico] Erro ao carregar atendimentos:', err);
        toast.error('Erro ao carregar histórico de atendimentos.');
      } finally {
        setLoadingAtendimentos(false);
      }
    } catch (err) {
      console.error('[PainelMedico] Erro ao carregar prontuário:', err);
      toast.error('Não foi possível carregar os dados clínicos do paciente.');
    } finally {
      setLoadingPaciente(false);
    }
  };

  // Carrega o histórico de status de uma solicitação (lazy loading)
  const carregarHistorico = async (solicitacaoId, forcar = false) => {
    setHistoricos((prev) => ({
      ...prev,
      [solicitacaoId]: { ...prev[solicitacaoId], loading: true, erro: '' },
    }));
    try {
      const { data } = await api.get(`/gestor/solicitacao/${solicitacaoId}/historico`);
      setHistoricos((prev) => ({
        ...prev,
        [solicitacaoId]: { itens: data, loading: false, erro: '' },
      }));
    } catch {
      setHistoricos((prev) => ({
        ...prev,
        [solicitacaoId]: {
          itens: forcar ? [] : (prev[solicitacaoId]?.itens || []),
          loading: false,
          erro: 'Não foi possível carregar o histórico.',
        },
      }));
    }
  };

  // Abre ou colapsa o histórico de status de uma solicitação
  const alternarHistorico = (solicitacaoId) => {
    const vaiAbrir = !historicosAbertos[solicitacaoId];
    setHistoricosAbertos((prev) => ({ ...prev, [solicitacaoId]: vaiAbrir }));
    if (vaiAbrir && !historicos[solicitacaoId]) {
      carregarHistorico(solicitacaoId);
    }
  };

  // Segmenta as solicitações ativas das finalizadas
  const STATUS_ENCERRADO = ['concluido', 'cancelado'];
  const solicitacoesAtivas = (pacienteAtivo?.solicitacoes || []).filter(
    (s) => !STATUS_ENCERRADO.includes(s.status)
  );
  const solicitacoesEncerradas = (pacienteAtivo?.solicitacoes || []).filter(
    (s) => STATUS_ENCERRADO.includes(s.status)
  );

  return (
    <GestorLayout>
      {/* ─── Cabeçalho da Página ─── */}
      <div className="mb-6 lg:mb-8 animate-fade-in select-none">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">
          Painel Médico
        </h1>
        <p className="text-on-surface-variant font-semibold text-sm mt-1">
          Busca e consulta integrada de histórico clínico de pacientes em modo de leitura protegida.
        </p>
      </div>

      {/* ─── Formulário de Busca Estilizado (Foco Soft) ─── */}
      <form onSubmit={handleBusca} className="flex gap-3 max-w-2xl mb-8 group select-none">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            type="text"
            placeholder="Digite o CRA ou nome completo do paciente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-surface-variant/60 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-semibold text-sm shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={buscando}
          className="h-12 px-6 bg-primary text-white font-bold rounded-2xl hover:shadow-primary/25 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-sm flex items-center justify-center flex-shrink-0 disabled:opacity-50"
        >
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* ─── Estado Inicial ─── */}
      {!buscaRealizada && !buscando && !loadingPaciente && !pacienteAtivo && (
        <div className="py-20 text-center bg-surface-container-lowest rounded-3xl border border-surface-variant select-none animate-fade-in">
          <span className="material-symbols-outlined text-5xl block mb-3 opacity-30 text-on-surface-variant">
            stethoscope
          </span>
          <p className="text-on-surface-variant font-extrabold text-base">Prontuário Médico Digital</p>
          <p className="text-xs text-on-surface-variant/75 mt-1 max-w-md mx-auto">
            Informe o número de CRA ou nome do munícipe acima para carregar o prontuário completo, histórico de exames e evolução clínica.
          </p>
        </div>
      )}

      {/* ─── Listagem de Múltiplos Resultados ─── */}
      {buscaRealizada && !buscando && pacientesLista.length > 1 && (
        <div className="bg-surface-container-lowest rounded-3xl border border-surface-variant shadow-sm overflow-hidden mb-6 animate-fade-in select-none">
          <div className="p-4 md:p-5 border-b border-surface-variant bg-surface-container-low/50 backdrop-blur-md">
            <h3 className="font-extrabold text-on-background text-sm">
              Selecione o Paciente ({pacientesLista.length} encontrados)
            </h3>
          </div>
          <div className="divide-y divide-surface-variant">
            {pacientesLista.map((p) => (
              <button
                key={p.id}
                onClick={() => carregarPerfil(p.id)}
                className="w-full text-left p-4 md:p-5 hover:bg-surface-container-low/30 transition-colors flex justify-between items-center gap-4 group/item-p"
              >
                <div>
                  <div className="font-bold text-on-background group-hover/item-p:text-primary transition-colors">{p.nome}</div>
                  <div className="text-xs text-on-surface-variant/80 font-semibold mt-1">
                    Data de Nascimento: {formatarDataBR(p.data_nascimento)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="bg-surface-container-high px-2.5 py-1 rounded-lg text-xs font-bold text-on-surface-variant border border-outline-variant select-all">
                    CRA: {p.cra}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant/70 group-hover/item-p:text-primary transition-colors text-lg">
                    chevron_right
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Paciente Não Encontrado ─── */}
      {buscaRealizada && !buscando && pacientesLista.length === 0 && !pacienteAtivo && !loadingPaciente && (
        <div className="py-16 text-center bg-surface-container-lowest rounded-3xl border border-surface-variant select-none animate-fade-in">
          <span className="material-symbols-outlined text-5xl block mb-3 opacity-30 text-on-surface-variant">
            search_off
          </span>
          <p className="text-on-surface-variant font-extrabold text-base">
            Paciente não localizado.
          </p>
          <p className="text-xs text-on-surface-variant/75 mt-1 max-w-sm mx-auto">
            Verifique se digitou corretamente o número do CRA ou tente realizar a busca pelo nome completo do cidadão.
          </p>
        </div>
      )}

      {/* ─── Loader do Prontuário ─── */}
      {loadingPaciente && (
        <div className="space-y-4 animate-pulse select-none">
          <div className="h-8 bg-surface-container-low rounded w-64" />
          <div className="h-44 bg-surface-container-low rounded-3xl" />
          <div className="h-10 bg-surface-container-low rounded-xl w-96" />
          <div className="h-32 bg-surface-container-low rounded-2xl" />
        </div>
      )}

      {/* ─── Prontuário Clínico Selecionado (Read-Only) ─── */}
      {!loadingPaciente && pacienteAtivo && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Ficha Principal e Cabeçalho do Prontuário (Card Hero) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 select-none p-5 md:p-6 bg-surface-container-lowest rounded-3xl border border-surface-variant shadow-sm">
            {/* Avatar com Iniciais em Destaque */}
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/15 border-2 border-primary/20 text-primary font-black flex items-center justify-center text-base md:text-2xl shadow-sm flex-shrink-0">
              {(pacienteAtivo.nome || 'P')
                .split(' ')
                .filter(Boolean)
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <h2 className="text-xl md:text-3xl font-black tracking-tight text-on-background truncate">
                {pacienteAtivo.nome}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="bg-surface-container-high px-2.5 py-0.5 rounded text-xs font-bold text-on-surface-variant border border-outline-variant select-all">
                  CRA: {pacienteAtivo.cra}
                </span>
                {pacienteAtivo.tipo_sanguineo && (
                  <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-800 border border-red-500/20 px-2 py-0.5 rounded text-xs font-black">
                    <span className="material-symbols-outlined text-[12px]">water_drop</span>
                    Sangue {pacienteAtivo.tipo_sanguineo}
                  </span>
                )}
                {pacienteAtivo.alergias && (
                  <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-800 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-black animate-pulse">
                    <span className="material-symbols-outlined text-[12px]">warning</span>
                    Alergia registrada
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Abas de Navegação Premium (Pílula Deslizante) */}
          <div className="flex bg-surface-container-high/50 backdrop-blur-md p-1 rounded-xl max-w-md border border-surface-variant/30 select-none">
            {[
              { id: 'dados',          label: 'Dados Clínicos',  icon: 'person' },
              { id: 'solicitacoes',   label: 'Solicitações',    icon: 'receipt_long' },
              { id: 'linha_do_tempo', label: 'Linha do Tempo',  icon: 'timeline' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAbaAtiva(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs md:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  abaAtiva === tab.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════════════════════════════════
              ABA: DADOS CLÍNICOS
              ════════════════════════════════════════════════════════════════ */}
          {abaAtiva === 'dados' && (
            <div className="space-y-6">
              {/* Informações Pessoais de Consulta */}
              <div className="bg-surface-container-lowest rounded-3xl border border-surface-variant p-5 md:p-8">
                <h3 className="text-base font-extrabold text-on-background mb-5 select-none">Dados Pessoais do Paciente</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { label: 'Data de Nascimento', value: pacienteAtivo.data_nascimento ? formatarDataBR(pacienteAtivo.data_nascimento) : '—' },
                    { label: 'Telefone',           value: pacienteAtivo.telefone || '—' },
                    { label: 'E-mail',             value: pacienteAtivo.email || '—' },
                    { label: 'Bairro',             value: pacienteAtivo.bairro || '—' },
                    { label: 'UBS de Referência',  value: pacienteAtivo.ubs_nome || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="select-none">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
                      <p className="font-bold text-on-background text-sm md:text-base select-text">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Informações de Evolução Clínica e Patologias */}
              <div className="bg-surface-container-lowest rounded-3xl border border-surface-variant p-5 md:p-8">
                <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider mb-5 select-none">
                  Dados e Anamnese Clínica
                </h3>

                {/* Cards de Métricas Vitais */}
                {(pacienteAtivo.tipo_sanguineo || pacienteAtivo.peso_kg || pacienteAtivo.altura_cm) && (
                  <div className="flex gap-4 flex-wrap mb-5 select-none">
                    {pacienteAtivo.tipo_sanguineo && (
                      <div className="px-4 py-2.5 bg-surface-container-high/60 border border-surface-variant/40 rounded-2xl flex flex-col justify-center min-w-[110px] shadow-sm">
                        <p className="text-xs font-bold text-on-surface-variant">Tipo Sanguíneo</p>
                        <p className="font-black text-red-655 text-xl mt-0.5">{pacienteAtivo.tipo_sanguineo}</p>
                      </div>
                    )}
                    {pacienteAtivo.peso_kg && (
                      <div className="px-4 py-2.5 bg-surface-container-high/60 border border-surface-variant/40 rounded-2xl flex flex-col justify-center min-w-[110px] shadow-sm">
                        <p className="text-xs font-bold text-on-surface-variant">Peso Corporal</p>
                        <p className="font-extrabold text-on-background text-base mt-0.5">{pacienteAtivo.peso_kg} kg</p>
                      </div>
                    )}
                    {pacienteAtivo.altura_cm && (
                      <div className="px-4 py-2.5 bg-surface-container-high/60 border border-surface-variant/40 rounded-2xl flex flex-col justify-center min-w-[110px] shadow-sm">
                        <p className="text-xs font-bold text-on-surface-variant">Altura</p>
                        <p className="font-extrabold text-on-background text-base mt-0.5">{pacienteAtivo.altura_cm} cm</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Blocos de Alertas de Alta Visibilidade */}
                <div className="space-y-4">
                  {pacienteAtivo.alergias ? (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/25 rounded-2xl flex gap-3">
                      <span className="material-symbols-outlined text-amber-700 mt-0.5">warning</span>
                      <div>
                        <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider select-none">Alergias Diagnosticadas</p>
                        <p className="text-sm text-amber-955 font-bold leading-relaxed mt-1 select-text">{pacienteAtivo.alergias}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-surface-container-high/40 border border-surface-variant/30 rounded-xl text-xs font-bold text-on-surface-variant italic select-none">
                      Nenhuma alergia relatada no prontuário.
                    </div>
                  )}

                  {pacienteAtivo.comorbidades && (
                    <div className="p-4 bg-red-500/5 border border-red-500/25 rounded-2xl flex gap-3">
                      <span className="material-symbols-outlined text-red-655 mt-0.5">medical_information</span>
                      <div>
                        <p className="text-xs font-extrabold text-red-800 uppercase tracking-wider select-none">Comorbidades / DCNT</p>
                        <p className="text-sm text-red-955 font-bold leading-relaxed mt-1 select-text">{pacienteAtivo.comorbidades}</p>
                      </div>
                    </div>
                  )}

                  {pacienteAtivo.medicamentos_uso_continuo && (
                    <div className="p-4 bg-blue-500/5 border border-blue-500/25 rounded-2xl flex gap-3">
                      <span className="material-symbols-outlined text-blue-700 mt-0.5">pill</span>
                      <div>
                        <p className="text-xs font-extrabold text-blue-800 uppercase tracking-wider select-none">Medicamentos de Uso Contínuo</p>
                        <p className="text-sm text-blue-955 font-bold leading-relaxed mt-1 select-text">{pacienteAtivo.medicamentos_uso_continuo}</p>
                      </div>
                    </div>
                  )}

                  {pacienteAtivo.observacoes_clinicas && (
                    <div className="p-4 bg-surface-container-high/40 border border-surface-variant/40 rounded-2xl">
                      <p className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider mb-1.5 select-none">Observações Clínicas Adicionais</p>
                      <p className="text-sm text-on-background font-semibold leading-relaxed select-text">{pacienteAtivo.observacoes_clinicas}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              ABA: SOLICITAÇÕES CLÍNICAS (READ-ONLY)
              ════════════════════════════════════════════════════════════════ */}
          {abaAtiva === 'solicitacoes' && (
            <div className="space-y-6">
              {/* Solicitações Ativas na Fila */}
              <div>
                <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider mb-4 select-none">
                  Solicitações Ativas
                </h3>
                {solicitacoesAtivas.length > 0 ? (
                  <div className="space-y-4">
                    {solicitacoesAtivas.map((sol) => (
                      <CardSolicitacaoMedico
                        key={sol.id}
                        sol={sol}
                        alternarHistorico={alternarHistorico}
                        historicosAbertos={historicosAbertos}
                        historicos={historicos}
                        carregarHistorico={carregarHistorico}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-surface-container-lowest rounded-3xl border border-dashed border-surface-variant/70 select-none">
                    <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">clinical_notes</span>
                    <p className="text-on-surface-variant font-bold text-sm">Nenhuma solicitação ativa no momento.</p>
                  </div>
                )}
              </div>

              {/* Histórico de Solicitações Concluídas/Canceladas */}
              {solicitacoesEncerradas.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2 select-none">
                    <span className="material-symbols-outlined text-base">history</span>
                    Histórico de Solicitações Encerradas ({solicitacoesEncerradas.length})
                  </h3>
                  <div className="space-y-4 opacity-80 hover:opacity-100 transition-opacity duration-300">
                    {solicitacoesEncerradas.map((sol) => (
                      <CardSolicitacaoMedico
                        key={sol.id}
                        sol={sol}
                        alternarHistorico={alternarHistorico}
                        historicosAbertos={historicosAbertos}
                        historicos={historicos}
                        carregarHistorico={carregarHistorico}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              ABA: LINHA DO TEMPO (EVOLUÇÃO CLÍNICA - READ-ONLY)
              ════════════════════════════════════════════════════════════════ */}
          {abaAtiva === 'linha_do_tempo' && (
            <div className="bg-surface-container-lowest rounded-3xl border border-surface-variant p-5 md:p-8">
              <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider mb-6 flex items-center gap-2 select-none">
                <span className="material-symbols-outlined text-base">timeline</span>
                Evolução Clínica do Cidadão no SUS
              </h3>

              {loadingAtendimentos ? (
                <div className="space-y-3 animate-pulse select-none">
                  <div className="h-20 bg-surface-container-low rounded-2xl" />
                  <div className="h-20 bg-surface-container-low rounded-2xl" />
                </div>
              ) : atendimentos.length > 0 ? (
                /* Trilha de evolução pontilhada vertical */
                <ol className="space-y-6 relative before:absolute before:inset-y-1 before:left-4 before:w-0.5 before:border-l-2 before:border-dashed before:border-surface-variant pl-10 select-none">
                  {atendimentos.map((at) => (
                    <li key={at.id} className="relative group/timeline-atendimento">
                      {/* Nó marcador com ícone contextual baseado na unidade de saúde */}
                      <span className="absolute -left-10 top-1 w-8 h-8 rounded-full bg-surface-container-high border-2 border-surface-variant flex items-center justify-center z-10 group-hover/timeline-atendimento:scale-110 group-hover/timeline-atendimento:border-primary transition-all duration-300">
                        <span className="material-symbols-outlined text-base text-primary">
                          {TIPO_UNIDADE_ICON[at.tipo_unidade] || 'description'}
                        </span>
                      </span>

                      <div className="p-5 rounded-2xl bg-surface-container-low/40 hover:bg-surface-container-low/70 border border-surface-variant/60 hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-xs font-extrabold text-primary uppercase tracking-wider">
                            {formatarDataBR(at.data_atendimento)}
                          </span>
                          {at.tipo_unidade && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-500/10 text-blue-800 border border-blue-500/20 rounded-full uppercase tracking-wider">
                              {TIPO_UNIDADE_LABEL[at.tipo_unidade] || at.tipo_unidade}
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-black text-on-background text-base">{at.unidade}</h4>
                        
                        {at.especialidade && (
                          <p className="text-xs text-on-surface-variant font-bold mt-0.5">
                            Especialidade: {at.especialidade}
                            {at.profissional ? ` • Responsável: Dr(a). ${at.profissional}` : ''}
                          </p>
                        )}

                        {/* Códigos CID-10 associados à evolução */}
                        {(at.cid_10_principal || at.cid_10_secundario) && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {at.cid_10_principal && (
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 bg-blue-500/5 text-blue-700 border border-blue-500/15 rounded select-all font-mono">
                                CID-10 Principal: {at.cid_10_principal}
                              </span>
                            )}
                            {at.cid_10_secundario && (
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 bg-blue-500/5 text-blue-700 border border-blue-500/15 rounded select-all font-mono">
                                CID-10 Secundário: {at.cid_10_secundario}
                              </span>
                            )}
                          </div>
                        )}

                        {at.conduta && (
                          <div className="mt-3 p-3 bg-surface-container-high/50 rounded-xl border border-surface-variant/40">
                            <p className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Conduta Médica</p>
                            <p className="text-xs md:text-sm text-on-background font-semibold leading-relaxed select-text">{at.conduta}</p>
                          </div>
                        )}

                        {at.observacoes && (
                          <p className="text-xs text-on-surface-variant/95 font-medium leading-relaxed mt-2 select-text italic">
                            Anotações: "{at.observacoes}"
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="py-12 text-center bg-surface-container-lowest rounded-3xl border border-dashed border-surface-variant/70 select-none">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">hourglass_empty</span>
                  <p className="text-on-surface-variant font-bold text-sm">Nenhum atendimento ou evolução clínica registrado.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </GestorLayout>
  );
}
