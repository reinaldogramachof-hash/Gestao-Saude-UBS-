import React, { useState, useEffect } from 'react';
import GestorLayout from '../../components/gestor/GestorLayout';
import api from '../../services/api';

const PRIORIDADE_CORES = {
  VERMELHO: 'bg-red-100 text-red-800 border-red-200',
  AMARELO: 'bg-amber-100 text-amber-800 border-amber-200',
  VERDE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const STATUS_LABELS = {
  AGUARDANDO_VAGA: 'Aguardando Vaga',
  AGENDADO: 'Agendado',
  REALIZADO: 'Realizado',
  CANCELADO: 'Cancelado',
};

export default function RegulacaoGestor() {
  const [encaminhamentos, setEncaminhamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  useEffect(() => {
    fetchEncaminhamentos();
  }, []);

  const fetchEncaminhamentos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/gestor/encaminhamentos');
      setEncaminhamentos(data);
    } catch (err) {
      console.error('Erro ao buscar regulação:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = encaminhamentos.filter(enc => 
    filtroStatus === 'TODOS' || enc.status === filtroStatus
  );

  // Métrica de alertas
  const vencidos = encaminhamentos.filter(e => 
    e.status === 'AGUARDANDO_VAGA' && 
    ((e.prioridade === 'VERMELHO' && e.dias_na_fila > 2) || 
     (e.prioridade === 'AMARELO' && e.dias_na_fila > 15))
  ).length;

  return (
    <GestorLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-background">Regulação Externa</h1>
          <p className="text-on-surface-variant mt-1">Gerencie os encaminhamentos para CAPS, AMEs e Hospitais.</p>
        </div>
        <button
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined">post_add</span>
          Novo Encaminhamento
        </button>
      </div>

      {vencidos > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 shadow-sm animate-pulse">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-red-600">warning</span>
          </div>
          <div>
            <h3 className="font-bold text-red-800">Alerta de SLAs Vencidos</h3>
            <p className="text-sm text-red-700 mt-1">
              Existem {vencidos} pacientes prioritários aguardando vaga acima do tempo máximo aceitável. Contate a CROSS.
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-variant overflow-hidden mb-6">
        <div className="p-4 border-b border-surface-variant flex gap-2 overflow-x-auto no-scrollbar">
          {['TODOS', 'AGUARDANDO_VAGA', 'AGENDADO', 'REALIZADO'].map(status => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                filtroStatus === status
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {status === 'TODOS' ? 'Todos' : STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-lowest border-b border-surface-variant text-sm text-on-surface-variant">
              <tr>
                <th className="px-6 py-4 font-semibold">Paciente</th>
                <th className="px-6 py-4 font-semibold">Destino</th>
                <th className="px-6 py-4 font-semibold">Prioridade</th>
                <th className="px-6 py-4 font-semibold">Tempo na Fila</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-on-surface-variant">
                    Carregando encaminhamentos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-on-surface-variant">
                    Nenhum encaminhamento encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((enc) => {
                  const isCritico = enc.status === 'AGUARDANDO_VAGA' && 
                    ((enc.prioridade === 'VERMELHO' && enc.dias_na_fila > 2) || 
                     (enc.prioridade === 'AMARELO' && enc.dias_na_fila > 15));

                  return (
                    <tr key={enc.id} className={`hover:bg-surface-container-lowest transition-colors ${isCritico ? 'bg-red-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-on-background">{enc.paciente_nome}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">
                          Sol: {new Date(enc.data_solicitacao).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-on-background">{enc.destino}</div>
                        <div className="text-sm text-on-surface-variant">{enc.especialidade}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${PRIORIDADE_CORES[enc.prioridade]}`}>
                          {enc.prioridade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {enc.status === 'AGUARDANDO_VAGA' ? (
                          <div className={`font-bold ${isCritico ? 'text-red-600' : 'text-on-background'}`}>
                            {enc.dias_na_fila} dias
                          </div>
                        ) : (
                          <span className="text-on-surface-variant">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                          enc.status === 'AGUARDANDO_VAGA' ? 'bg-amber-100 text-amber-800' :
                          enc.status === 'AGENDADO' ? 'bg-blue-100 text-blue-800' :
                          enc.status === 'REALIZADO' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            enc.status === 'AGUARDANDO_VAGA' ? 'bg-amber-500 animate-pulse' :
                            enc.status === 'AGENDADO' ? 'bg-blue-500' :
                            enc.status === 'REALIZADO' ? 'bg-emerald-500' :
                            'bg-gray-500'
                          }`} />
                          {STATUS_LABELS[enc.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:bg-primary/10 p-2 rounded-lg font-bold text-sm transition-colors">
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </GestorLayout>
  );
}
