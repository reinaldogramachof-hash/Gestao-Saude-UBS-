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
import { useAuth } from '../../hooks/useAuth';

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

const STATUS_VALIDOS = ['em_analise', 'aguardando_regulacao', 'autorizado', 'data_marcada', 'aguardando_resultado', 'concluido', 'cancelado'];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: CardSolicitacaoMedico
// FUNÇÃO: Renderiza o card de solicitação clínica no painel médico.
//         Exibe o status com indicador de bolinha sólido, laudo médico e histórico
//         detalhado de forma somente leitura, impedindo modificações por médicos.
// ─────────────────────────────────────────────────────────────────────────────
function CardSolicitacaoMedico({ sol, alternarHistorico, historicosAbertos, historicos, carregarHistorico, abrirModalStatus }) {
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
          
          {/* Botão de Lançar Laudo / Status */}
          {sol.status !== 'concluido' && sol.status !== 'cancelado' && (
            <div className="mt-3.5 pt-3.5 border-t border-surface-variant/30 flex justify-end select-none">
              <button
                type="button"
                onClick={() => abrirModalStatus(sol)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black rounded-xl transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
                Lançar Laudo / Status
              </button>
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
  const { user } = useAuth();
  
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

  // Estados para Evolução Clínica (Atendimentos)
  const [modalAtendimentoAberto, setModalAtendimentoAberto] = useState(false);
  const [enviandoAtendimento, setEnviandoAtendimento] = useState(false);
  const [atendimentoEditando, setAtendimentoEditando] = useState(null);
  const [deletandoAtendimento, setDeletandoAtendimento] = useState(null);
  const [formAtendimento, setFormAtendimento] = useState({
    data_atendimento: '', unidade: '', tipo_unidade: '',
    especialidade: '', profissional: '',
    cid_10_principal: '', cid_10_secundario: '',
    conduta: '', observacoes: '',
  });

  // Estados para Parâmetros Clínicos (Anamnese)
  const [modalDadosAberto, setModalDadosAberto] = useState(false);
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [formDados, setFormDados] = useState({
    tipo_sanguineo: '', peso_kg: '', altura_cm: '',
    alergias: '', comorbidades: '', medicamentos_uso_continuo: '',
    observacoes_clinicas: '',
  });

  // Estados para Laudo / Status de Solicitação
  const [modalStatusAberto, setModalStatusAberto] = useState(false);
  const [enviandoStatus, setEnviandoStatus] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  const [formStatus, setFormStatus] = useState({
    status_novo: '', observacao: '', resultado: '', cid_10: '',
  });
 
  // Controle de aba de visualização ativa do prontuário do paciente carregado
  // Opções: 'dados' (dados clínicos), 'solicitacoes' (pedidos de exames), 'linha_do_tempo' (evolução)
  const [abaAtiva, setAbaAtiva] = useState('dados');

  // Estados para Criação de Solicitações Clínicas e Encaminhamentos
  const [modalSolicitacaoAberto, setModalSolicitacaoAberto] = useState(false);
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);
  const [formSolicitacao, setFormSolicitacao] = useState({
    tipo: 'exame',
    descricao_interna: '',
    descricao_paciente: '',
    prioridade: 'rotina',
    data_prevista: '',
    local_executor: '',
    catalogo_id: null,
    unidade_externa_id: null,
  });
  const [catalogoSugestoes, setCatalogoSugestoes] = useState([]);
  const [unidadesExternas, setUnidadesExternas] = useState([]);
  const [buscaCatalogo, setBuscaCatalogo] = useState('');
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  // Estados do Dashboard
  const [agendamentosDoDia, setAgendamentosDoDia] = useState([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  useEffect(() => {
    async function carregarAgenda() {
      if (!user) return;
      try {
        setLoadingAgenda(true);
        const res = await api.get(`/gestor/agendamentos?status=reservado&gestor_responsavel_id=${user.id}`);
        const hojeLocal = new Date().toLocaleDateString('pt-BR');
        const agendaHoje = res.data.filter(a => {
           if (!a.data_hora) return false;
           return new Date(a.data_hora).toLocaleDateString('pt-BR') === hojeLocal;
        });
        setAgendamentosDoDia(agendaHoje);
      } catch (error) {
        console.error('[PainelMedico] Erro ao carregar agenda:', error);
      } finally {
        setLoadingAgenda(false);
      }
    }
    carregarAgenda();
  }, [user]);

  // Carrega a lista de unidades externas no mount da página para combos de encaminhamento
  useEffect(() => {
    api.get('/gestor/unidades-externas')
      .then(r => setUnidadesExternas(r.data))
      .catch(err => console.error('[PainelMedico] Erro ao carregar unidades externas:', err));
  }, []);

  // ── Funções Clínicas: Evolução (Atendimentos) ──
  const resetFormAtendimento = () => {
    setFormAtendimento({
      data_atendimento: '', unidade: '', tipo_unidade: '',
      especialidade: '', profissional: '',
      cid_10_principal: '', cid_10_secundario: '',
      conduta: '', observacoes: '',
    });
  };

  const abrirModalNovoAtendimento = () => {
    setAtendimentoEditando(null);
    setFormAtendimento({
      data_atendimento: new Date().toISOString().split('T')[0],
      unidade: '', tipo_unidade: 'ubs',
      especialidade: '', profissional: user?.nome || '', // pré-preenche médico logado
      cid_10_principal: '', cid_10_secundario: '',
      conduta: '', observacoes: '',
    });
    setModalAtendimentoAberto(true);
  };

  const abrirModalEditarAtendimento = (at) => {
    setAtendimentoEditando(at);
    setFormAtendimento({
      data_atendimento: at.data_atendimento?.split('T')[0] || '',
      unidade:           at.unidade || '',
      tipo_unidade:      at.tipo_unidade || '',
      especialidade:     at.especialidade || '',
      profissional:      at.profissional || '',
      cid_10_principal:  at.cid_10_principal || '',
      cid_10_secundario: at.cid_10_secundario || '',
      conduta:           at.conduta || '',
      observacoes:       at.observacoes || '',
    });
    setModalAtendimentoAberto(true);
  };

  const handleSalvarAtendimento = async (e) => {
    e.preventDefault();
    setEnviandoAtendimento(true);
    try {
      if (atendimentoEditando) {
        await api.put(`/gestor/atendimento/${atendimentoEditando.id}`, formAtendimento);
        toast.success('Evolução clínica atualizada!');
      } else {
        await api.post(`/gestor/paciente/${pacienteAtivo.id}/atendimento`, formAtendimento);
        toast.success('Evolução clínica registrada!');
      }
      setModalAtendimentoAberto(false);
      setAtendimentoEditando(null);
      resetFormAtendimento();
      // Recarrega os atendimentos
      const resAt = await api.get(`/gestor/paciente/${pacienteAtivo.id}/atendimentos`);
      setAtendimentos(resAt.data);
    } catch (err) {
      console.error('[PainelMedico] Erro ao salvar evolução:', err);
      toast.error('Erro ao salvar evolução clínica.');
    } finally {
      setEnviandoAtendimento(false);
    }
  };

  const handleDeletarAtendimento = async (atendimentoId) => {
    if (!window.confirm('Tem certeza de que deseja remover permanentemente esta evolução clínica?')) return;
    setDeletandoAtendimento(atendimentoId);
    try {
      await api.delete(`/gestor/atendimento/${atendimentoId}`);
      toast.success('Evolução clínica removida.');
      const resAt = await api.get(`/gestor/paciente/${pacienteAtivo.id}/atendimentos`);
      setAtendimentos(resAt.data);
    } catch (err) {
      console.error('[PainelMedico] Erro ao remover evolução:', err);
      toast.error('Erro ao remover evolução clínica.');
    } finally {
      setDeletandoAtendimento(null);
    }
  };

  // ── Funções Clínicas: Parâmetros Clínicos (Anamnese) ──
  const iniciarEdicaoDados = () => {
    setFormDados({
      tipo_sanguineo:            pacienteAtivo?.tipo_sanguineo || '',
      peso_kg:                   pacienteAtivo?.peso_kg || '',
      altura_cm:                 pacienteAtivo?.altura_cm || '',
      alergias:                  pacienteAtivo?.alergias || '',
      comorbidades:              pacienteAtivo?.comorbidades || '',
      medicamentos_uso_continuo: pacienteAtivo?.medicamentos_uso_continuo || '',
      observacoes_clinicas:      pacienteAtivo?.observacoes_clinicas || '',
    });
    setModalDadosAberto(true);
  };

  const handleSalvarDados = async (e) => {
    e.preventDefault();
    setSalvandoDados(true);
    try {
      const payload = {
        nome:                      pacienteAtivo.nome,
        telefone:                  pacienteAtivo.telefone,
        email:                     pacienteAtivo.email,
        bairro:                    pacienteAtivo.bairro,
        ativo:                     pacienteAtivo.ativo,
        ...formDados
      };
      await api.put(`/gestor/paciente/${pacienteAtivo.id}`, payload);
      toast.success('Prontuário clínico atualizado!');
      setModalDadosAberto(false);
      carregarPerfil(pacienteAtivo.id);
    } catch (err) {
      console.error('[PainelMedico] Erro ao salvar prontuário:', err);
      toast.error('Erro ao atualizar prontuário clínico.');
    } finally {
      setSalvandoDados(false);
    }
  };

  // ── Funções Clínicas: Laudo e Status de Solicitação ──
  const abrirModalStatus = (sol) => {
    setSolicitacaoSelecionada(sol);
    setFormStatus({
      status_novo: sol.status,
      observacao: '',
      resultado: sol.resultado || '',
      cid_10: sol.cid_10 || '',
    });
    setModalStatusAberto(true);
  };

  const handleAtualizarStatus = async (e) => {
    e.preventDefault();
    setEnviandoStatus(true);
    try {
      // 1. Atualiza status
      await api.put(`/gestor/solicitacao/${solicitacaoSelecionada.id}/status`, {
        status_novo: formStatus.status_novo,
        observacao: formStatus.observacao,
      });

      // 2. Registra resultado e CID-10
      if (formStatus.resultado || formStatus.cid_10) {
        await api.patch(`/gestor/solicitacao/${solicitacaoSelecionada.id}/resultado`, {
          resultado: formStatus.resultado || undefined,
          cid_10: formStatus.cid_10 || undefined,
        });
      }

      toast.success('Laudo e status atualizados com sucesso!');
      setModalStatusAberto(false);
      carregarPerfil(pacienteAtivo.id);
    } catch (err) {
      console.error('[PainelMedico] Erro ao laudar exame:', err);
      toast.error('Erro ao atualizar laudo e status.');
    } finally {
      setEnviandoStatus(false);
    }
  };

  // ── Funções Clínicas: Criação de Novas Solicitações e Encaminhamentos ──
  // Abre o modal de nova solicitação redefinindo o formulário de entrada para o padrão
  const abrirModalNovaSolicitacao = () => {
    setFormSolicitacao({
      tipo: 'exame',
      descricao_interna: '',
      descricao_paciente: '',
      prioridade: 'rotina',
      data_prevista: '',
      local_executor: '',
      catalogo_id: null,
      unidade_externa_id: null,
    });
    setBuscaCatalogo('');
    setCatalogoSugestoes([]);
    setModalSolicitacaoAberto(true);
  };

  // Envia os dados de criação de solicitação e encaminhamento integrado para o backend
  const handleSalvarSolicitacao = async (e) => {
    e.preventDefault();
    setEnviandoSolicitacao(true);
    try {
      await api.post(`/gestor/paciente/${pacienteAtivo.id}/solicitacao`, {
        ...formSolicitacao,
        data_solicitacao: new Date().toISOString().split('T')[0],
      });
      toast.success('Solicitação criada com sucesso!');
      setModalSolicitacaoAberto(false);
      // Recarrega o prontuário completo do paciente para atualizar os cards de exames/procedimentos
      carregarPerfil(pacienteAtivo.id);
    } catch (err) {
      console.error('[PainelMedico] Erro ao salvar solicitação:', err);
      toast.error('Erro ao criar solicitação. Verifique os campos obrigatórios.');
    } finally {
      setEnviandoSolicitacao(false);
    }
  };

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
    <>
      <div className="print:hidden min-h-screen">
        <GestorLayout>
      {/* ─── Cabeçalho da Página ─── */}
      <div className="mb-6 lg:mb-8 animate-fade-in select-none">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">
          Painel Médico
        </h1>
        <p className="text-on-surface-variant font-semibold text-sm mt-1">
          Busca, consulta e atendimento integrado de pacientes, com registro de evoluções, solicitações e encaminhamentos em tempo real.
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

      {/* ─── Dashboard Diário / Estado Inicial ─── */}
      {!buscaRealizada && !buscando && !loadingPaciente && !pacienteAtivo && (
        <div className="flex flex-col gap-6 animate-fade-in select-none">
          {/* Dashboard Clínico - Agenda do Médico */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-xl font-black text-on-background mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_today</span>
              Seus Atendimentos de Hoje
            </h3>
            {loadingAgenda ? (
              <p className="text-sm text-on-surface-variant font-medium animate-pulse">Carregando sua agenda clínica...</p>
            ) : agendamentosDoDia.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {agendamentosDoDia.map(ag => (
                  <div key={ag.id} className="p-4 rounded-2xl border border-surface-variant/60 bg-surface-container hover:bg-surface-container-high transition-colors flex flex-col gap-3 group">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-black uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md tracking-wider">
                        {new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })}
                      </p>
                      <span className="text-[10px] bg-amber-500/10 text-amber-800 border border-amber-500/20 font-bold px-1.5 py-0.5 rounded uppercase">{STATUS_LABEL[ag.status] || ag.status}</span>
                    </div>
                    <p className="font-extrabold text-base text-on-background truncate" title={ag.paciente_nome}>{ag.paciente_nome}</p>
                    <button 
                      onClick={() => carregarPerfil(ag.paciente_id)}
                      className="mt-auto w-full py-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:border-primary hover:text-on-primary text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">stethoscope</span>
                      Iniciar Atendimento
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container/50 border border-surface-variant/40 rounded-2xl p-6 text-center">
                <p className="text-sm text-on-surface-variant font-bold">A agenda para hoje está livre.</p>
                <p className="text-xs text-on-surface-variant/70 mt-1">Nenhum atendimento marcado para você nesta data.</p>
              </div>
            )}
          </div>

          <div className="py-12 text-center bg-surface-container-lowest rounded-3xl border border-surface-variant shadow-sm">
            <span className="material-symbols-outlined text-4xl block mb-2 opacity-30 text-on-surface-variant">
              medical_information
            </span>
            <p className="text-on-surface-variant font-extrabold text-base">Busca Avulsa de Prontuário</p>
            <p className="text-xs text-on-surface-variant/75 mt-1 max-w-sm mx-auto">
              Para pacientes de urgência ou fora da agenda, informe o número de CRA ou nome do munícipe na barra superior.
            </p>
          </div>
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
          
          {/* Ficha Principal e Cabeçalho do Prontuário (Card Hero) - Cores dinâmicas de Alerta */}
          <div className={`flex flex-col sm:flex-row sm:items-center gap-4 select-none p-5 md:p-6 rounded-3xl border shadow-sm relative overflow-hidden ${
            (pacienteAtivo.alergias || pacienteAtivo.comorbidades) ? 'bg-red-50 border-red-300' : 'bg-surface-container-lowest border-surface-variant'
          }`}>
            {(pacienteAtivo.alergias || pacienteAtivo.comorbidades) && (
              <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg shadow-sm animate-pulse flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">warning</span> Alerta Clínico
              </div>
            )}
            {/* Avatar com Iniciais em Destaque */}
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 font-black flex items-center justify-center text-base md:text-2xl shadow-sm flex-shrink-0 ${
              (pacienteAtivo.alergias || pacienteAtivo.comorbidades) ? 'bg-red-100 border-red-200 text-red-700' : 'bg-primary/15 border-primary/20 text-primary'
            }`}>
              {(pacienteAtivo.nome || 'P')
                .split(' ')
                .filter(Boolean)
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>

            <div className="min-w-0 mt-2 sm:mt-0 z-10 flex-1">
              <h2 className={`text-xl md:text-3xl font-black tracking-tight truncate ${
                (pacienteAtivo.alergias || pacienteAtivo.comorbidades) ? 'text-red-950' : 'text-on-background'
              }`}>
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

            {/* Botões de Ação Rápida */}
            <div className="sm:ml-auto flex items-center gap-3 mt-4 sm:mt-0 z-10">
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold rounded-xl text-xs md:text-sm transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                title="Imprimir documento oficial em branco para o paciente"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Receituário / Atestado
              </button>
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
                <div className="flex items-center justify-between gap-4 mb-5 select-none">
                  <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider">
                    Dados e Anamnese Clínica
                  </h3>
                  <button
                    type="button"
                    onClick={iniciarEdicaoDados}
                    className="px-4 py-2 border border-outline hover:bg-surface-container-high rounded-xl font-bold text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">edit_note</span>
                    Editar Parâmetros Clínicos
                  </button>
                </div>

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
              {/* Cabeçalho de Ações da Aba de Solicitações com botão premium de adição */}
              <div className="flex items-center justify-between gap-4 select-none">
                <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider">
                  Solicitações Ativas
                </h3>
                <button
                  type="button"
                  onClick={abrirModalNovaSolicitacao}
                  className="h-10 px-4 md:h-12 md:px-6 bg-primary text-white font-bold rounded-xl md:rounded-2xl shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Nova Solicitação
                </button>
              </div>

              {/* Solicitações Ativas na Fila */}
              <div>
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
                        abrirModalStatus={abrirModalStatus}
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
                        abrirModalStatus={abrirModalStatus}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              ABA: LINHA DO TEMPO (EVOLUÇÃO CLÍNICA)
              ════════════════════════════════════════════════════════════════ */}
          {abaAtiva === 'linha_do_tempo' && (
            <div className="bg-surface-container-lowest rounded-3xl border border-surface-variant p-5 md:p-8">
              <div className="flex items-center justify-between gap-4 mb-6 select-none">
                <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">timeline</span>
                  Evolução Clínica do Cidadão no SUS
                </h3>
                <button
                  type="button"
                  onClick={abrirModalNovoAtendimento}
                  className="h-10 px-4 md:h-12 md:px-6 bg-primary text-white font-bold rounded-xl md:rounded-2xl shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Registrar Evolução
                </button>
              </div>

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
                        <div className="flex items-start justify-between gap-4 mb-2 select-none">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className="text-xs font-extrabold text-primary uppercase tracking-wider">
                                {formatarDataBR(at.data_atendimento)}
                              </span>
                              {at.tipo_unidade && (
                                <span className="text-[10px] px-2.5 py-0.5 bg-surface-container-high rounded-full font-extrabold text-on-surface-variant uppercase tracking-wider border border-outline-variant">
                                  {TIPO_UNIDADE_LABEL[at.tipo_unidade] || at.tipo_unidade}
                                </span>
                              )}
                            </div>
                            <h4 className="font-black text-on-background text-base">{at.unidade}</h4>
                          </div>

                          {/* Ações da evolução clínica */}
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => abrirModalEditarAtendimento(at)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-high border border-transparent hover:border-surface-variant/40 transition-all text-on-surface-variant"
                              title="Editar evolução"
                            >
                              <span className="material-symbols-outlined text-[17px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletarAtendimento(at.id)}
                              disabled={deletandoAtendimento === at.id}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-600 border border-transparent hover:border-red-200 disabled:opacity-50 transition-all"
                              title="Remover evolução"
                            >
                              <span className="material-symbols-outlined text-[17px]">
                                {deletandoAtendimento === at.id ? 'hourglass_empty' : 'delete'}
                              </span>
                            </button>
                          </div>
                        </div>
                        
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

                        {at.registrado_por_nome && (
                          <p className="text-[10px] text-on-surface-variant/80 font-bold uppercase tracking-wider mt-4 pt-3 border-t border-surface-variant/50 select-none">
                            Registrado por: {at.registrado_por_nome}
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

      {/* ── Modal: Registrar / Editar Evolução Clínica (Atendimento) ── */}
      {modalAtendimentoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalAtendimentoAberto(false)} />
          <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-extrabold">
                {atendimentoEditando ? 'Editar Evolução Clínica' : 'Registrar Evolução Clínica'}
              </h3>
              <button onClick={() => setModalAtendimentoAberto(false)}
                className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <form onSubmit={handleSalvarAtendimento} className="p-6 md:p-8 space-y-4 overflow-y-auto">
              {/* Linha 1: Data + Tipo de Unidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Data do atendimento*</label>
                  <input required type="date"
                    value={formAtendimento.data_atendimento}
                    onChange={e => setFormAtendimento(p => ({ ...p, data_atendimento: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Tipo de unidade</label>
                  <select
                    value={formAtendimento.tipo_unidade}
                    onChange={e => setFormAtendimento(p => ({ ...p, tipo_unidade: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                    <option value="">Selecione...</option>
                    <option value="ubs">UBS</option>
                    <option value="ame">AME</option>
                    <option value="caps">CAPS</option>
                    <option value="upa">UPA</option>
                    <option value="centro_especialidades">Centro de Especialidades</option>
                    <option value="hospital">Hospital</option>
                    <option value="pronto_socorro">Pronto-Socorro</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>

              {/* Unidade (nome livre) */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Nome da unidade*</label>
                <input required
                  placeholder="Ex: UBS Vila Industrial, UPA Norte, AME Zona Leste"
                  value={formAtendimento.unidade}
                  onChange={e => setFormAtendimento(p => ({ ...p, unidade: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
              </div>

              {/* Especialidade + Profissional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Especialidade</label>
                  <input
                    placeholder="Ex: Cardiologia, Ortopedia"
                    value={formAtendimento.especialidade}
                    onChange={e => setFormAtendimento(p => ({ ...p, especialidade: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Profissional</label>
                  <input
                    placeholder="Ex: Dr(a). Nome do médico"
                    value={formAtendimento.profissional}
                    onChange={e => setFormAtendimento(p => ({ ...p, profesional: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
              </div>

              {/* CID-10 principal + secundário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">CID-10 Principal</label>
                  <input
                    maxLength={10}
                    placeholder="Ex: I10, E11, J45.0"
                    value={formAtendimento.cid_10_principal}
                    onChange={e => setFormAtendimento(p => ({ ...p, cid_10_principal: e.target.value.toUpperCase() }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">CID-10 Secundário</label>
                  <input
                    maxLength={10}
                    placeholder="Ex: Z87.0"
                    value={formAtendimento.cid_10_secundario}
                    onChange={e => setFormAtendimento(p => ({ ...p, cid_10_secundario: e.target.value.toUpperCase() }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
              </div>

              {/* Conduta */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Conduta Clínica</label>
                <textarea rows={3}
                  placeholder="O que foi prescrito, encaminhado ou decidido neste atendimento"
                  value={formAtendimento.conduta}
                  onChange={e => setFormAtendimento(p => ({ ...p, conduta: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Observações</label>
                <textarea rows={2}
                  placeholder="Notas adicionais sobre o atendimento"
                  value={formAtendimento.observacoes}
                  onChange={e => setFormAtendimento(p => ({ ...p, observacoes: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAtendimentoAberto(false)}
                  className="flex-1 h-12 rounded-2xl border border-outline font-bold">
                  Cancelar
                </button>
                <button type="submit" disabled={enviandoAtendimento}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">
                  {enviandoAtendimento ? 'Salvando...' : (atendimentoEditando ? 'Salvar Alterações' : 'Registrar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Parâmetros Clínicos (Anamnese) ── */}
      {modalDadosAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalDadosAberto(false)} />
          <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-extrabold">Editar Parâmetros Clínicos</h3>
              <button onClick={() => setModalDadosAberto(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleSalvarDados} className="p-6 md:p-8 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-on-surface-variant">Tipo Sanguíneo</span>
                  <select value={formDados.tipo_sanguineo}
                    onChange={e => setFormDados(p => ({ ...p, tipo_sanguineo: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                    <option value="">Não informado</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-on-surface-variant">Peso (kg)</span>
                  <input type="number" step="0.1" min="1" max="300"
                    placeholder="Ex: 72.5"
                    value={formDados.peso_kg}
                    onChange={e => setFormDados(p => ({ ...p, peso_kg: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-on-surface-variant">Altura (cm)</span>
                  <input type="number" min="50" max="250"
                    placeholder="Ex: 175"
                    value={formDados.altura_cm}
                    onChange={e => setFormDados(p => ({ ...p, altura_cm: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </label>
              </div>

              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-on-surface-variant">Alergias</span>
                  <textarea rows={2}
                    placeholder="Ex: Penicilina, Dipirona, látex"
                    value={formDados.alergias}
                    onChange={e => setFormDados(p => ({ ...p, alergias: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-on-surface-variant">Comorbidades</span>
                  <textarea rows={2}
                    placeholder="Ex: Diabetes tipo 2, Hipertensão arterial"
                    value={formDados.comorbidades}
                    onChange={e => setFormDados(p => ({ ...p, comorbidades: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-on-surface-variant">Medicamentos de uso contínuo</span>
                  <textarea rows={2}
                    placeholder="Ex: Metformina 500mg 2x/dia, Losartana 50mg"
                    value={formDados.medicamentos_uso_continuo}
                    onChange={e => setFormDados(p => ({ ...p, medicamentos_uso_continuo: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-on-surface-variant">Observações Clínicas</span>
                  <textarea rows={3}
                    placeholder="Anotações sobre a saúde geral do paciente"
                    value={formDados.observacoes_clinicas}
                    onChange={e => setFormDados(p => ({ ...p, observacoes_clinicas: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalDadosAberto(false)} className="h-12 px-5 rounded-2xl border border-outline font-bold">Cancelar</button>
                <button type="submit" disabled={salvandoDados} className="h-12 px-6 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">
                  {salvandoDados ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Lançar Laudo / Atualizar Status de Solicitação ── */}
      {modalStatusAberto && solicitacaoSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalStatusAberto(false)} />
          <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden z-10">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center">
              <h3 className="text-xl font-extrabold">Lançar Laudo e Status</h3>
              <button onClick={() => setModalStatusAberto(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleAtualizarStatus} className="p-6 md:p-8 space-y-5">
              <p className="text-sm text-on-surface-variant font-medium">
                Solicitação: <span className="text-on-surface font-bold">{solicitacaoSelecionada.descricao_paciente}</span>
              </p>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Atualizar status*</label>
                <select required value={formStatus.status_novo} onChange={e => setFormStatus(p => ({ ...p, status_novo: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                  {STATUS_VALIDOS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Observação do Status (opcional)</label>
                <textarea rows={2} placeholder="Ex: Resultado homologado pelo médico..." value={formStatus.observacao}
                  onChange={e => setFormStatus(p => ({ ...p, observacao: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Resultado Clínico / Laudo*</label>
                <textarea required rows={4} placeholder="Digite o laudo detalhado do exame..." value={formStatus.resultado}
                  onChange={e => setFormStatus(p => ({ ...p, resultado: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Código CID-10 Diagnosticado (opcional)</label>
                <input type="text" maxLength={10} placeholder="Ex: E11.9, J45" value={formStatus.cid_10}
                  onChange={e => setFormStatus(p => ({ ...p, cid_10: e.target.value.toUpperCase() }))}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalStatusAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline font-bold">Cancelar</button>
                <button type="submit" disabled={enviandoStatus} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">
                  {enviandoStatus ? 'Salvando...' : 'Confirmar e Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Nova Solicitação Clínica / Encaminhamento Externo ── */}
      {modalSolicitacaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalSolicitacaoAberto(false)} />
          <div className="relative w-full max-w-3xl bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center flex-shrink-0 select-none">
              <h3 className="text-xl font-extrabold">Nova Solicitação Clínica / Encaminhamento</h3>
              <button onClick={() => setModalSolicitacaoAberto(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleSalvarSolicitacao} className="p-6 md:p-8 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Tipo de Solicitação*</label>
                  <select required value={formSolicitacao.tipo} onChange={e => setFormSolicitacao(p => ({ ...p, tipo: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                    <option value="exame">Exame</option>
                    <option value="consulta">Consulta Especializada</option>
                    <option value="procedimento">Procedimento</option>
                    <option value="cirurgia">Cirurgia</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Grau de Prioridade</label>
                  <select value={formSolicitacao.prioridade} onChange={e => setFormSolicitacao(p => ({ ...p, prioridade: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                    <option value="rotina">Rotina (Baixa)</option>
                    <option value="prioritario">Prioritário (Média)</option>
                    <option value="urgente">Urgente (Alta)</option>
                  </select>
                </div>
              </div>

              {/* Combobox com autocomplete do catálogo de procedimentos */}
              <div className="space-y-2 relative">
                <label className="text-sm font-bold text-on-surface-variant">
                  Procedimento / Especialidade (Busca no Catálogo)*
                </label>
                <input
                  required
                  placeholder="Ex: Hemograma completo, Ortopedia, Tomografia... busque ou escreva"
                  value={buscaCatalogo}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setBuscaCatalogo(val);
                    setFormSolicitacao(p => ({ ...p, descricao_interna: val, catalogo_id: null }));
                    if (val.length >= 2) {
                      try {
                        const { data } = await api.get(`/gestor/catalogo-procedimentos?q=${encodeURIComponent(val)}`);
                        setCatalogoSugestoes(data);
                        setMostrarSugestoes(true);
                      } catch { setCatalogoSugestoes([]); }
                    } else {
                      setMostrarSugestoes(false);
                    }
                  }}
                  onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
                  onFocus={() => { if (catalogoSugestoes.length > 0) setMostrarSugestoes(true); }}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium"
                />
                {/* Dropdown de sugestões */}
                {mostrarSugestoes && catalogoSugestoes.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 bg-surface-container-lowest border border-surface-variant rounded-xl shadow-lg max-h-48 overflow-y-auto mt-1">
                    {catalogoSugestoes.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={() => {
                          setBuscaCatalogo(item.nome);
                          setFormSolicitacao(p => ({
                            ...p,
                            descricao_interna: item.nome,
                            catalogo_id: item.id,
                          }));
                          setMostrarSugestoes(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-surface-container-low text-sm border-b border-surface-variant last:border-0 font-semibold"
                      >
                        <span className="font-bold text-on-background">{item.nome}</span>
                        {item.especialidade && (
                          <span className="text-xs text-on-surface-variant ml-2">— {item.especialidade}</span>
                        )}
                        {item.tipo_unidade && (
                          <span className="text-xs font-bold text-primary ml-2 bg-primary/10 px-1.5 py-0.5 rounded uppercase">
                            {item.tipo_unidade}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Explicação Simplificada para o Paciente*</label>
                <input required placeholder="Ex: Retorno clínico ou orientações do exame em linguagem simples" value={formSolicitacao.descricao_paciente}
                  onChange={e => setFormSolicitacao(p => ({ ...p, descricao_paciente: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Data Prevista (Opcional)</label>
                  <input type="date" value={formSolicitacao.data_prevista} onChange={e => setFormSolicitacao(p => ({ ...p, data_prevista: e.target.value }))}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>

                {/* Local de atendimento / Unidade Externa */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">
                    Unidade Destino (Encaminhamento CROSS/Externo)
                  </label>
                  <select
                    value={formSolicitacao.unidade_externa_id ?? ''}
                    onChange={e => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      const unidade = unidadesExternas.find(u => u.id === val);
                      setFormSolicitacao(p => ({
                        ...p,
                        unidade_externa_id: val,
                        local_executor: unidade ? unidade.nome : '',
                      }));
                    }}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium"
                  >
                    <option value="">Na própria UBS (Interno)</option>
                    {unidadesExternas.map(u => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <p className="text-xs text-on-surface-variant italic">
                Nota: Se uma Unidade Destino externa for selecionada, o sistema realizará automaticamente o encaminhamento regulado (CROSS) para a fila da regulação externa.
              </p>

              <div className="flex gap-3 pt-2 select-none">
                <button type="button" onClick={() => setModalSolicitacaoAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline font-bold">Cancelar</button>
                <button type="submit" disabled={enviandoSolicitacao} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">
                  {enviandoSolicitacao ? 'Criando Solicitação...' : 'Confirmar e Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </GestorLayout>
      </div>

      {/* BLOCO DE IMPRESSÃO (Oculto na tela, visível apenas no papel) */}
      {pacienteAtivo && (
        <div className="hidden print:block w-full max-w-3xl mx-auto p-10 bg-white text-black font-sans">
          <div className="flex flex-col items-center justify-center border-b-2 border-black pb-6 mb-8 text-center">
            <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center mb-3">
               <span className="font-serif font-bold text-xl">SUS</span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-widest">Secretaria de Saúde</h1>
            <h2 className="text-lg font-bold">Prefeitura Municipal de São José dos Campos</h2>
            <p className="text-sm font-semibold mt-1">Unidade Básica de Saúde — {pacienteAtivo.ubs_nome || 'UBS+'}</p>
          </div>
          <div className="mb-10 text-right text-sm font-semibold">
            Data: {new Date().toLocaleDateString('pt-BR')}
          </div>
          <div className="mb-8 border border-gray-400 p-4 rounded-xl">
            <p className="text-sm uppercase tracking-wide font-bold text-gray-500 mb-1">Paciente</p>
            <p className="text-xl font-bold">{pacienteAtivo.nome}</p>
            <p className="text-sm mt-1">CRA: {pacienteAtivo.cra}</p>
          </div>
          <div className="min-h-[400px] border border-gray-400 p-4 rounded-xl">
            <p className="text-sm uppercase tracking-wide font-bold text-gray-500 mb-4 border-b border-gray-300 pb-2">Prescrição / Atestado</p>
          </div>
          <div className="mt-20 pt-8 flex flex-col items-center border-t border-gray-400 w-64 mx-auto">
            <p className="font-bold text-sm">Assinatura e Carimbo Médico</p>
            <p className="text-xs text-gray-500 mt-1">{user?.nome || 'Médico Responsável'}</p>
          </div>
          <div className="mt-8 text-center text-xs text-gray-400 italic">
            * Este documento é um Rascunho para Impressão e não possui assinatura digital ICP-Brasil. O preenchimento e carimbo físico são obrigatórios para validade legal.
          </div>
        </div>
      )}
    </>
  );
}
