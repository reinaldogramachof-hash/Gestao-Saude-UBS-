/**
 * PÁGINA: MedicamentosGestor.jsx + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Gestão de estoque de medicamentos da UBS.
 *         Permite ao gestor alternar a disponibilidade de cada medicamento.
 *         Usa GestorLayout para layout responsivo com sidebar drawer.
 *         Tabela com scroll horizontal no mobile.
 *
 * API: GET /api/gestor/medicamentos
 *      PUT /api/gestor/medicamento/:id
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import GestorLayout from '../../components/gestor/GestorLayout';

export default function MedicamentosGestor() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carrega a lista de medicamentos da UBS ao montar o componente
  const load = () => {
    setLoading(true);
    api.get('/gestor/medicamentos')
      .then(r => setMeds(r.data))
      .catch(() => toast.error('Erro ao carregar medicamentos.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Alterna disponibilidade do medicamento e recarrega a lista
  const toggle = async (m) => {
    try {
      await api.put(`/gestor/medicamento/${m.id}`, {
        disponivel: !m.disponivel,
        observacao: m.observacao,
      });
      toast.success(`"${m.nome}" atualizado.`);
      load();
    } catch {
      toast.error('Erro ao atualizar medicamento.');
    }
  };

  return (
    <GestorLayout>
      {/* ── Cabeçalho responsivo ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-10">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">Gestão de Estoque</h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm">Atualize a disponibilidade dos medicamentos da unidade.</p>
        </div>
      </div>

      {/* ── Card com tabela + scroll horizontal no mobile ── */}
      <div className="bg-surface-container-lowest rounded-2xl md:rounded-3xl border border-surface-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead className="bg-surface-container-low border-b border-surface-variant">
              <tr>
                <th className="p-4 md:p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Medicamento</th>
                <th className="p-4 md:p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Princípio Ativo</th>
                <th className="p-4 md:p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="p-4 md:p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="4" className="p-4 md:p-6">
                      <div className="h-5 bg-surface-container-high rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : meds.length > 0 ? (
                meds.map(m => (
                  <tr key={m.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="p-4 md:p-6 font-bold text-on-background">{m.nome}</td>
                    <td className="p-4 md:p-6 text-on-surface-variant text-sm">{m.principio_ativo || '---'}</td>
                    <td className="p-4 md:p-6">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${m.disponivel ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {m.disponivel ? 'Disponível' : 'Em falta'}
                      </span>
                    </td>
                    <td className="p-4 md:p-6">
                      <button
                        onClick={() => toggle(m)}
                        className="px-4 py-2 border border-outline rounded-xl hover:bg-surface-variant text-sm font-semibold transition-colors"
                      >
                        Alternar Status
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-16 text-center text-on-surface-variant font-medium">
                    Nenhum medicamento cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </GestorLayout>
  );
}
