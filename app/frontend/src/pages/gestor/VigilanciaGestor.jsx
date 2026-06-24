// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: VigilanciaGestor
// FUNÇÃO: Monitoramento epidemiológico de agravos e doenças compulsórias
//         no território da Unidade Básica de Saúde.
//         Permite registrar suspeitas, confirmar ou descartar agravos,
//         acompanhar indicadores locais em tempo real e disparar alertas
//         de saúde urgentes integrados ao mural da UBS.
// DESIGN: Visual de alta fidelidade com painel estatístico HSL glassmorphic trilateral,
//         tabela de notificações com badges translúcidas e status ativos,
//         chips de ação modernos e modal rounded-[2rem] com desfoque de fundo.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import GestorLayout from '../../components/gestor/GestorLayout';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

// Mapeamento cromático para os badges translúcidos de status de investigação
const STATUS_ESTILO = {
  SUSPEITO:   'bg-amber-500/10 text-amber-850 border border-amber-500/20',
  CONFIRMADO: 'bg-red-500/10 text-red-850 border border-red-500/20',
  DESCARTADO: 'bg-emerald-500/10 text-emerald-850 border border-emerald-500/20',
};

const STATUS_LABELS = {
  SUSPEITO:   'Em Investigação',
  CONFIRMADO: 'Confirmado',
  DESCARTADO: 'Descartado',
};

