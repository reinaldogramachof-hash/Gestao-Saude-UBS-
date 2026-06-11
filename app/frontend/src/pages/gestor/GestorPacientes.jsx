/**
 * PÁGINA: GestorPacientes.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Lista, busca, pagina e cadastra pacientes, exibindo solicitações
 *         ativas e urgências. Inclui aba "Aguardando aprovação" para validar
 *         cadastros feitos pelo portal público (auto-cadastro do munícipe).
 *
 * API: GET    /api/gestor/pacientes                → lista paginada (ativos)
 *      GET    /api/gestor/pacientes/pendentes      → cadastros aguardando aprovação
 *      POST   /api/gestor/paciente                 → cadastro manual pelo gestor
 *      PATCH  /api/gestor/paciente/:id/ativar      → aprova cadastro pendente
 *      DELETE /api/gestor/paciente/:id/rejeitar    → rejeita cadastro pendente
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import GestorLayout from '../../components/gestor/GestorLayout';

export default function GestorPacientes() {
  const navigate = useNavigate();

  // ── Aba ativa: 'ativos' ou 'pendentes' ───────────────────────────────────
  const [aba, setAba] = useState('ativos');

  const [pacientes, setPacientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);

  // ── Estado da aba de pendentes ────────────────────────────────────────────
  const [pendentes, setPendentes] = useState([]);
  const [loadingPendentes, setLoadingPendentes] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroCRA, setErroCRA] = useState('');
  const [formData, setFormData] = useState({
    nome: '', cra: '', data_nascimento: '', cpf: '', telefone: '', email: ''
  });

  // Carrega a aba correta quando muda
  useEffect(() => {
    if (aba === 'ativos') {
      const timer = setTimeout(() => fetchPacientes(), busca ? 400 : 0);
      return () => clearTimeout(timer);
    } else {
      fetchPendentes();
    }
  }, [busca, paginaAtual, aba]);

  const fetchPendentes = async () => {
    setLoadingPendentes(true);
    try {
      const res = await api.get('/gestor/pacientes/pendentes');
      setPendentes(res.data);
    } catch {
      toast.error('Erro ao carregar cadastros pendentes.');
    } finally {
      setLoadingPendentes(false);
    }
  };

  const handleAtivar = async (id, nome) => {
    try {
      await api.patch(`/gestor/paciente/${id}/ativar`);
      toast.success(`Cadastro de ${nome} ativado!`);
      fetchPendentes();
    } catch {
      toast.error('Erro ao ativar cadastro.');
    }
  };

  const handleRejeitar = async (id, nome) => {
    try {
      await api.delete(`/gestor/paciente/${id}/rejeitar`);
      toast.success(`Cadastro de ${nome} rejeitado e removido.`);
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
      setErro('Não foi possível carregar a lista de pacientes.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'cra') setErroCRA('');
  };

  const handleSalvarPaciente = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErroCRA('');
    try {
      await api.post('/gestor/paciente', formData);
      toast.success('Paciente cadastrado com sucesso!');
      setModalAberto(false);
      setFormData({ nome: '', cra: '', data_nascimento: '', cpf: '', telefone: '', email: '' });
      fetchPacientes();
    } catch (err) {
      if (err.response?.status === 409) {
        setErroCRA('Este CRA já existe.');
        toast.error('Conflito: CRA duplicado.');
      } else {
        toast.error('Erro ao salvar paciente.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <GestorLayout>
      {/* ── Cabeçalho responsivo ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">Pacientes</h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm">Gerencie os prontuários da sua unidade.</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined">person_add</span>
          Novo Paciente
        </button>
      </div>

      {/* ── Abas: Pacientes ativos / Aguardando aprovação ── */}
      <div className="flex gap-2 mb-6 border-b border-surface-variant">
        <button
          onClick={() => setAba('ativos')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${
            aba === 'ativos'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Pacientes Ativos
        </button>
        <button
          onClick={() => setAba('pendentes')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            aba === 'pendentes'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Aguardando Aprovação
          {/* Badge com contagem de pendentes — visível mesmo na aba de ativos */}
          {pendentes.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-extrabold px-2 py-0.5 rounded-full">
              {pendentes.length}
            </span>
          )}
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ABA: AGUARDANDO APROVAÇÃO
          ════════════════════════════════════════════════════════════════ */}
      {aba === 'pendentes' && (
        <div className="space-y-3">
          {loadingPendentes ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-20 bg-surface-container-low rounded-2xl animate-pulse" />
            ))
          ) : pendentes.length === 0 ? (
            <div className="py-20 text-center bg-surface-container-lowest rounded-2xl border border-surface-variant">
              <span className="material-symbols-outlined text-5xl block mb-3 opacity-30">how_to_reg</span>
              <p className="text-on-surface-variant font-semibold">Nenhum cadastro aguardando aprovação.</p>
              <p className="text-xs text-on-surface-variant mt-1">Quando um munícipe se cadastrar pelo portal, aparecerá aqui.</p>
            </div>
          ) : (
            pendentes.map(p => (
              <div key={p.id} className="bg-surface-container-lowest rounded-2xl border border-amber-200 p-4 md:p-5 flex flex-wrap items-center gap-4">
                {/* Ícone de pendente */}
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-amber-600">pending_actions</span>
                </div>

                {/* Dados do cadastro */}
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-on-background">{p.nome}</p>
                  <div className="flex flex-wrap gap-3 mt-0.5">
                    <span className="text-xs text-on-surface-variant font-medium">
                      CRA: <strong>{p.cra}</strong>
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      Nasc.: {new Date(p.data_nascimento).toLocaleDateString('pt-BR')}
                    </span>
                    {p.telefone && (
                      <span className="text-xs text-on-surface-variant font-medium">{p.telefone}</span>
                    )}
                    <span className="text-xs text-on-surface-variant font-medium">
                      Solicitado em {new Date(p.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Ações de aprovação / rejeição */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRejeitar(p.id, p.nome)}
                    className="px-3 py-2 border border-red-200 text-red-600 font-bold rounded-xl text-xs hover:bg-red-50 transition-colors"
                  >
                    Rejeitar
                  </button>
                  <button
                    onClick={() => handleAtivar(p.id, p.nome)}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Aprovar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          ABA: PACIENTES ATIVOS
          ════════════════════════════════════════════════════════════════ */}
      {aba === 'ativos' && (<>
      {/* ── Barra de busca ── */}
      <div className="relative mb-6 max-w-2xl">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input
          type="text"
          placeholder="Buscar por nome ou CRA..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPaginaAtual(1);
          }}
          className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-medium text-sm"
        />
      </div>

      {/* ── Tabela com scroll horizontal no mobile ── */}
      {erro && !loading ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-red-200 p-8 text-center">
          <p className="font-bold text-on-background">{erro}</p>
          <button onClick={fetchPacientes} className="mt-4 h-12 px-6 bg-primary text-white font-bold rounded-2xl">Tentar novamente</button>
        </div>
      ) : (
      <div className="bg-surface-container-lowest rounded-3xl border border-surface-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-surface-container-low border-b border-surface-variant">
              <tr>
                <th className="p-4 md:p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nome</th>
                <th className="p-4 md:p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">CRA</th>
                <th className="p-4 md:p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Telefone</th>
                <th className="p-4 md:p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nascimento</th>
                <th className="p-4 md:p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Solicitações</th>
                <th className="p-4 md:p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="p-4 md:p-6">
                      <div className="h-5 bg-surface-container-high rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : pacientes.length > 0 ? (
                pacientes.map(p => (
                  <tr key={p.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="p-4 md:p-6">
                      <div className="font-bold text-on-background">{p.nome}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">{p.email || 'Sem e-mail'}</div>
                    </td>
                    <td className="p-4 md:p-6">
                      <span className="bg-surface-container-high px-2 py-1 rounded-lg text-xs font-bold text-on-surface-variant border border-outline-variant">
                        {p.cra}
                      </span>
                    </td>
                    <td className="p-4 md:p-6 font-medium text-on-surface-variant text-sm">{p.telefone || '---'}</td>
                    <td className="p-4 md:p-6 font-medium text-on-surface-variant text-sm">
                      {new Date(p.data_nascimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 md:p-6">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        p.tem_urgente
                          ? 'bg-red-100 text-red-700'
                          : Number(p.solicitacoes_ativas) > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {Number(p.solicitacoes_ativas) || 0} ativas
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-right">
                      <button
                        onClick={() => navigate(`/gestor/paciente/${p.id}`)}
                        className="px-4 py-2 bg-surface-container-high hover:bg-primary/10 text-on-surface hover:text-primary font-bold rounded-xl transition-all border border-transparent hover:border-primary/20 text-sm"
                      >
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-16 text-center text-on-surface-variant font-medium">
                    Nenhum paciente cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 md:p-6 border-t border-surface-variant flex items-center justify-between gap-3">
          <button
            onClick={() => setPaginaAtual((pagina) => Math.max(1, pagina - 1))}
            disabled={paginaAtual === 1 || loading}
            className="h-11 px-5 rounded-xl border border-outline font-bold disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm font-bold text-on-surface-variant">Página {paginaAtual}</span>
          <button
            onClick={() => setPaginaAtual((pagina) => pagina + 1)}
            disabled={pacientes.length < 20 || loading}
            className="h-11 px-5 rounded-xl bg-primary text-white font-bold disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </div>
      )}

      {/* ── Modal de Cadastro (inalterado) ── */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalAberto(false)}></div>
          <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-on-background">Novo Paciente</h3>
              <button onClick={() => setModalAberto(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleSalvarPaciente} className="p-6 md:p-8 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-on-surface-variant">Nome Completo*</label>
                <input required name="nome" value={formData.nome} onChange={handleInputChange} type="text" placeholder="Ex: João Silva Santos"
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">CRA*</label>
                  <input required name="cra" value={formData.cra} onChange={handleInputChange} type="text" placeholder="Ex: 00123456"
                    className={`w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium ${erroCRA ? 'ring-2 ring-red-400/50' : ''}`} />
                  {erroCRA && <p className="text-xs text-red-500 font-bold">{erroCRA}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Data de Nascimento*</label>
                  <input required name="data_nascimento" value={formData.data_nascimento} onChange={handleInputChange} type="date"
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">CPF (opcional)</label>
                  <input name="cpf" value={formData.cpf} onChange={handleInputChange} type="text" placeholder="000.000.000-00"
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Telefone (opcional)</label>
                  <input name="telefone" value={formData.telefone} onChange={handleInputChange} type="text" placeholder="(12) 99999-9999"
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">E-mail (opcional)</label>
                <input name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="exemplo@email.com"
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline text-on-surface font-bold">Cancelar</button>
                <button type="submit" disabled={enviando} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">
                  {enviando ? 'Salvando...' : 'Salvar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </>
      )}

    </GestorLayout>
  );
}
