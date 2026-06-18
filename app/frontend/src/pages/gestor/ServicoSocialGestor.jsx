/**
 * PÁGINA: ServicoSocialGestor.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Acompanhamento de famílias e pacientes sob vulnerabilidade social.
 * API: GET /api/gestor/servico-social
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import GestorLayout from '../../components/gestor/GestorLayout';
import api from '../../services/api';

const VULNERABILIDADE_CORES = {
  FOME: 'bg-red-100 text-red-800 border-red-200',
  VIOLENCIA_DOMESTICA: 'bg-red-100 text-red-800 border-red-200',
  ABANDONO_TRATAMENTO: 'bg-amber-100 text-amber-800 border-amber-200',
  HIGIENE: 'bg-blue-100 text-blue-800 border-blue-200',
};

const VULNERABILIDADE_LABELS = {
  FOME:                'Insegurança Alimentar',
  VIOLENCIA_DOMESTICA: 'Violência Doméstica',
  ABANDONO_TRATAMENTO: 'Abandono de Tratamento',
  HIGIENE:             'Condições de Higiene',
};

const STATUS_LABELS = {
  EM_ACOMPANHAMENTO: 'Em Acompanhamento',
  ENCAMINHADO_CRAS: 'Encaminhado CRAS/CREAS',
  ALTA: 'Alta Social',
};

export default function ServicoSocialGestor() {
  const navigate = useNavigate();
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCasos();
  }, []);

  const fetchCasos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/gestor/servico-social');
      setCasos(data);
    } catch (err) {
      console.error('[ServicoSocialGestor]', err);
      toast.error('Não foi possível carregar os casos sociais. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestorLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-background">Serviço Social</h1>
          <p className="text-on-surface-variant mt-1">Acompanhamento de vulnerabilidades e apoio CRAS/CREAS.</p>
        </div>
        <button
          onClick={() => toast.info('Triagem social disponível na Fase 2.')}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined">person_add</span>
          Nova Triagem
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-variant overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-lowest border-b border-surface-variant text-sm text-on-surface-variant">
              <tr>
                <th className="px-6 py-4 font-semibold">Paciente</th>
                <th className="px-6 py-4 font-semibold">Vulnerabilidade</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Ações/Relatório</th>
                <th className="px-6 py-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-on-surface-variant">
                    Carregando casos sociais...
                  </td>
                </tr>
              ) : casos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-on-surface-variant">
                    Nenhum caso social registrado.
                  </td>
                </tr>
              ) : (
                casos.map((caso) => (
                  <tr key={caso.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-background">{caso.paciente_nome}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        Resp: {caso.assistente_responsavel || 'Não atribuído'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${VULNERABILIDADE_CORES[caso.vulnerabilidade] || 'bg-gray-100 text-gray-800'}`}>
                        {VULNERABILIDADE_LABELS[caso.vulnerabilidade] || caso.vulnerabilidade}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-surface-container-high text-on-surface">
                        <div className={`w-2 h-2 rounded-full ${caso.status === 'ALTA' ? 'bg-emerald-500' : 'bg-primary'}`} />
                        {STATUS_LABELS[caso.status] || caso.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-on-surface-variant line-clamp-2 max-w-xs" title={caso.relatorio_acoes}>
                        {caso.relatorio_acoes}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate('/gestor/paciente/' + caso.paciente_id)}
                        className="text-primary hover:bg-primary/10 p-2 rounded-lg font-bold text-sm transition-colors"
                      >
                        Ver Relatório
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
