// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: MedicamentosGestor
// FUNÇÃO: Gerenciamento do estoque de medicamentos da Unidade Básica de Saúde.
//         Permite o cadastro, edição, alternância rápida de disponibilidade
//         e acompanhamento estatístico do catálogo local.
// DESIGN: Visual de alta fidelidade com cards estatísticos HSL glassmorphic,
//         abas de pílula deslizantes, tabela com badges translúcidas e bolinhas
//         de status ativas, e modais orgânicos rounded-[2rem] com desfoque de fundo.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import GestorLayout from '../../components/gestor/GestorLayout';

// Estado inicial para novos cadastros
const FORM_INICIAL = {
  nome: '',
  principio_ativo: '',
  disponivel: true,
  observacao: '',
  instrucoes_retirada: '',
};

// Opções de filtros para a pílula deslizante corporativa
const FILTROS = [
  { label: 'Todos', value: 'todos' },
  { label: 'Disponíveis', value: 'disponiveis' },
  { label: 'Em falta', value: 'em_falta' },
];

export default function MedicamentosGestor() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [medicamentoEdicao, setMedicamentoEdicao] = useState(null);
  const [formCadastro, setFormCadastro] = useState(FORM_INICIAL);
  const [formEdicao, setFormEdicao] = useState({ disponivel: false, observacao: '', instrucoes_retirada: '' });
  const [salvando, setSalvando] = useState(false);

  // Carrega a listagem de medicamentos da UBS logada
  const load = async () => {
    setLoading(true);
    setErro('');
    try {
      const response = await api.get('/gestor/medicamentos');
      setMeds(response.data);
    } catch (error) {
      console.error('[MedicamentosGestor] Erro ao carregar estoque:', error);
      setErro('Não foi possível carregar os medicamentos desta unidade.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Cálculos estatísticos em tempo real para os cards HSL do cabeçalho
  const disponiveis = meds.filter((med) => med.disponivel).length;
  const emFalta = meds.length - disponiveis;

  // Filtragem local dos medicamentos
  const medsFiltrados = meds.filter((med) => {
    if (filtro === 'disponiveis') return med.disponivel;
    if (filtro === 'em_falta') return !med.disponivel;
    return true;
  });

  // Salva um novo medicamento no banco
  const handleCadastrar = async (event) => {
    event.preventDefault();
    setSalvando(true);
    try {
      await api.post('/gestor/medicamento', formCadastro);
      toast.success('Medicamento cadastrado com sucesso!');
      setModalCadastroAberto(false);
      setFormCadastro(FORM_INICIAL);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao cadastrar medicamento.');
    } finally {
      setSalvando(false);
    }
  };

  // Prepara o estado para edição de um medicamento existente
  const abrirEdicao = (medicamento) => {
    setMedicamentoEdicao(medicamento);
    setFormEdicao({
      disponivel:          Boolean(medicamento.disponivel),
      observacao:          medicamento.observacao          || '',
      instrucoes_retirada: medicamento.instrucoes_retirada || '',
    });
  };

  // Salva as alterações do medicamento editado
  const handleEditar = async (event) => {
    event.preventDefault();
    setSalvando(true);
    try {
      await api.put(`/gestor/medicamento/${medicamentoEdicao.id}`, formEdicao);
      toast.success(`"${medicamentoEdicao.nome}" atualizado.`);
      setMedicamentoEdicao(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar medicamento.');
    } finally {
      setSalvando(false);
    }
  };

  // Toggle rápido de disponibilidade que preserva observações e instruções
  const toggle = async (medicamento) => {
    try {
      await api.put(`/gestor/medicamento/${medicamento.id}`, {
        disponivel:          !medicamento.disponivel,
        observacao:          medicamento.observacao,
        instrucoes_retirada: medicamento.instrucoes_retirada,
      });
      toast.success(`"${medicamento.nome}" atualizado.`);
      await load();
    } catch (error) {
      console.error('[MedicamentosGestor] Erro ao alternar status:', error);
      toast.error('Erro ao atualizar medicamento.');
    }
  };

  return (
    <GestorLayout>
      {/* ── SEÇÃO DE CABEÇALHO E AÇÃO PRINCIPAL ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">
            Gestão de Estoque
          </h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm md:text-base">
            Controle e atualização do catálogo de medicamentos disponíveis para os pacientes.
          </p>
        </div>
        <button
          onClick={() => setModalCadastroAberto(true)}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start md:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Novo Medicamento
        </button>
      </div>

      {/* ── CONTADORES ESTATÍSTICOS HSL GLASSMORPHIC ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {/* Card: Disponíveis */}
        <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/15 rounded-3xl p-6 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-750 flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-950 tracking-tight">{disponiveis}</div>
            <div className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Disponíveis</div>
          </div>
        </div>

        {/* Card: Em Falta */}
        <div className="bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/15 rounded-3xl p-6 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-600 flex-shrink-0">
            <span className="material-symbols-outlined text-2xl animate-pulse">dangerous</span>
          </div>
          <div>
            <div className="text-3xl font-black text-red-950 tracking-tight">{emFalta}</div>
            <div className="text-xs font-extrabold text-red-800 uppercase tracking-wider">Em falta</div>
          </div>
        </div>
      </div>

      {/* ── BARRA DE FILTROS (PÍLULA DESLIZANTE CORPORATIVA) ── */}
      <div className="inline-flex bg-surface-container-high/60 backdrop-blur-md border border-surface-variant/30 rounded-2xl p-1.5 mb-6 overflow-x-auto max-w-full gap-1">
        {FILTROS.map((item) => (
          <button
            key={item.value}
            onClick={() => setFiltro(item.value)}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-sm whitespace-nowrap transition-all duration-250 ${
              filtro === item.value
                ? 'bg-primary text-white shadow-md shadow-primary/20 scale-102'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ── RENDERIZAÇÃO PRINCIPAL / TABELA DE ESTOQUE ── */}
      {erro && !loading ? (
        <div className="bg-surface-container-lowest rounded-3xl border border-red-500/15 p-10 text-center max-w-md mx-auto shadow-sm">
          <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
          <h3 className="font-bold text-on-background mt-4 text-lg">Falha de Comunicação</h3>
          <p className="text-on-surface-variant text-sm mt-2 font-medium">{erro}</p>
          <button
            onClick={load}
            className="mt-6 h-12 px-6 bg-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 mx-auto"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl border border-surface-variant/45 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-variant/40">
                  <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Medicamento</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Princípio ativo</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Observação</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Atualizado em</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/30">
                {loading ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td colSpan="6" className="px-6 py-5">
                        <div className="h-6 bg-surface-container-high rounded-lg w-full" />
                      </td>
                    </tr>
                  ))
                ) : medsFiltrados.length > 0 ? (
                  medsFiltrados.map((med) => (
                    <tr key={med.id} className="hover:bg-surface-container-low/40 transition-colors">
                      {/* Nome do Medicamento com atalho de clique */}
                      <td className="px-6 py-5 font-bold text-on-background">
                        <button
                          onClick={() => abrirEdicao(med)}
                          className="text-left font-bold text-on-background hover:text-primary hover:underline decoration-primary/30 transition-all decoration-2 underline-offset-2"
                        >
                          {med.nome}
                        </button>
                      </td>

                      {/* Princípio Ativo */}
                      <td className="px-6 py-5 text-on-surface-variant text-sm font-medium">
                        {med.principio_ativo || (
                          <span className="text-on-surface-variant/40 italic">Não informado</span>
                        )}
                      </td>

                      {/* Status Translúcido com Bolinha Indicadora */}
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                            med.disponivel
                              ? 'bg-emerald-500/10 text-emerald-850 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-850 border-red-500/20'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              med.disponivel ? 'bg-emerald-505' : 'bg-red-500 animate-pulse'
                            }`}
                          />
                          {med.disponivel ? 'Disponível' : 'Em falta'}
                        </span>
                      </td>

                      {/* Observação */}
                      <td className="px-6 py-5 text-on-surface-variant text-sm max-w-xs truncate font-medium">
                        {med.observacao || <span className="text-on-surface-variant/35">—</span>}
                      </td>

                      {/* Data de Atualização */}
                      <td className="px-6 py-5 text-on-surface-variant text-sm font-medium">
                        {med.atualizado_em ? (
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base text-on-surface-variant/60">schedule</span>
                            {new Date(med.atualizado_em).toLocaleString('pt-BR')}
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/35">—</span>
                        )}
                      </td>

                      {/* Botões de Ação Inline */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirEdicao(med)}
                            className="h-9 px-4 border border-surface-variant hover:bg-surface-container-high text-on-background font-bold text-xs rounded-xl transition-all"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => toggle(med)}
                            className={`h-9 px-4 border text-xs font-bold rounded-xl transition-all ${
                              med.disponivel
                                ? 'border-red-500/20 hover:bg-red-500/5 text-red-700'
                                : 'border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-700'
                            }`}
                          >
                            Alternar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-on-surface-variant font-semibold text-sm">
                      Nenhum medicamento encontrado no filtro selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: CADASTRAR NOVO MEDICAMENTO ── */}
      {modalCadastroAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-md transition-opacity"
            onClick={() => setModalCadastroAberto(false)}
          />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden border border-surface-variant/30 flex flex-col max-h-[90vh]">
            <header className="p-6 md:p-8 border-b border-surface-variant/40 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-xl font-extrabold text-on-background">Novo Medicamento</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Cadastre o insumo farmacêutico na base local.</p>
              </div>
              <button
                onClick={() => setModalCadastroAberto(false)}
                aria-label="Fechar cadastro"
                className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <form onSubmit={handleCadastrar} className="p-6 md:p-8 space-y-5 overflow-y-auto flex-1">
              {/* Campo: Nome */}
              <label className="block space-y-2">
                <span className="text-sm font-extrabold text-on-surface-variant">Nome do Medicamento *</span>
                <input
                  required
                  value={formCadastro.nome}
                  onChange={(e) => setFormCadastro((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Amoxicilina 500mg"
                  className="w-full h-12 px-4 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </label>

              {/* Campo: Princípio Ativo */}
              <label className="block space-y-2">
                <span className="text-sm font-extrabold text-on-surface-variant">Princípio ativo</span>
                <input
                  value={formCadastro.principio_ativo}
                  onChange={(e) => setFormCadastro((prev) => ({ ...prev, principio_ativo: e.target.value }))}
                  placeholder="Ex: Amoxicilina Tri-hidratada"
                  className="w-full h-12 px-4 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </label>

              {/* Seletor Estilizado de Disponibilidade ao Cadastrar */}
              <div className="space-y-2">
                <span className="text-sm font-extrabold text-on-surface-variant block">Disponibilidade</span>
                <button
                  type="button"
                  onClick={() => setFormCadastro((prev) => ({ ...prev, disponivel: !prev.disponivel }))}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    formCadastro.disponivel
                      ? 'border-emerald-400 bg-emerald-500/5'
                      : 'border-surface-variant bg-surface-container-high/50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      formCadastro.disponivel ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-on-surface-variant/45'
                    }`}
                  >
                    {formCadastro.disponivel && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                  </div>
                  <div>
                    <p className={`text-sm font-extrabold ${formCadastro.disponivel ? 'text-emerald-900' : 'text-on-surface'}`}>
                      {formCadastro.disponivel ? 'Disponível para retirada imediata' : 'Indisponível (Em falta)'}
                    </p>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                      Indica se há estoque físico pronto na farmácia desta UBS.
                    </p>
                  </div>
                </button>
              </div>

              {/* Campo: Observação */}
              <label className="block space-y-2">
                <span className="text-sm font-extrabold text-on-surface-variant">Observações do Estoque</span>
                <textarea
                  rows="3"
                  value={formCadastro.observacao}
                  onChange={(e) => setFormCadastro((prev) => ({ ...prev, observacao: e.target.value }))}
                  placeholder="Ex: Baixo estoque. Previsão de nova remessa para 05/07."
                  className="w-full px-4 py-3 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium resize-none focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </label>

              {/* Campo: Como retirar */}
              <label className="block space-y-2">
                <span className="text-sm font-extrabold text-on-surface-variant">Instruções de Retirada</span>
                <textarea
                  rows="3"
                  value={formCadastro.instrucoes_retirada}
                  onChange={(e) => setFormCadastro((prev) => ({ ...prev, instrucoes_retirada: e.target.value }))}
                  placeholder="Ex: Retirada no Guichê 3 da Farmácia, mediante receita física do SUS atualizada."
                  className="w-full px-4 py-3 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium resize-none focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </label>

              {/* Ações do Rodapé */}
              <div className="flex gap-3 pt-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setModalCadastroAberto(false)}
                  className="flex-1 h-12 rounded-2xl border border-surface-variant font-bold text-sm hover:bg-surface-container-low active:scale-98 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 active:scale-98 transition-all"
                >
                  {salvando ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR MEDICAMENTO EXISTENTE ── */}
      {medicamentoEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-md transition-opacity"
            onClick={() => setMedicamentoEdicao(null)}
          />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden border border-surface-variant/30 flex flex-col max-h-[90vh]">
            <header className="p-6 md:p-8 border-b border-surface-variant/40 flex-shrink-0">
              <p className="text-xs font-black uppercase tracking-wider text-primary">Editar medicamento</p>
              <h2 className="text-xl font-extrabold text-on-background mt-1">{medicamentoEdicao.nome}</h2>
            </header>

            <form onSubmit={handleEditar} className="p-6 md:p-8 space-y-5 overflow-y-auto flex-1">
              {/* Seletor Estilizado de Disponibilidade na Edição */}
              <div className="space-y-2">
                <span className="text-sm font-extrabold text-on-surface-variant block">Disponibilidade</span>
                <button
                  type="button"
                  onClick={() => setFormEdicao((prev) => ({ ...prev, disponivel: !prev.disponivel }))}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    formEdicao.disponivel
                      ? 'border-emerald-400 bg-emerald-500/5'
                      : 'border-surface-variant bg-surface-container-high/50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      formEdicao.disponivel ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-on-surface-variant/45'
                    }`}
                  >
                    {formEdicao.disponivel && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                  </div>
                  <div>
                    <p className={`text-sm font-extrabold ${formEdicao.disponivel ? 'text-emerald-900' : 'text-on-surface'}`}>
                      {formEdicao.disponivel ? 'Disponível para retirada imediata' : 'Indisponível (Em falta)'}
                    </p>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                      Atualiza se há estoque físico pronto na farmácia desta UBS.
                    </p>
                  </div>
                </button>
              </div>

              {/* Campo: Observação */}
              <label className="block space-y-2">
                <span className="text-sm font-extrabold text-on-surface-variant">Observações do Estoque</span>
                <textarea
                  rows="4"
                  value={formEdicao.observacao}
                  onChange={(e) => setFormEdicao((prev) => ({ ...prev, observacao: e.target.value }))}
                  placeholder="Ex: Nova remessa prevista para chegada pelo almoxarifado central."
                  className="w-full px-4 py-3 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium resize-none focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </label>

              {/* Campo: Como retirar */}
              <label className="block space-y-2">
                <span className="text-sm font-extrabold text-on-surface-variant">Instruções de Retirada</span>
                <textarea
                  rows="3"
                  value={formEdicao.instrucoes_retirada}
                  onChange={(e) => setFormEdicao((prev) => ({ ...prev, instrucoes_retirada: e.target.value }))}
                  placeholder="Ex: Retirada no Guichê 3 da Farmácia, mediante receita física do SUS atualizada."
                  className="w-full px-4 py-3 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium resize-none focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </label>

              {/* Ações do Rodapé */}
              <div className="flex gap-3 pt-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setMedicamentoEdicao(null)}
                  className="flex-1 h-12 rounded-2xl border border-surface-variant font-bold text-sm hover:bg-surface-container-low active:scale-98 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 active:scale-98 transition-all"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GestorLayout>
  );
}
