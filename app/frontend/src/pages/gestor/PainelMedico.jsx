/**
 * PÁGINA: PainelMedico.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Painel de consulta clínica exclusivo para médicos. Permite buscar
 *         qualquer paciente pelo CRA ou nome, visualizar prontuário e histórico
 *         de solicitações em modo somente leitura (read-only), sem permissão
 *         de edição ou alteração de status.
 * API: GET /api/gestor/pacientes?busca={cra}   → busca por nome ou CRA
 *      GET /api/gestor/paciente/:id             → prontuário completo
 *      GET /api/gestor/solicitacao/:id/historico → histórico de status por solicitação
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
// formatarDataBR: corrige bug de fuso horário em strings de data sem horário (UTC-3)
import { formatarDataBR } from '../../utils/statusHelper';
import GestorLayout from '../../components/gestor/GestorLayout';

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


// ─── Mapas de Status ──────────────────────────────────────────────────────────
// Cópia local para não criar dependência do statusHelper global — o Painel
// Médico é read-only e não precisa das funções de escrita do helper.

const STATUS_BADGE = {
  em_analise:           'bg-gray-100 text-gray-600',
  aguardando_regulacao: 'bg-amber-100 text-amber-700',
  autorizado:           'bg-blue-100 text-blue-700',
  data_marcada:         'bg-teal-100 text-teal-700',
  aguardando_resultado: 'bg-purple-100 text-purple-700',
  concluido:            'bg-emerald-100 text-emerald-700',
  cancelado:            'bg-red-100 text-red-600',
  urgente_escalado:     'bg-red-100 text-red-800',
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
// FUNÇÃO: Renderiza o card de uma solicitação no painel médico.
//         Exibe status, previsão e histórico expansível sem botões de modificação.
// PROPS:
//   - sol: object — dados da solicitação
//   - alternarHistorico: fn — abre/fecha o histórico de uma solicitação
//   - historicosAbertos: object — mapa de id→boolean controlando quais históricos estão abertos
//   - historicos: object — mapa de id→{itens, loading, erro} com os dados carregados
//   - carregarHistorico: fn — busca o histórico de uma solicitação na API
// ─────────────────────────────────────────────────────────────────────────────
function CardSolicitacaoMedico({ sol, alternarHistorico, historicosAbertos, historicos, carregarHistorico }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl md:rounded-2xl border border-surface-variant p-4 md:p-6">
      {/* Cabeçalho do card: tipo, status e urgência */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-bold text-on-background truncate">{sol.descricao_paciente}</h3>
            <span className="text-xs font-bold px-2 py-0.5 bg-surface-container-high rounded text-on-surface-variant flex-shrink-0">
              {sol.tipo}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${STATUS_BADGE[sol.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABEL[sol.status] || sol.status}
            </span>
            {/* Badge de urgência visível quando aplicável */}
            {sol.prioridade === 'urgente' && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Urgente
              </span>
            )}
          </div>
          {sol.data_prevista && (
            <p className="text-xs text-on-surface-variant">Previsão: {formatarDataBR(sol.data_prevista)}</p>
          )}
          {sol.observacao_paciente && (
            <p className="text-xs text-on-surface-variant italic mt-1">{sol.observacao_paciente}</p>
          )}
          {/* Resultado clínico — exibido em modo read-only quando presente */}
          {(sol.resultado || sol.cid_10) && (
            <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              {sol.cid_10 && (
                <p className="text-xs font-bold text-emerald-700">
                  CID-10: {sol.cid_10}
                </p>
              )}
              {sol.resultado && (
                <p className="text-xs text-emerald-800 font-medium">{sol.resultado}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Histórico da Solicitação — expansível sob demanda para não poluir a tela */}
      <div className="mt-4 pt-4 border-t border-surface-variant">
        <button
          onClick={() => alternarHistorico(sol.id)}
          className="flex items-center gap-2 text-sm font-bold text-primary"
          aria-expanded={Boolean(historicosAbertos[sol.id])}
        >
          <span className="material-symbols-outlined text-lg">
            {historicosAbertos[sol.id] ? 'expand_less' : 'history'}
          </span>
          {historicosAbertos[sol.id] ? 'Ocultar histórico' : 'Ver histórico'}
        </button>

        {historicosAbertos[sol.id] && (
          <div className="mt-4">
            {/* Estado de carregamento */}
            {historicos[sol.id]?.loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-14 bg-surface-container-high rounded-xl" />
                <div className="h-14 bg-surface-container-high rounded-xl" />
              </div>
            ) : historicos[sol.id]?.erro ? (
              /* Estado de erro com opção de retry */
              <div className="p-4 rounded-xl bg-red-50 text-red-700 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-bold">{historicos[sol.id].erro}</span>
                <button
                  onClick={() => carregarHistorico(sol.id, true)}
                  className="px-3 py-2 bg-white rounded-lg font-bold text-xs"
                >
                  Tentar novamente
                </button>
              </div>
            ) : historicos[sol.id]?.itens?.length > 0 ? (
              /* Lista cronológica de eventos de histórico */
              <ol className="space-y-3">
                {historicos[sol.id].itens.map((item) => (
                  <li key={item.id} className="p-4 rounded-xl bg-surface-container-low border border-surface-variant">
                    <p className="text-xs font-bold text-on-surface-variant">
                      {new Date(item.alterado_em).toLocaleString('pt-BR')}
                      {item.gestor_nome ? ` • ${item.gestor_nome}` : ''}
                    </p>
                    <p className="font-bold text-on-background mt-1">
                      De: {item.status_anterior ? (STATUS_LABEL[item.status_anterior] || item.status_anterior) : 'Início'}
                      {' → '}
                      Para: {STATUS_LABEL[item.status_novo] || item.status_novo}
                    </p>
                    {item.observacao && (
                      <p className="text-sm text-on-surface-variant mt-1">{item.observacao}</p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-on-surface-variant">Nenhum evento de histórico registrado.</p>
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
  // buscaRealizada: flag que distingue "usuário digitou mas não pesquisou" de
  // "pesquisa foi enviada e retornou 0 resultados". Sem ela, o estado "não
  // encontrado" apareceria enquanto o usuário ainda está digitando.
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  const [pacientesLista, setPacientesLista] = useState([]);
  const [pacienteAtivo, setPacienteAtivo] = useState(null);
  const [loadingPaciente, setLoadingPaciente] = useState(false);
  const [historicos, setHistoricos] = useState({});
  const [historicosAbertos, setHistoricosAbertos] = useState({});
  const [atendimentos, setAtendimentos] = useState([]);
  const [loadingAtendimentos, setLoadingAtendimentos] = useState(false);

  // Efetua a busca de pacientes por CRA ou nome na API
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
        // Exatamente um resultado: abre direto o prontuário sem etapa de seleção
        carregarPerfil(data[0].id);
      } else {
        // Múltiplos ou nenhum: guarda a lista para seleção ou exibe aviso
        setPacientesLista(data);
        setBuscaRealizada(true);
      }
    } catch (err) {
      console.error('[PainelMedico] Erro na busca:', err);
      toast.error('Erro ao realizar busca de pacientes. Tente novamente.');
      setBuscaRealizada(true);
    } finally {
      setBuscando(false);
    }
  };

  // Carrega o prontuário completo do paciente selecionado
  const carregarPerfil = async (id) => {
    setLoadingPaciente(true);
    setPacientesLista([]);
    setAtendimentos([]);
    try {
      const { data } = await api.get(`/gestor/paciente/${id}`);
      setPacienteAtivo(data);
      
      // Carrega atendimentos
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

  // Busca o histórico de status de uma solicitação sob demanda (lazy loading)
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

  // Alterna a visibilidade do histórico de uma solicitação.
  // Se abrindo pela primeira vez, dispara o carregamento da API.
  const alternarHistorico = (solicitacaoId) => {
    const vaiAbrir = !historicosAbertos[solicitacaoId];
    setHistoricosAbertos((prev) => ({ ...prev, [solicitacaoId]: vaiAbrir }));
    if (vaiAbrir && !historicos[solicitacaoId]) {
      carregarHistorico(solicitacaoId);
    }
  };

  // Separa solicitações ativas das encerradas para exibição em seções distintas
  const STATUS_ENCERRADO = ['concluido', 'cancelado'];
  const solicitacoesAtivas = (pacienteAtivo?.solicitacoes || []).filter(
    (s) => !STATUS_ENCERRADO.includes(s.status)
  );
  const solicitacoesEncerradas = (pacienteAtivo?.solicitacoes || []).filter(
    (s) => STATUS_ENCERRADO.includes(s.status)
  );

  return (
    <GestorLayout>
      {/* ─── Cabeçalho da página ─────────────────────────────────────────── */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">
          Painel Médico
        </h1>
        <p className="text-on-surface-variant font-medium text-sm mt-1">
          Busca e consulta de histórico clínico de pacientes. Visualização somente leitura.
        </p>
      </div>

      {/* ─── Barra de pesquisa ───────────────────────────────────────────── */}
      <form onSubmit={handleBusca} className="flex gap-3 max-w-xl mb-8">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Digite o CRA ou nome do paciente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-medium text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={buscando}
          className="h-12 px-6 bg-primary text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center flex-shrink-0 disabled:opacity-50"
        >
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* ─── Estado Inicial: nenhuma busca realizada ainda ───────────────── */}
      {!buscaRealizada && !buscando && !loadingPaciente && !pacienteAtivo && (
        <div className="py-20 text-center bg-surface-container-lowest rounded-2xl border border-surface-variant">
          <span className="material-symbols-outlined text-5xl block mb-3 opacity-30 text-on-surface-variant">
            stethoscope
          </span>
          <p className="text-on-surface-variant font-semibold">Informe o CRA para consultar o paciente.</p>
          <p className="text-xs text-on-surface-variant mt-1">
            Insira o número do prontuário ou nome para acessar o histórico clínico.
          </p>
        </div>
      )}

      {/* ─── Resultados múltiplos: lista para seleção ────────────────────── */}
      {buscaRealizada && !buscando && pacientesLista.length > 1 && (
        <div className="bg-surface-container-lowest rounded-3xl border border-surface-variant shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-surface-variant bg-surface-container-low">
            <h3 className="font-bold text-on-background text-sm">
              Selecione o Paciente ({pacientesLista.length} encontrados)
            </h3>
          </div>
          <div className="divide-y divide-surface-variant">
            {pacientesLista.map((p) => (
              <button
                key={p.id}
                onClick={() => carregarPerfil(p.id)}
                className="w-full text-left p-4 hover:bg-surface-container-low transition-colors flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-on-background">{p.nome}</div>
                  <div className="text-xs text-on-surface-variant mt-1">
                    Nascimento: {formatarDataBR(p.data_nascimento)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-surface-container-high px-2 py-1 rounded-lg text-xs font-bold text-on-surface-variant border border-outline-variant">
                    CRA: {p.cra}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant text-base">
                    chevron_right
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Estado Não Encontrado: busca realizada, 0 resultados ────────── */}
      {buscaRealizada && !buscando && pacientesLista.length === 0 && !pacienteAtivo && !loadingPaciente && (
        <div className="py-16 text-center bg-surface-container-lowest rounded-2xl border border-surface-variant">
          <span className="material-symbols-outlined text-5xl block mb-3 opacity-30 text-on-surface-variant">
            search_off
          </span>
          <p className="text-on-surface-variant font-semibold">
            Paciente não encontrado com a busca informada.
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Verifique se os dígitos do CRA estão corretos ou tente buscar pelo nome completo.
          </p>
        </div>
      )}

      {/* ─── Loading do prontuário ────────────────────────────────────────── */}
      {loadingPaciente && (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-surface-container-low rounded w-64" />
          <div className="h-40 bg-surface-container-low rounded-2xl" />
          <div className="h-28 bg-surface-container-low rounded-2xl" />
        </div>
      )}

      {/* ─── Prontuário Clínico (Read-Only) ──────────────────────────────── */}
      {!loadingPaciente && pacienteAtivo && (
        <div className="space-y-6">
          {/* Card de Dados Pessoais — sem botões de edição */}
          <div className="bg-surface-container-lowest rounded-2xl md:rounded-3xl border border-surface-variant p-5 md:p-8">
            <h2 className="text-lg font-extrabold text-on-background mb-5">Dados Pessoais do Paciente</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[
                { label: 'Nome Completo',  value: pacienteAtivo.nome },
                { label: 'CRA',            value: pacienteAtivo.cra },
                { label: 'Nascimento',     value: pacienteAtivo.data_nascimento ? formatarDataBR(pacienteAtivo.data_nascimento) : '—' },
                { label: 'Telefone',       value: pacienteAtivo.telefone || '—' },
                { label: 'E-mail',         value: pacienteAtivo.email || '—' },
                { label: 'UBS de Origem',  value: pacienteAtivo.ubs_nome || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
                  <p className="font-bold text-on-background text-sm md:text-base">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Dados Clínicos (read-only) ── */}
          {(pacienteAtivo?.tipo_sanguineo || pacienteAtivo?.alergias || pacienteAtivo?.comorbidades || pacienteAtivo?.medicamentos_uso_continuo) && (
            <div className="bg-surface-container-lowest rounded-xl md:rounded-2xl border border-surface-variant p-4 md:p-6 mb-4">
              <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider mb-4">
                Dados Clínicos
              </h3>

              {/* Vitais */}
              {(pacienteAtivo?.tipo_sanguineo || pacienteAtivo?.peso_kg || pacienteAtivo?.altura_cm) && (
                <div className="flex gap-4 flex-wrap mb-4">
                  {pacienteAtivo?.tipo_sanguineo && (
                    <div className="px-3 py-2 bg-surface-container-high rounded-xl">
                      <p className="text-xs font-bold text-on-surface-variant">Tipo Sanguíneo</p>
                      <p className="font-extrabold text-on-background text-lg">{pacienteAtivo.tipo_sanguineo}</p>
                    </div>
                  )}
                  {pacienteAtivo?.peso_kg && (
                    <div className="px-3 py-2 bg-surface-container-high rounded-xl">
                      <p className="text-xs font-bold text-on-surface-variant">Peso</p>
                      <p className="font-bold text-on-background">{pacienteAtivo.peso_kg} kg</p>
                    </div>
                  )}
                  {pacienteAtivo?.altura_cm && (
                    <div className="px-3 py-2 bg-surface-container-high rounded-xl">
                      <p className="text-xs font-bold text-on-surface-variant">Altura</p>
                      <p className="font-bold text-on-background">{pacienteAtivo.altura_cm} cm</p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {pacienteAtivo?.alergias && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-bold text-amber-700 mb-1">
                      ⚠ Alergias
                    </p>
                    <p className="text-sm text-amber-900 font-medium">{pacienteAtivo.alergias}</p>
                  </div>
                )}
                {pacienteAtivo?.comorbidades && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs font-bold text-red-700 mb-1">Comorbidades</p>
                    <p className="text-sm text-red-900 font-medium">{pacienteAtivo.comorbidades}</p>
                  </div>
                )}
                {pacienteAtivo?.medicamentos_uso_continuo && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs font-bold text-blue-700 mb-1">Medicamentos em uso</p>
                    <p className="text-sm text-blue-900 font-medium">{pacienteAtivo.medicamentos_uso_continuo}</p>
                  </div>
                )}
                {pacienteAtivo?.observacoes_clinicas && (
                  <div className="p-3 bg-surface-container-high rounded-xl">
                    <p className="text-xs font-bold text-on-surface-variant mb-1">Observações Clínicas</p>
                    <p className="text-sm text-on-background">{pacienteAtivo.observacoes_clinicas}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Solicitações Ativas */}
          <div>
            <h2 className="text-lg md:text-2xl font-extrabold text-on-background mb-4">
              Solicitações Ativas
            </h2>
            {solicitacoesAtivas.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
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
              <p className="text-center text-on-surface-variant py-6 text-sm bg-surface-container-lowest border border-dashed border-surface-variant rounded-2xl">
                Nenhuma solicitação ativa no momento.
              </p>
            )}
          </div>

          {/* Histórico de Solicitações Encerradas */}
          {solicitacoesEncerradas.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">history</span>
                Solicitações Encerradas ({solicitacoesEncerradas.length})
              </h3>
              <div className="space-y-3 md:space-y-4 opacity-80">
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

          {/* ── Linha do Tempo (read-only no Painel Médico) ── */}
          {(loadingAtendimentos || atendimentos.length > 0) && (
            <div className="mt-6">
              <h3 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">timeline</span>
                Linha do Tempo
              </h3>

              {loadingAtendimentos && (
                <div className="space-y-3 animate-pulse">
                  <div className="h-20 bg-surface-container-low rounded-xl" />
                  <div className="h-20 bg-surface-container-low rounded-xl" />
                </div>
              )}

              {!loadingAtendimentos && (
                <div className="space-y-3">
                  {atendimentos.map(at => (
                    <div key={at.id} className="bg-surface-container-lowest rounded-xl border border-surface-variant p-4">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-on-surface-variant">
                          {formatarDataBR(at.data_atendimento)}
                        </span>
                        {at.tipo_unidade && (
                          <span className="text-xs px-2 py-0.5 bg-surface-container-high rounded font-bold text-on-surface-variant">
                            {TIPO_UNIDADE_LABEL[at.tipo_unidade] || at.tipo_unidade}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-on-background">{at.unidade}</p>
                      {at.especialidade && (
                        <p className="text-sm text-on-surface-variant">
                          {at.especialidade}{at.profissional ? ` • Dr(a). ${at.profissional}` : ''}
                        </p>
                      )}
                      {(at.cid_10_principal || at.cid_10_secundario) && (
                        <div className="flex gap-2 mt-2">
                          {at.cid_10_principal && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">CID: {at.cid_10_principal}</span>}
                          {at.cid_10_secundario && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">CID 2°: {at.cid_10_secundario}</span>}
                        </div>
                      )}
                      {at.conduta && <p className="text-sm text-on-background mt-2">{at.conduta}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </GestorLayout>
  );
}