export default function VigilanciaGestor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMedico = user?.perfil === 'medico';
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados do modal de criação
  const [modalNovaAberto, setModalNovaAberto] = useState(false);
  const [criando, setCriando] = useState(false);
  const [formVigilancia, setFormVigilancia] = useState({
    agravo:      '',
    bairro:      '',
    cep:         '',
    paciente_id: '',
  });

  // Lista de pacientes para vínculo opcional
  const [pacientes, setPacientes] = useState([]);

  // Carrega as notificações e a lista de pacientes no início
  useEffect(() => {
    fetchNotificacoes();
    api.get('/gestor/pacientes')
      .then(r => setPacientes(r.data))
      .catch(() => {});
  }, []);

  // Busca o painel epidemiológico do backend
  const fetchNotificacoes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/gestor/vigilancia');
      setNotificacoes(data);
    } catch (err) {
      console.error('[VigilanciaGestor] Erro ao buscar notificações:', err);
      toast.error('Não foi possível carregar as notificações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Registra uma nova notificação epidemiológica local
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

  // Altera o status da investigação (SUSPEITO → CONFIRMADO / DESCARTADO)
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

  // Direciona o gestor para a criação de comunicados com dados pré-preenchidos via router state
  // O gestor poderá revisar e editar o texto antes da publicação
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
      {/* ── CABEÇALHO E AÇÃO DE CRIAÇÃO ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">
            Vigilância Epidemiológica
          </h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm md:text-base">
            Monitoramento tático de agravos no território e disparos de segurança pública.
          </p>
        </div>
        {!isMedico && (
          <button
            onClick={() => setModalNovaAberto(true)}
            className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
          >
            <span className="material-symbols-outlined text-xl">coronavirus</span>
            Nova Notificação
          </button>
        )}
      </div>

      {/* ── PAINEL EPIDEMIOLÓGICO TRILATERAL HSL GLASSMORPHIC ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {/* Card: Casos Confirmados */}
        <div className="bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/15 rounded-3xl p-6 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-650 flex-shrink-0 relative">
            <span className="w-2 h-2 rounded-full bg-red-650 absolute top-1 right-1 animate-pulse" />
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <div>
            <div className="text-3xl font-black text-red-950 tracking-tight">
              {notificacoes.filter(n => n.status_investigacao === 'CONFIRMADO').length}
            </div>
            <div className="text-xs font-extrabold text-red-800 uppercase tracking-wider">Confirmados</div>
          </div>
        </div>

        {/* Card: Em Investigação */}
        <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border border-amber-500/15 rounded-3xl p-6 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-700 flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">search</span>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-950 tracking-tight">
              {notificacoes.filter(n => n.status_investigacao === 'SUSPEITO').length}
            </div>
            <div className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">Em Investigação</div>
          </div>
        </div>

        {/* Card: Casos Descartados */}
        <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/15 rounded-3xl p-6 flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-750 flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-950 tracking-tight">
              {notificacoes.filter(n => n.status_investigacao === 'DESCARTADO').length}
            </div>
            <div className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Descartados</div>
          </div>
        </div>
      </div>

      {/* ── TABELA EPIDEMIOLÓGICA DE NOTIFICAÇÕES ── */}
      <div className="bg-surface-container-lowest rounded-3xl border border-surface-variant/45 shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-surface-variant/40 bg-surface-container-low/50">
          <h2 className="font-extrabold text-on-background text-base md:text-lg">Focos Epidemiológicos e Alertas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[840px]">
            <thead>
              <tr className="bg-surface-container-low/35 border-b border-surface-variant/40">
                <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Agravo / Doença</th>
                <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Bairro (Foco)</th>
                <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Data Notificação</th>
                <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                {!isMedico && <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/30">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-on-surface-variant font-semibold text-sm animate-pulse">
                    Carregando mapa epidemiológico...
                  </td>
                </tr>
              ) : notificacoes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-on-surface-variant font-semibold text-sm">
                    Nenhum foco epidemiológico ativo no território desta UBS.
                  </td>
                </tr>
              ) : (
                notificacoes.map((notificacao) => {
                  const status = notificacao.status_investigacao;
                  const estiloBadge = STATUS_ESTILO[status] || 'bg-surface-variant/10 text-on-surface border border-surface-variant/20';
                  const label = STATUS_LABELS[status] || status;

                  return (
                    <tr key={notificacao.id} className="hover:bg-surface-container-low/40 transition-colors">
                      {/* Agravo / Doença */}
                      <td className="px-6 py-5">
                        <div className="font-extrabold text-on-background text-base">{notificacao.agravo}</div>
                        <div className="text-xs text-on-surface-variant/80 font-semibold mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">badge</span>
                          Paciente: {notificacao.paciente_nome || <span className="text-on-surface-variant/50 italic font-normal">Surto territorial / Ignorado</span>}
                        </div>
                      </td>

                      {/* Bairro Foco */}
                      <td className="px-6 py-5">
                        <div className="font-bold text-on-background flex items-center gap-1 text-sm">
                          <span className="material-symbols-outlined text-base text-primary">location_on</span>
                          {notificacao.bairro}
                        </div>
                        {notificacao.cep && (
                          <div className="text-xs text-on-surface-variant/75 font-semibold mt-0.5 ml-5">
                            CEP: {notificacao.cep}
                          </div>
                        )}
                      </td>

                      {/* Data de Registro */}
                      <td className="px-6 py-5 text-sm text-on-surface-variant font-semibold">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-base text-on-surface-variant/60">schedule</span>
                          {new Date(notificacao.data_notificacao).toLocaleDateString('pt-BR')}
                        </div>
                      </td>

                      {/* Badge Translúcido com Bolinha Indicadora */}
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${estiloBadge}`}>
                          <span className={`w-2 h-2 rounded-full ${
                            status === 'CONFIRMADO' ? 'bg-red-500' : status === 'SUSPEITO' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                          }`} />
                          {label}
                        </span>
                      </td>

                      {/* Ações em Chips Translúcidos */}
                      {!isMedico && (
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {/* Confirmar e Descartar (Surge apenas para SUSPEITO) */}
                          {status === 'SUSPEITO' && (
                            <>
                              <button
                                onClick={() => handleStatusVigilancia(notificacao, 'CONFIRMADO')}
                                className="h-9 px-3.5 bg-red-500/10 text-red-800 border border-red-500/15 font-bold text-xs rounded-xl hover:bg-red-500/15 transition-all"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => handleStatusVigilancia(notificacao, 'DESCARTADO')}
                                className="h-9 px-3.5 bg-emerald-500/10 text-emerald-800 border border-emerald-500/15 font-bold text-xs rounded-xl hover:bg-emerald-500/15 transition-all"
                              >
                                Descartar
                              </button>
                            </>
                          )}

                          {/* Gerar Alerta (Disponível apenas para Casos CONFIRMADOS) */}
                          {status === 'CONFIRMADO' && (
                            <button
                              onClick={() => handleGerarAlerta(notificacao)}
                              className="h-9 px-4 bg-amber-500/10 text-amber-900 border border-amber-500/15 font-bold text-xs rounded-xl hover:bg-amber-500/15 transition-all flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-sm">campaign</span>
                              Gerar Alerta
                            </button>
                          )}
                        </div>
                      </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: REGISTRAR NOVA NOTIFICAÇÃO EPIDEMIOLÓGICA ── */}
      {modalNovaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-md transition-opacity"
            onClick={() => setModalNovaAberto(false)}
          />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden border border-surface-variant/30 flex flex-col max-h-[90vh]">
            <header className="p-6 border-b border-surface-variant/40 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-on-background">Nova Notificação</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Registro local — comunique as autoridades sanitárias do SUS.</p>
              </div>
              <button
                onClick={() => setModalNovaAberto(false)}
                className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </header>

            <form onSubmit={handleCriarNotificacao} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Campo: Agravo */}
              <div className="space-y-2">
                <label className="text-sm font-extrabold text-on-surface-variant">Agravo / Patologia *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Dengue, Influenza A, COVID-19"
                  value={formVigilancia.agravo}
                  onChange={e => setFormVigilancia(prev => ({ ...prev, agravo: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>

              {/* Campo: Bairro */}
              <div className="space-y-2">
                <label className="text-sm font-extrabold text-on-surface-variant">Bairro (Foco Principal) *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Jardim Satélite"
                  value={formVigilancia.bairro}
                  onChange={e => setFormVigilancia(prev => ({ ...prev, bairro: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>

              {/* Campo: CEP */}
              <div className="space-y-2">
                <label className="text-sm font-extrabold text-on-surface-variant">
                  CEP <span className="font-normal text-on-surface-variant/65">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 12230-000"
                  value={formVigilancia.cep}
                  onChange={e => setFormVigilancia(prev => ({ ...prev, cep: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>

              {/* Caixa Destacada de Vínculo Clínico de Paciente */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
                <div className="flex gap-2 text-primary">
                  <span className="material-symbols-outlined text-xl">info</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">Vínculo Epidemiológico</h4>
                    <p className="text-[11px] text-on-surface-variant font-semibold leading-relaxed mt-0.5">
                      Você pode registrar um surto territorial sem vincular um munícipe específico, ou selecionar o prontuário correspondente.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">Paciente Vinculado</label>
                  <select
                    value={formVigilancia.paciente_id}
                    onChange={e => setFormVigilancia(prev => ({ ...prev, paciente_id: e.target.value }))}
                    className="w-full h-11 px-3 bg-surface-container-lowest border border-surface-variant/30 rounded-xl outline-none font-semibold text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  >
                    <option value="">Foco Coletivo / Territorial (Sem paciente específico)</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} (CRA: {p.cra})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ações do Rodapé */}
              <div className="flex gap-3 pt-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setModalNovaAberto(false)}
                  className="flex-1 h-12 rounded-2xl border border-surface-variant font-bold text-sm hover:bg-surface-container-low active:scale-98 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criando}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 active:scale-98 transition-all"
                >
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
