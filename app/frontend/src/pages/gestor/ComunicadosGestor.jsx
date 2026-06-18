/**
 * PÁGINA: ComunicadosGestor.jsx — Épico 3 + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Gerenciamento de comunicados da UBS pelo gestor.
 *         Usa GestorLayout para layout responsivo com sidebar drawer.
 *         Modal de criação inalterado.
 *
 * API: GET    /api/gestor/comunicados
 *      POST   /api/gestor/comunicado
 *      DELETE /api/gestor/comunicado/:id
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import GestorLayout from '../../components/gestor/GestorLayout';

export default function ComunicadosGestor() {
  const [comunicados, setComunicados] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({ titulo: '', mensagem: '', tipo: 'geral', paciente_id: '' });

  const carregarComunicados = () => {
    setLoading(true);
    api.get('/gestor/comunicados')
      .then(r => setComunicados(r.data))
      .catch(() => toast.error('Erro ao carregar comunicados.'))
      .finally(() => setLoading(false));
  };

  const carregarPacientes = () => {
    api.get('/gestor/pacientes').then(r => setPacientes(r.data)).catch(() => {});
  };

  useEffect(() => { carregarComunicados(); carregarPacientes(); }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/gestor/comunicado', { ...form, paciente_id: form.tipo === 'individual' ? form.paciente_id : null });
      toast.success('Comunicado publicado com sucesso!');
      setModalAberto(false);
      setForm({ titulo: '', mensagem: '', tipo: 'geral', paciente_id: '' });
      carregarComunicados();
    } catch {
      toast.error('Erro ao criar comunicado.');
    } finally {
      setEnviando(false);
    }
  };

  const handleExcluir = async (id) => {
    try {
      await api.delete(`/gestor/comunicado/${id}`);
      setComunicados(prev => prev.filter(c => c.id !== id));
      toast.success('Comunicado excluído.');
    } catch {
      toast.error('Erro ao excluir comunicado.');
    }
  };

  return (
    <GestorLayout>
      {/* ── Cabeçalho responsivo ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-10">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">Comunicados</h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm">Avise os pacientes sobre novidades da unidade.</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined">add</span>
          Novo Comunicado
        </button>
      </div>

      {/* ── Lista de Comunicados ── */}
      <div className="space-y-3 md:space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-28 bg-surface-container-low rounded-2xl animate-pulse" />)
        ) : comunicados.length > 0 ? (
          comunicados.map(c => (
            <div key={c.id} className="bg-surface-container-lowest rounded-xl md:rounded-2xl border border-surface-variant p-4 md:p-6 flex justify-between items-start gap-4">
              <div className="flex gap-3 md:gap-4 items-start flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.tipo === 'individual' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  <span className="material-symbols-outlined text-xl">{c.tipo === 'individual' ? 'person' : 'campaign'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-on-background truncate">{c.titulo}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${c.tipo === 'individual' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {c.tipo === 'individual' ? 'INDIVIDUAL' : 'GERAL'}
                    </span>
                  </div>
                  {c.tipo === 'individual' && c.paciente_nome && (
                    <p className="text-xs font-semibold text-on-surface-variant mb-1">Para: {c.paciente_nome}</p>
                  )}
                  <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">
                    {c.mensagem.length > 120 ? c.mensagem.substring(0, 120) + '...' : c.mensagem}
                  </p>
                  <p className="text-xs text-on-surface-variant font-medium mt-2">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <button onClick={() => handleExcluir(c.id)} className="w-9 h-9 rounded-xl hover:bg-red-50 hover:text-red-600 text-on-surface-variant flex items-center justify-center transition-colors flex-shrink-0">
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
            </div>
          ))
        ) : (
          <div className="p-16 text-center text-on-surface-variant font-medium bg-surface-container-lowest rounded-2xl border border-surface-variant">
            Nenhum comunicado criado ainda.
          </div>
        )}
      </div>

      {/* ── Modal: Novo Comunicado ── */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalAberto(false)} />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <header className="p-6 md:p-8 border-b border-surface-variant flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-extrabold">Novo Comunicado</h3>
              <button onClick={() => setModalAberto(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleSalvar} className="p-6 md:p-8 space-y-5 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Título*</label>
                <input required name="titulo" value={form.titulo} onChange={handleInputChange} placeholder="Ex: Suspensão de consultas"
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Tipo*</label>
                <select name="tipo" value={form.tipo} onChange={handleInputChange} className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                  <option value="geral">Geral — Para todos os pacientes</option>
                  <option value="individual">Individual — Para um paciente específico</option>
                </select>
              </div>
              {form.tipo === 'individual' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Paciente destinatário*</label>
                  <select required name="paciente_id" value={form.paciente_id} onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
                    <option value="">Selecione um paciente...</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome} — CRA {p.cra}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">Mensagem*</label>
                <textarea required name="mensagem" rows={4} value={form.mensagem} onChange={handleInputChange}
                  placeholder="Escreva o comunicado em linguagem clara e acessível..."
                  className="w-full px-4 py-3 bg-surface-container-high border-none rounded-xl outline-none font-medium resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline font-bold">Cancelar</button>
                <button type="submit" disabled={enviando} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">
                  {enviando ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GestorLayout>
  );
}
