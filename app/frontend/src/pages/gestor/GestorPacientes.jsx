// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA: GestorPacientes.jsx
// FUNÇÃO: Lista, busca, pagina e gerencia o cadastro de pacientes da UBS.
//         Fornece uma aba integrada para aprovação de novos auto-cadastros
//         realizados no portal público, validando-os de forma presencial.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import GestorLayout from '../../components/gestor/GestorLayout';
import { formatarDataBR } from '../../utils/statusHelper';

export default function GestorPacientes() {
  const navigate = useNavigate();

  // Aba ativa: 'ativos' (cadastros homologados) ou 'pendentes' (auto-cadastros recentes de 7 dias)
  const [aba, setAba] = useState('ativos');

  const [pacientes, setPacientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Estados de controle da aba de Novos Pacientes (Cadastros pendentes)
  const [pendentes, setPendentes] = useState([]);
  const [loadingPendentes, setLoadingPendentes] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmandoRejeicao, setConfirmandoRejeicao] = useState(null); // { id, nome }
  const [confirmacaoAprovacao, setConfirmacaoAprovacao] = useState(null); // { id, nome }
  const [enviando, setEnviando] = useState(false);
  const [erroCRA, setErroCRA] = useState('');
  
  // Dados do formulário de cadastro manual
  const [formData, setFormData] = useState({
    nome: '', cra: '', data_nascimento: '', cpf: '', telefone: '', email: ''
  });

  // Gatilho de recarga baseado na busca, página e aba atual.
  // LGPD E SEGURANÇA: Se o campo de busca estiver limpo, não fazemos requisição para pacientes ativos,
  // limpando a lista local imediatamente para preservar o sigilo dos dados.
  useEffect(() => {
    if (aba === 'ativos') {
      if (!busca || busca.trim() === '') {
        setPacientes([]);
        setLoading(false);
        return;
      }
      // Debounce de 400ms para evitar chamadas de API desnecessárias enquanto o usuário digita
      const timer = setTimeout(() => fetchPacientes(), 400);
      return () => clearTimeout(timer);
    } else {
      fetchPendentes();
    }
  }, [busca, paginaAtual, aba]);

  // Carrega contagem de pendências no mount para alimentar badges visuais globais
  useEffect(() => {
    fetchPendentes();
  }, []);

  const fetchPendentes = async () => {
    setLoadingPendentes(true);
    try {
      const res = await api.get('/gestor/pacientes/pendentes');
      setPendentes(res.data);
    } catch {
      toast.error('Erro ao carregar novos pacientes.');
    } finally {
      setLoadingPendentes(false);
    }
  };

  const handleAtivar = async (id, nome) => {
    try {
      await api.patch(`/gestor/paciente/${id}/ativar`);
      toast.success(`Cadastro de ${nome} homologado com sucesso!`);
      fetchPendentes();
    } catch {
      toast.error('Erro ao ativar cadastro do paciente.');
    }
  };

  const handleRejeitar = (id, nome) => {
    setConfirmandoRejeicao({ id, nome });
  };

  const handleRejeitarConfirmado = async () => {
    if (!confirmandoRejeicao) return;
    const { id, nome } = confirmandoRejeicao;
    setConfirmandoRejeicao(null);
    try {
      await api.delete(`/gestor/paciente/${id}/rejeitar`);
      toast.success(`Cadastro de ${nome} rejeitado e excluído.`);
      fetchPendentes();
    } catch {
      toast.error('Erro ao rejeitar cadastro.');
    }
  };

  const fetchPacientes = async () => {
    try {
      setLoading(true);
      setErro('');
      const params = new URLSearchParams({
        busca,
        pagina: String(paginaAtual),
        limite: '20',
      });
      const res = await api.get(`/gestor/pacientes?${params.toString()}`);
      setPacientes(res.data);
    } catch {
      setErro('Não foi possível carregar a lista de pacientes ativos.');
    } finally {
      setLoading(false);
    }
  };

  // Máscara de digitação automática de data (DD/MM/AAAA)
  const aplicarMascaraData = (value) => {
    let v = value.replace(/\D/g, '');
    if (v.length > 8) v = v.substring(0, 8);
    if (v.length > 4) {
      v = `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4)}`;
    } else if (v.length > 2) {
      v = `${v.substring(0, 2)}/${v.substring(2)}`;
    }
    return v;
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'data_nascimento') {
      value = aplicarMascaraData(value);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'cra') setErroCRA('');
  };

  const handleSalvarPaciente = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErroCRA('');

    if (formData.data_nascimento.length !== 10) {
      toast.error('Informe a data de nascimento completa no formato DD/MM/AAAA.');
      setEnviando(false);
      return;
    }

    try {
      const [dia, mes, ano] = formData.data_nascimento.split('/');
      const dataNascimentoISO = `${ano}-${mes}-${dia}`;

      await api.post('/gestor/paciente', {
        ...formData,
        data_nascimento: dataNascimentoISO
      });
      toast.success('Paciente cadastrado com sucesso!');
      setModalAberto(false);
      setFormData({ nome: '', cra: '', data_nascimento: '', cpf: '', telefone: '', email: '' });
      fetchPacientes();
    } catch (err) {
      if (err.response?.status === 409) {
        setErroCRA('Este CRA já está vinculado a outro paciente.');
        toast.error('CRA duplicado no sistema.');
      } else {
        toast.error('Erro ao registrar novo paciente.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <GestorLayout>
      {/* ── Modal de Confirmação: APROVAÇÃO ── */}
      {confirmacaoAprovacao && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-surface rounded-[2rem] p-6 w-full max-w-sm shadow-xl border border-surface-variant/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-emerald-600">verified_user</span>
              </div>
              <h3 className="font-extrabold text-on-background text-lg">Homologar cadastro?</h3>
            </div>
            <p className="text-on-surface-variant text-sm mb-5">
              Confirmar a aprovação do paciente <strong>{confirmacaoAprovacao.nome}</strong>? O acesso ao prontuário e agendamentos será liberado imediatamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmacaoAprovacao(null)}
                className="flex-1 h-11 rounded-2xl border border-outline-variant text-on-surface font-bold text-xs hover:bg-surface-container-low transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleAtivar(confirmacaoAprovacao.id, confirmacaoAprovacao.nome);
                  setConfirmacaoAprovacao(null);
                }}
                className="flex-1 h-11 rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Confirmação: REJEIÇÃO ── */}
      {confirmandoRejeicao && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface rounded-[2rem] p-6 max-w-sm w-full shadow-2xl border border-surface-variant/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-red-600">delete_forever</span>
              </div>
              <h3 className="font-extrabold text-on-background text-lg">Rejeitar cadastro?</h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-2">
              Você está prestes a rejeitar e excluir o cadastro de:
            </p>
            <p className="font-bold text-on-background mb-4">{confirmandoRejeicao.nome}</p>
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-6">
              Esta ação é definitiva e removerá a solicitação do sistema permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmandoRejeicao(null)}
                className="flex-1 h-11 px-4 border border-outline-variant text-on-surface font-bold rounded-2xl hover:bg-surface-container-low transition-colors text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejeitarConfirmado}
                className="flex-1 h-11 px-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors text-xs shadow-md"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cabeçalho Principal ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">Pacientes</h1>
          <p className="text-on-surface-variant font-semibold mt-1 text-sm">Gerencie os prontuários e acompanhe a fila de auto-cadastros.</p>
        </div>
        
        <button
          onClick={() => setModalAberto(true)}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined">person_add</span>
          Cadastrar Paciente
        </button>
      </div>

      {/* ── Abas de Navegação Premium (Pílula Deslizante) ── */}
      <div className="flex bg-surface-container-high/50 backdrop-blur-md p-1 rounded-xl max-w-sm md:max-w-md mb-6 border border-surface-variant/30 select-none">
        <button
          type="button"
          onClick={() => setAba('ativos')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs md:text-sm transition-all duration-200 ${
            aba === 'ativos'
              ? 'bg-white text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Pacientes Ativos
        </button>
        <button
          type="button"
          onClick={() => setAba('pendentes')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs md:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            aba === 'pendentes'
              ? 'bg-white text-amber-800 shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Novos Pacientes
          {pendentes.length > 0 && (
            <span className="bg-red-500 text-white text-[9px] md:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
              {pendentes.length}
            </span>
          )}
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ABA: NOVOS PACIENTES (Pai da Triagem Pública)
          ════════════════════════════════════════════════════════════════ */}
      {aba === 'pendentes' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
          {loadingPendentes ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-surface-container-low rounded-2xl animate-pulse" />
            ))
          ) : pendentes.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-surface-container-lowest rounded-3xl border border-surface-variant">
              <span className="material-symbols-outlined text-5xl block mb-3 opacity-30">how_to_reg</span>
              <p className="text-on-surface-variant font-bold">Nenhum novo paciente aguardando homologação.</p>
              <p className="text-xs text-on-surface-variant/70 mt-1">Quando um munícipe de SJC se cadastrar pelo portal público, o registro aparecerá aqui.</p>
            </div>
          ) : (
            pendentes.map(p => (
              <div key={p.id} className="bg-surface-container-lowest rounded-2xl border border-surface-variant hover:border-amber-500/30 p-4 md:p-5 flex flex-wrap items-center gap-4 transition-all duration-300 shadow-sm hover:shadow-md">
                {/* Ícone contextualizado com pulsação suave */}
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  <span className="material-symbols-outlined text-amber-750 text-xl">pending_actions</span>
                </div>

                {/* Dados da solicitação de cadastro */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-on-background text-sm md:text-base">{p.nome}</p>
                    {p.ubs_nome && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-800 border border-blue-500/20 shadow-sm">
                        <span className="material-symbols-outlined text-[11px]">local_hospital</span>
                        {p.ubs_nome}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs text-on-surface-variant font-semibold">
                      CRA: <strong className="text-on-surface">{p.cra}</strong>
                    </span>
                    <span className="text-xs text-on-surface-variant font-semibold">
                      Nasc.: {formatarDataBR(p.data_nascimento)}
                    </span>
                    {p.telefone && (
                      <span className="text-xs text-on-surface-variant font-semibold">{p.telefone}</span>
                    )}
                    <span className="text-xs text-on-surface-variant/70 font-semibold italic">
                      Cadastrado em {new Date(p.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Ações de aprovação / rejeição refinadas com chips translúcidos */}
                <div className="flex gap-2 flex-shrink-0 ml-auto sm:ml-0">
                  <button
                    onClick={() => handleRejeitar(p.id, p.nome)}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-700 border border-red-500/20 font-bold rounded-xl text-xs transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                    Rejeitar
                  </button>
                  <button
                    onClick={() => setConfirmacaoAprovacao({ id: p.id, nome: p.nome })}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border border-emerald-500/20 font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[15px]">check</span>
                    Aprovar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          ABA: PACIENTES ATIVOS (Membro Homologado do SUS)
          ════════════════════════════════════════════════════════════════ */}
      {aba === 'ativos' && (<>
        {/* Barra de busca integrada */}
        <div className="relative mb-6 max-w-2xl group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nome ou CRA..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPaginaAtual(1);
            }}
            className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-surface-variant/60 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-semibold text-sm shadow-sm"
          />
        </div>

        {/* Tabela Principal */}
        {erro && !loading ? (
          <div className="bg-surface-container-lowest rounded-3xl border border-red-200 p-8 text-center">
            <p className="font-bold text-on-background">{erro}</p>
            <button onClick={fetchPacientes} className="mt-4 h-12 px-6 bg-primary text-white font-bold rounded-2xl shadow-sm">Tentar novamente</button>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-3xl border border-surface-variant shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left relative">
                <thead className="sticky top-0 z-10 bg-surface-container-low/90 border-b border-surface-variant shadow-sm backdrop-blur-md">
                  <tr>
                    <th className="p-4 md:p-5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nome / Contato</th>
                    <th className="p-4 md:p-5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">CRA</th>
                    <th className="p-4 md:p-5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">UBS Origem</th>
                    <th className="p-4 md:p-5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Telefone</th>
                    <th className="p-4 md:p-5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nascimento</th>
                    <th className="p-4 md:p-5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Solicitações</th>
                    <th className="p-4 md:p-5 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="7" className="p-5">
                          <div className="h-5 bg-surface-container-high rounded w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : (!busca || busca.trim() === '') ? (
                    <tr>
                      <td colSpan="7" className="p-16 text-center text-on-surface-variant/80">
                        <div className="flex flex-col items-center justify-center gap-3.5 max-w-md mx-auto">
                          <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center border border-outline-variant/60 shadow-sm">
                            <span className="material-symbols-outlined text-primary text-2xl">search</span>
                          </div>
                          <div className="space-y-1">
                            <p className="font-extrabold text-on-background text-sm">Consulta de Prontuário</p>
                            <p className="text-xs font-semibold leading-relaxed opacity-85">
                              Por razões de privacidade e segurança (LGPD), a listagem em massa de pacientes ativos não é exibida por padrão. Utilize a barra de pesquisa acima informando o nome ou o CRA do paciente para localizar seu registro.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : pacientes.length > 0 ? (
                    pacientes.map(p => (
                      <tr key={p.id} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="p-4 md:p-5">
                          <div className="font-bold text-on-background">{p.nome}</div>
                          <div className="text-xs text-on-surface-variant font-semibold mt-0.5">{p.email || 'Sem e-mail'}</div>
                        </td>
                        <td className="p-4 md:p-5">
                          <span className="bg-surface-container-high px-2 py-1 rounded-lg text-xs font-bold text-on-surface-variant border border-outline-variant select-all">
                            {p.cra}
                          </span>
                        </td>
                        <td className="p-4 md:p-5">
                          {p.ubs_nome ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                              <span className="material-symbols-outlined text-[11px]">local_hospital</span>
                              {p.ubs_nome}
                            </span>
                          ) : (
                            <span className="text-xs text-on-surface-variant">---</span>
                          )}
                        </td>
                        <td className="p-4 md:p-5 font-semibold text-on-surface-variant text-sm">{p.telefone || '---'}</td>
                        <td className="p-4 md:p-5 font-semibold text-on-surface-variant text-sm">
                          {formatarDataBR(p.data_nascimento)}
                        </td>
                        <td className="p-4 md:p-5">
                          {/* Badge de solicitações ativa de alta definição */}
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            p.tem_urgente
                              ? 'bg-red-500/10 text-red-800 border-red-500/25 animate-pulse'
                              : Number(p.solicitacoes_ativas) > 0
                                ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/25'
                                : 'bg-surface-container-high text-on-surface-variant border-surface-variant'
                          }`}>
                            {p.tem_urgente && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                            {Number(p.solicitacoes_ativas) || 0} ativas
                          </span>
                        </td>
                        <td className="p-4 md:p-5 text-right">
                          <button
                            onClick={() => navigate(`/gestor/paciente/${p.id}`)}
                            className="px-3.5 py-2 bg-surface-container-high hover:bg-primary text-on-surface hover:text-white font-bold rounded-xl transition-all border border-surface-variant/60 hover:border-primary text-xs flex items-center justify-center gap-1 ml-auto shadow-sm hover:shadow-md"
                          >
                            Ver Ficha
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-16 text-center text-on-surface-variant font-semibold">
                        Nenhum paciente localizado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Paginação */}
            <div className="p-4 md:p-5 border-t border-surface-variant flex items-center justify-between gap-3 select-none">
              <button
                onClick={() => setPaginaAtual((pagina) => Math.max(1, pagina - 1))}
                disabled={paginaAtual === 1 || loading}
                className="h-10 px-5 rounded-xl border border-outline-variant font-bold text-xs disabled:opacity-40 hover:bg-surface-container-low transition-colors"
              >
                Anterior
              </button>
              <span className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Página {paginaAtual}</span>
              <button
                onClick={() => setPaginaAtual((pagina) => pagina + 1)}
                disabled={pacientes.length < 20 || loading}
                className="h-10 px-5 rounded-xl bg-primary text-white font-bold text-xs disabled:opacity-40 hover:shadow-md transition-all active:scale-95"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </>)}

      {/* ── Modal de Cadastro Manual de Pacientes ── */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalAberto(false)}></div>
          <div className="relative w-full max-w-3xl bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden border border-surface-variant/55 transition-all animate-scale-up">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-on-background">Registrar Novo Paciente</h3>
              <button onClick={() => setModalAberto(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleSalvarPaciente} className="p-6 md:p-8 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Nome Completo*</label>
                <input required name="nome" value={formData.nome} onChange={handleInputChange} type="text" placeholder="Ex: João Silva Santos"
                  className="w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-semibold text-sm transition-all" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">CRA*</label>
                  <input required name="cra" value={formData.cra} onChange={handleInputChange} type="text" placeholder="Ex: 00123456"
                    className={`w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl outline-none font-semibold text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all ${
                      erroCRA ? 'ring-4 ring-red-400/10 border-red-500' : ''
                    }`} />
                  {erroCRA && <p className="text-xs text-red-650 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">error</span>
                    {erroCRA}
                  </p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Data de Nascimento*</label>
                  <input
                    required
                    name="data_nascimento"
                    value={formData.data_nascimento}
                    onChange={handleInputChange}
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Ex: 25/10/1995"
                    className="w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl outline-none font-semibold text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">CPF (opcional)</label>
                  <input name="cpf" value={formData.cpf} onChange={handleInputChange} type="text" placeholder="000.000.000-00"
                    className="w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl outline-none font-semibold text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">Telefone (opcional)</label>
                  <input name="telefone" value={formData.telefone} onChange={handleInputChange} type="text" placeholder="(12) 99999-9999"
                    className="w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl outline-none font-semibold text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">E-mail (opcional)</label>
                <input name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="exemplo@email.com"
                  className="w-full h-12 px-4 bg-surface-container-high/60 border border-surface-variant/40 rounded-xl outline-none font-semibold text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" />
              </div>
              <div className="flex gap-3 pt-4 select-none">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline-variant text-on-surface font-bold hover:bg-surface-container-low transition-colors text-sm">Cancelar</button>
                <button type="submit" disabled={enviando} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50 hover:shadow-md transition-all active:scale-95 text-sm">
                  {enviando ? 'Salvando...' : 'Registrar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GestorLayout>
  );
}
