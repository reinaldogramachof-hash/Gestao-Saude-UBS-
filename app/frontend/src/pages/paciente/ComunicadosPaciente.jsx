/**
 * PÁGINA: ComunicadosPaciente.jsx — Épico 3 + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Exibe os comunicados da UBS para o paciente logado.
 *         Usa PacienteLayout para centralização no desktop.
 *
 * API: GET /api/paciente/comunicados
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PacienteLayout from '../../components/paciente/PacienteLayout';

export default function ComunicadosPaciente() {
  const [comunicados, setComunicados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandidos, setExpandidos] = useState({});

  useEffect(() => {
    api.get('/paciente/comunicados')
      .then(r => setComunicados(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = comunicados.filter(c => !c.lido).length;

  const handleExpandir = async (comunicado) => {
    const estaExpandido = expandidos[comunicado.id];
    setExpandidos(prev => ({ ...prev, [comunicado.id]: !estaExpandido }));

    if (!estaExpandido && !comunicado.lido) {
      try {
        await api.post(`/paciente/comunicado/${comunicado.id}/lido`);
        setComunicados(prev => prev.map(c => c.id === comunicado.id ? { ...c, lido: true } : c));
      } catch (err) {
        console.error('Erro ao marcar como lido', err);
      }
    }
  };

  return (
    <PacienteLayout>
      {/* ── Cabeçalho verde padrão do portal do paciente ── */}
      <header className="bg-primary pt-12 pb-6 px-6">
        <h1 className="text-on-primary text-2xl font-extrabold flex items-center gap-2">
          Comunicados 
          {unreadCount > 0 && <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full">({unreadCount} novos)</span>}
        </h1>
        <p className="text-white/70 text-sm mt-1">Avisos da sua unidade de saúde</p>
      </header>

      <main className="px-6 py-6 space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-surface-container-low rounded-2xl animate-pulse" />
          ))
        ) : comunicados.length > 0 ? (
          comunicados.map(c => (
            <div 
              key={c.id} 
              onClick={() => handleExpandir(c)}
              className={`rounded-2xl border p-5 cursor-pointer transition-colors ${
                c.lido ? 'bg-surface-container-lowest border-surface-variant' : 'bg-blue-50 border-blue-200 shadow-sm'
              }`}
            >
              <div className="flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.tipo === 'individual' ? 'bg-purple-100 text-purple-700' : 'bg-primary/10 text-primary'}`}>
                  <span className="material-symbols-outlined text-xl">
                    {c.tipo === 'individual' ? 'person' : 'campaign'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className={`font-bold leading-tight ${c.lido ? 'text-on-background' : 'text-blue-900'}`}>{c.titulo}</h3>
                    <div className="flex gap-1 flex-shrink-0">
                      {c.tipo === 'individual' && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">Para você</span>
                      )}
                      {!c.lido && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-600 text-white">Novo</span>
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-sm leading-relaxed ${c.lido ? 'text-on-surface-variant' : 'text-blue-800'} ${expandidos[c.id] ? '' : 'line-clamp-2'}`}>
                    {c.mensagem}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <p className={`text-xs font-medium ${c.lido ? 'text-on-surface-variant' : 'text-blue-600'}`}>
                      {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                    <span className={`material-symbols-outlined text-sm ${c.lido ? 'text-on-surface-variant' : 'text-blue-600'}`}>
                      {expandidos[c.id] ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-5xl block mb-4 opacity-30">campaign</span>
            Nenhum comunicado no momento.
          </div>
        )}
      </main>
    </PacienteLayout>
  );
}
