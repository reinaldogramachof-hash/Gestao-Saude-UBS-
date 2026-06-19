/**
 * PÁGINA: Medicamentos.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Consulta de estoque de medicamentos da UBS do paciente.
 *         - Busca parcial por nome ou princípio ativo (debounce de 400ms)
 *         - Barra lateral colorida indica disponibilidade
 *         - Exibe data da última atualização do estoque
 *         - Trata estados de loading, erro e lista vazia
 *
 * API: GET /api/paciente/medicamentos?busca=termo
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import PacienteLayout from '../../components/paciente/PacienteLayout';

function formatarData(iso) {
  if (!iso) return null;
  const dateStr = iso.includes('T') ? iso : iso + 'T12:00:00';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Medicamentos() {
  const [meds, setMeds] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  
  // Controla se a lista deve exibir apenas medicamentos disponíveis no momento.
  const [soDisponiveis, setSoDisponiveis] = useState(false);

  // Carrega medicamentos com o termo de busca atual
  const carregar = useCallback((termo) => {
    setLoading(true);
    setErro(false);
    const params = termo.trim() ? `?busca=${encodeURIComponent(termo.trim())}` : '';
    api.get(`/paciente/medicamentos${params}`)
      .then(r => setMeds(r.data))
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  }, []);

  // Dispara busca na montagem e a cada mudança no campo de busca (debounce 400ms)
  useEffect(() => {
    const timer = setTimeout(() => carregar(busca), 400);
    return () => clearTimeout(timer);
  }, [busca, carregar]);

  // Aplica o filtro de disponibilidade localmente, permitindo resposta instantânea
  // sem gerar chamadas de rede redundantes para a API do backend.
  const medsFiltrados = soDisponiveis ? meds.filter(m => m.disponivel) : meds;

  return (
    <PacienteLayout>
      {/* ── Cabeçalho com campo de busca integrado ── */}
      <header className="bg-primary pt-12 pb-5 px-6">
        <h1 className="text-on-primary text-2xl font-extrabold">Consulta de Estoque</h1>
        <p className="text-white/70 text-sm mt-1 mb-4">Medicamentos disponíveis na sua UBS</p>
        {/* Campo de busca parcial por nome ou substância ativa */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-xl">search</span>
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou substância..."
            className="w-full h-11 bg-white/20 text-white placeholder-white/50 rounded-xl pl-10 pr-4 text-sm font-medium outline-none focus:bg-white/30 transition-colors"
          />
          {/* Botão para limpar a busca */}
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
        {/* Toggle: filtrar apenas medicamentos disponíveis */}
        <button
          onClick={() => setSoDisponiveis(v => !v)}
          className={`mt-4 flex items-center gap-2 text-xs font-bold transition-colors ${soDisponiveis ? 'text-white font-extrabold' : 'text-white/60 font-semibold'}`}
        >
          <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${soDisponiveis ? 'bg-white border-white' : 'border-white/50'}`}>
            {soDisponiveis && <span className="material-symbols-outlined text-primary text-sm font-black">check</span>}
          </span>
          Mostrar apenas disponíveis
        </button>
      </header>

      <main className="px-6 py-6 space-y-4 pb-28">
        {/* Estado: carregando */}
        {loading && Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-24 bg-surface-container-low rounded-2xl animate-pulse" />
        ))}

        {/* Estado: erro de rede */}
        {!loading && erro && (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <span className="material-symbols-outlined text-5xl text-red-400">error_outline</span>
            <p className="text-on-surface-variant font-medium">Não foi possível carregar os medicamentos.</p>
            <button onClick={() => carregar(busca)} className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm">
              Tentar novamente
            </button>
          </div>
        )}

        {/* Estado: sem resultados para a busca */}
        {!loading && !erro && medsFiltrados.length === 0 && (
          <div className="py-16 text-center text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-5xl block mb-4 opacity-30">medication</span>
            {busca
              ? `Nenhum resultado para "${busca}".`
              : soDisponiveis
              ? 'Nenhum medicamento disponível no momento.'
              : 'Nenhum medicamento cadastrado.'}
          </div>
        )}

        {/* Lista de medicamentos */}
        {!loading && !erro && medsFiltrados.map(m => (
          <div key={m.id} className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-variant relative overflow-hidden">
            {/* Barra lateral: verde = disponível, vermelha = em falta */}
            <div className={`absolute top-0 left-0 w-1.5 h-full ${m.disponivel ? 'bg-primary' : 'bg-red-500'}`} />
            <div className="pl-4">
              <h3 className="font-bold text-on-surface text-base leading-tight">{m.nome}</h3>
              {m.principio_ativo && (
                <p className="text-on-surface-variant text-xs mb-3">{m.principio_ativo}</p>
              )}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${m.disponivel ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {m.disponivel ? '✓ Disponível' : '✗ Falta temporária'}
                </span>
                {/* Data da última atualização do estoque — ajuda o paciente a confiar na informação */}
                {m.atualizado_em && (
                  <span className="text-xs text-on-surface-variant">
                    Atualizado em {formatarData(m.atualizado_em)}
                  </span>
                )}
              </div>
              
              {m.observacao && (
                <p className="text-xs text-on-surface-variant mt-2.5 italic leading-relaxed">{m.observacao}</p>
              )}

              {/* Bloco "Como retirar": visível apenas quando o gestor preencheu as instruções */}
              {m.instrucoes_retirada && (
                <div className="mt-3 flex items-start gap-2.5 bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <span className="material-symbols-outlined text-blue-600 text-sm flex-shrink-0 mt-0.5">info</span>
                  <div>
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-0.5">Como retirar</p>
                    <p className="text-xs text-blue-800 leading-relaxed">{m.instrucoes_retirada}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>
    </PacienteLayout>
  );
}
