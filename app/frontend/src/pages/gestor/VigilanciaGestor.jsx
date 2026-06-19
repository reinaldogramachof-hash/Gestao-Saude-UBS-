/**
 * PÁGINA: VigilanciaGestor.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Monitoramento epidemiológico de agravos e doenças compulsórias.
 * API: GET /api/gestor/vigilancia
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import GestorLayout from '../../components/gestor/GestorLayout';
import api from '../../services/api';

const STATUS_CORES = {
  SUSPEITO: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMADO: 'bg-red-100 text-red-800 border-red-200',
  DESCARTADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const STATUS_LABELS = {
  SUSPEITO:   'Em Investigação',
  CONFIRMADO: 'Confirmado',
  DESCARTADO: 'Descartado',
};

export default function VigilanciaGestor() {
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados do modal de nova notificação
  const [modalNovaAberto, setModalNovaAberto] = useState(false);
  const [criando, setCriando] = useState(false);
  const [formVigilancia, setFormVigilancia] = useState({
    agravo:      '',
    bairro:      '',
    cep:         '',
    paciente_id: '',
  });

  // Lista de pacientes para vincular opcionalmente (igual a RegulacaoGestor)
  const [pacientes, setPacientes] = useState([]);

  useEffect(() => {
    fetchNotificacoes();
    api.get('/gestor/pacientes').then(r => setPacientes(r.data)).catch(() => {});
  }, []);

  const fetchNotificacoes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/gestor/vigilancia');
      setNotificacoes(data);
    } catch (err) {
      console.error('[VigilanciaGestor]', err);
      toast.error('Não foi possível carregar as notificações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cria a notificação epidemiológica local
  const handleCriarNotificacao = async (e) => {
    e.preventDefault();
    setCriando(true);
    try {
      await api.post('/gestor/vigilancia', {
        ...formVigilancia,
        paciente_id: formVigilancia.paciente_id ? Number(formVigilancia.paciente_id) : null,
      });
      toast.success('Notificação registrada com sucesso. Lembre-se de notificar o SINAN se for compulsória.');
      setModalNovaAberto(false);
      setFormVigilancia({ agravo: '', bairro: '', cep: '', paciente_id: '' });
      fetchNotificacoes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao registrar notificação.');
    } finally {
      setCriando(false);
    }
  };

  // Alterna o status de investigação de uma notificação (SUSPEITO → CONFIRMADO → DESCARTADO)
  const handleStatusVigilancia = async (notificacao, novoStatus) => {
    try {
      await api.put(`/gestor/vigilancia/${notificacao.id}/status`, {
        status_investigacao: novoStatus,
      });
      toast.success(`Status da notificação de ${notificacao.agravo} atualizado.`);
      fetchNotificacoes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar status.');
    }
  };

  // Navega para a página de Comunicados com dados pré-preenchidos via router state.
  // O mesmo padrão do FAB de agendamentos (TASK_22).
  // O gestor revisa a mensagem antes de publicar — sem envio automático.
  const handleGerarAlerta = (notificacao) => {
    navigate('/gestor/comunicados', {
      state: {
        abrirModal:  true,
        titulo:      `Alerta: ${notificacao.agravo} em ${notificacao.bairro}`,
        mensagem:    `Atenção: identificamos casos de ${notificacao.agravo} no bairro ${notificacao.bairro}. Se você apresentar sintomas, procure nossa UBS imediatamente. Mantenha-se hidratado e evite acúmulo de água parada.`,
        urgente:     true,
      },
    });
  };

  return (
    <GestorLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-background">Vigilância Epidemiológica</h1>
          <p className="text-on-surface-variant mt-1">Monitoramento de surtos e doenças de notificação compulsória no território.</p>
        </div>
        <button
          onClick={() => setModalNovaAberto(true)}
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
                        {STATUS_LABELS[notificacao.status_investigacao] || notificacao.status_investigacao}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* Avançar investigação */}
                        {notificacao.status_investigacao === 'SUSPEITO' && (
                          <button
                            onClick={() => handleStatusVigilancia(notificacao, 'CONFIRMADO')}
                            className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Confirmar
                          </button>
                        )}
                        {notificacao.status_investigacao === 'SUSPEITO' && (
                          <button
                            onClick={() => handleStatusVigilancia(notificacao, 'DESCARTADO')}
                            className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            Descartar
                          </button>
                        )}
                        {/* Gerar alerta — só aparece para casos CONFIRMADOS */}
                        {notificacao.status_investigacao === 'CONFIRMADO' && (
                          <button
                            onClick={() => handleGerarAlerta(notificacao)}
                            className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">campaign</span>
                            Gerar Alerta
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* ── Modal: Nova Notificação de Vigilância ── */}
      {modalNovaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalNovaAberto(false)} />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-2xl">
            <header className="p-6 border-b border-surface-variant flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-on-background">Nova Notificação</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Registro interno — notifique o SINAN separadamente.</p>
              </div>
              <button onClick={() => setModalNovaAberto(false)} className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </header>
            <form onSubmit={handleCriarNotificacao} className="p-6 space-y-4">

              {/* Agravo */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Agravo / Doença *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Dengue, Tuberculose, COVID-19, Sarampo..."
                  value={formVigilancia.agravo}
                  onChange={e => setFormVigilancia(prev => ({ ...prev, agravo: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
                />
              </div>

              {/* Bairro */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Bairro (foco) *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Jardim Satélite, São Dimas..."
                  value={formVigilancia.bairro}
                  onChange={e => setFormVigilancia(prev => ({ ...prev, bairro: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
                />
              </div>

              {/* CEP (opcional) */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">CEP <span className="font-normal">(opcional)</span></label>
                <input
                  type="text"
                  placeholder="Ex: 12230-000"
                  value={formVigilancia.cep}
                  onChange={e => setFormVigilancia(prev => ({ ...prev, cep: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
                />
              </div>

              {/* Paciente (opcional) */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant">Paciente vinculado <span className="font-normal">(opcional)</span></label>
                <select
                  value={formVigilancia.paciente_id}
                  onChange={e => setFormVigilancia(prev => ({ ...prev, paciente_id: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium outline-none"
                >
                  <option value="">Surto territorial (sem paciente específico)</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalNovaAberto(false)} className="flex-1 h-12 rounded-2xl border border-outline font-bold text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={criando} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold text-sm disabled:opacity-50">
                  {criando ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GestorLayout>
  );
}
