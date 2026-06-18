/**
 * PÁGINA: TransporteGestor.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Controla as viagens e frotas de transporte sanitário de pacientes.
 * API: GET /api/gestor/transporte
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import GestorLayout from '../../components/gestor/GestorLayout';
import api from '../../services/api';

const STATUS_CORES = {
  AGENDADO: 'bg-amber-100 text-amber-800',
  EM_TRANSITO: 'bg-blue-100 text-blue-800',
  CONCLUIDO: 'bg-emerald-100 text-emerald-800',
  FALTOU: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  AGENDADO:     'Agendado',
  EM_TRANSITO:  'Em trânsito',
  CONCLUIDO:    'Concluído',
  FALTOU:       'Paciente faltou',
};

export default function TransporteGestor() {
  const [viagens, setViagens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransportes();
  }, []);

  const fetchTransportes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/gestor/transporte');
      setViagens(data);
    } catch (err) {
      console.error('[TransporteGestor]', err);
      toast.error('Não foi possível carregar as viagens. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestorLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-background">Transporte Sanitário</h1>
          <p className="text-on-surface-variant mt-1">Gestão de frotas e pacientes em trânsito para exames externos.</p>
        </div>
        <button
          onClick={() => toast.info('Agendamento de transporte disponível na Fase 2.')}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined">directions_bus</span>
          Agendar Transporte
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-1 lg:col-span-3 text-center py-12 text-on-surface-variant">Carregando viagens...</div>
        ) : viagens.length === 0 ? (
          <div className="col-span-1 lg:col-span-3 text-center py-12 text-on-surface-variant">Nenhuma viagem agendada.</div>
        ) : (
          viagens.map((viagem) => (
            <div key={viagem.id} className="bg-surface-container-lowest border border-surface-variant rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_CORES[viagem.status]}`}>
                  {STATUS_LABELS[viagem.status] || viagem.status}
                </span>
                <span className="text-sm font-bold text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">schedule</span>
                  {viagem.horario_saida.substring(0, 5)}
                </span>
              </div>
              
              <h3 className="font-bold text-lg text-on-background mb-1">{viagem.paciente_nome}</h3>
              <p className="text-sm text-on-surface-variant mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                {viagem.destino}
              </p>

              <div className="bg-surface-container p-3 rounded-2xl flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Veículo:</span>
                  <span className="font-bold text-on-background">{viagem.veiculo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Data:</span>
                  <span className="font-bold text-on-background">{new Date(viagem.data_viagem).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {viagem.necessita_acompanhante && (
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-lg font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">group</span> Acompanhante
                  </span>
                )}
                {viagem.cadeirante && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-lg font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">accessible</span> Acessível
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </GestorLayout>
  );
}
