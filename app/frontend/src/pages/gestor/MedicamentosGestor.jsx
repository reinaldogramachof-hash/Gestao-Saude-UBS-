/**
 * PÁGINA: MedicamentosGestor.jsx
 * -----------------------------------------------------------------------------
 * FUNÇÃO: Gerencia o catálogo de medicamentos da UBS, com filtros locais,
 *         contadores, cadastro, edição de observação e disponibilidade.
 * PROPS: Nenhuma. A página obtém a UBS pelo token configurado em api.js.
 * API: GET  /api/gestor/medicamentos
 *      POST /api/gestor/medicamento
 *      PUT  /api/gestor/medicamento/:id
 */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import GestorLayout from '../../components/gestor/GestorLayout';

const FORM_INICIAL = {
  nome: '',
  principio_ativo: '',
  disponivel: true,
  observacao: '',
};

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
  const [formEdicao, setFormEdicao] = useState({ disponivel: false, observacao: '' });
  const [salvando, setSalvando] = useState(false);

  // Mantém erro e loading separados para permitir retry sem esconder a causa.
  const load = async () => {
    setLoading(true);
    setErro('');
    try {
      const response = await api.get('/gestor/medicamentos');
      setMeds(response.data);
    } catch {
      setErro('Não foi possível carregar os medicamentos desta unidade.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const disponiveis = meds.filter((med) => med.disponivel).length;
  const emFalta = meds.length - disponiveis;
  const medsFiltrados = meds.filter((med) => {
    if (filtro === 'disponiveis') return med.disponivel;
    if (filtro === 'em_falta') return !med.disponivel;
    return true;
  });

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

  const abrirEdicao = (medicamento) => {
    setMedicamentoEdicao(medicamento);
    setFormEdicao({
      disponivel: Boolean(medicamento.disponivel),
      observacao: medicamento.observacao || '',
    });
  };

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

  // O toggle rápido preserva a observação atual e atualiza só a disponibilidade.
  const toggle = async (medicamento) => {
    try {
      await api.put(`/gestor/medicamento/${medicamento.id}`, {
        disponivel: !medicamento.disponivel,
        observacao: medicamento.observacao,
      });
      toast.success(`"${medicamento.nome}" atualizado.`);
      await load();
    } catch {
      toast.error('Erro ao atualizar medicamento.');
    }
  };

  return (
    <GestorLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">Gestão de Estoque</h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm">
            {disponiveis} disponíveis / {emFalta} em falta
          </p>
        </div>
        <button
          onClick={() => setModalCadastroAberto(true)}
          className="h-12 px-6 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined">add</span>
          Novo Medicamento
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTROS.map((item) => (
          <button
            key={item.value}
            onClick={() => setFiltro(item.value)}
            className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${
              filtro === item.value
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {erro && !loading ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-red-200 shadow-sm p-8 text-center">
          <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
          <p className="font-bold text-on-background mt-3">{erro}</p>
          <button onClick={load} className="mt-5 h-12 px-6 bg-primary text-white font-bold rounded-2xl">
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-variant shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-surface-container-low border-b border-surface-variant">
                <tr>
                  {['Medicamento', 'Princípio ativo', 'Status', 'Observação', 'Atualizado em', 'Ações'].map((titulo) => (
                    <th key={titulo} className="p-4 md:p-5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{titulo}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td colSpan="6" className="p-5">
                        <div className="h-5 bg-surface-container-high rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : medsFiltrados.length > 0 ? (
                  medsFiltrados.map((med) => (
                    <tr key={med.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="p-4 md:p-5 font-bold text-on-background">
                        <button onClick={() => abrirEdicao(med)} className="text-left hover:text-primary">
                          {med.nome}
                        </button>
                      </td>
                      <td className="p-4 md:p-5 text-on-surface-variant text-sm">{med.principio_ativo || '---'}</td>
                      <td className="p-4 md:p-5">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${med.disponivel ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {med.disponivel ? 'Disponível' : 'Em falta'}
                        </span>
                      </td>
                      <td className="p-4 md:p-5 text-on-surface-variant text-sm max-w-xs">{med.observacao || '---'}</td>
                      <td className="p-4 md:p-5 text-on-surface-variant text-sm">
                        {med.atualizado_em ? new Date(med.atualizado_em).toLocaleString('pt-BR') : '---'}
                      </td>
                      <td className="p-4 md:p-5">
                        <div className="flex gap-2">
                          <button onClick={() => abrirEdicao(med)} className="px-3 py-2 border border-outline rounded-xl text-sm font-semibold">Editar</button>
                          <button onClick={() => toggle(med)} className="px-3 py-2 border border-outline rounded-xl text-sm font-semibold">Alternar</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-16 text-center text-on-surface-variant font-medium">
                      Nenhum medicamento encontrado neste filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalCadastroAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalCadastroAberto(false)} />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden">
            <header className="p-6 border-b border-surface-variant flex justify-between items-center">
              <h2 className="text-xl font-extrabold">Novo Medicamento</h2>
              <button onClick={() => setModalCadastroAberto(false)} aria-label="Fechar cadastro" className="w-10 h-10 rounded-full hover:bg-surface-container-low">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleCadastrar} className="p-6 space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-bold text-on-surface-variant">Nome*</span>
                <input required value={formCadastro.nome} onChange={(e) => setFormCadastro((prev) => ({ ...prev, nome: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-on-surface-variant">Princípio ativo</span>
                <input value={formCadastro.principio_ativo} onChange={(e) => setFormCadastro((prev) => ({ ...prev, principio_ativo: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
              </label>
              <label className="flex items-center gap-3 font-bold text-on-surface">
                <input type="checkbox" checked={formCadastro.disponivel} onChange={(e) => setFormCadastro((prev) => ({ ...prev, disponivel: e.target.checked }))} className="w-5 h-5 rounded text-primary" />
                Disponível ao cadastrar?
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-on-surface-variant">Observação</span>
                <textarea rows="3" value={formCadastro.observacao} onChange={(e) => setFormCadastro((prev) => ({ ...prev, observacao: e.target.value }))} placeholder="Ex: Em falta por 15 dias" className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModalCadastroAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline font-bold">Cancelar</button>
                <button type="submit" disabled={salvando} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">{salvando ? 'Salvando...' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {medicamentoEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setMedicamentoEdicao(null)} />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden">
            <header className="p-6 border-b border-surface-variant">
              <p className="text-xs font-bold uppercase text-on-surface-variant">Editar medicamento</p>
              <h2 className="text-xl font-extrabold mt-1">{medicamentoEdicao.nome}</h2>
            </header>
            <form onSubmit={handleEditar} className="p-6 space-y-5">
              <label className="flex items-center gap-3 font-bold text-on-surface">
                <input type="checkbox" checked={formEdicao.disponivel} onChange={(e) => setFormEdicao((prev) => ({ ...prev, disponivel: e.target.checked }))} className="w-5 h-5 rounded text-primary" />
                Medicamento disponível
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-on-surface-variant">Observação</span>
                <textarea rows="4" value={formEdicao.observacao} onChange={(e) => setFormEdicao((prev) => ({ ...prev, observacao: e.target.value }))} className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setMedicamentoEdicao(null)} className="flex-1 h-12 rounded-2xl border border-outline font-bold">Cancelar</button>
                <button type="submit" disabled={salvando} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GestorLayout>
  );
}
