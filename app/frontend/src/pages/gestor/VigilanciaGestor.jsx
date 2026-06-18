import React, { useState, useEffect } from 'react';
import GestorLayout from '../../components/gestor/GestorLayout';
import api from '../../services/api';

const STATUS_CORES = {
  SUSPEITO: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMADO: 'bg-red-100 text-red-800 border-red-200',
  DESCARTADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function VigilanciaGestor() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificacoes();
  }, []);

  const fetchNotificacoes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/gestor/vigilancia');
      setNotificacoes(data);
    } catch (err) {
      console.error('Erro ao buscar vigilância:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestorLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-background">Vigilância Epidemiológica</h1>
          <p className="text-on-surface-variant mt-1">Monitoramento de surtos e doenças de notificação compulsória no território.</p>
        </div>
        <button
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined">coronavirus</span>
          Nova Notificação
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Painel Tático Simplificado */}
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
           <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600 text-3xl">warning</span>
           </div>
           <div>
              <div className="text-3xl font-extrabold text-red-700">
                {notificacoes.filter(n => n.status_investigacao === 'CONFIRMADO').length}
              </div>
              <div className="text-sm font-bold text-red-800 uppercase tracking-wider">Casos Confirmados</div>
           </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
           <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 text-3xl">search</span>
           </div>
           <div>
              <div className="text-3xl font-extrabold text-amber-700">
                {notificacoes.filter(n => n.status_investigacao === 'SUSPEITO').length}
              </div>
              <div className="text-sm font-bold text-amber-800 uppercase tracking-wider">Em Investigação</div>
           </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-variant overflow-hidden mb-6">
        <div className="p-5 border-b border-surface-variant bg-surface-container-low">
          <h2 className="font-bold text-on-background">Histórico de Notificações</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-lowest border-b border-surface-variant text-sm text-on-surface-variant">
              <tr>
                <th className="px-6 py-4 font-semibold">Agravo / Doença</th>
                <th className="px-6 py-4 font-semibold">Bairro (Foco)</th>
                <th className="px-6 py-4 font-semibold">Data Notificação</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-on-surface-variant">
                    Carregando mapa epidemiológico...
                  </td>
                </tr>
              ) : notificacoes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-on-surface-variant">
                    Nenhuma notificação registrada no território.
                  </td>
                </tr>
              ) : (
                notificacoes.map((notificacao) => (
                  <tr key={notificacao.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-background text-base">{notificacao.agravo}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        Paciente: {notificacao.paciente_nome || 'Anônimo/Ignorado'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-on-background flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">location_on</span>
                        {notificacao.bairro}
                      </div>
                      <div className="text-xs text-on-surface-variant ml-5">CEP: {notificacao.cep || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {new Date(notificacao.data_notificacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-bold border ${STATUS_CORES[notificacao.status_investigacao]}`}>
                        {notificacao.status_investigacao}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary hover:bg-primary/10 p-2 rounded-lg font-bold text-sm transition-colors">
                        Investigar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </GestorLayout>
  );
}
