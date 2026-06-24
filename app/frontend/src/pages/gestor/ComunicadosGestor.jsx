// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: ComunicadosGestor
// FUNÇÃO: Publicação, exclusão e controle de comunicados internos na UBS.
//         Permite enviar mensagens gerais para todos os munícipes ou
//         direcionadas a pacientes específicos por meio do prontuário (CRA).
// DESIGN: Visual moderno e de alta fidelidade com cards tridimensionais,
//         círculos de categorias glassmorphic baseados em gradientes HSL,
//         badges translúcidos, botões interativos e modal rounded-[2rem]
//         com caixa de urgência vermelha HSL destacada.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import GestorLayout from '../../components/gestor/GestorLayout';

export default function ComunicadosGestor() {
  const location = useLocation();
  const [comunicados, setComunicados] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({ titulo: '', mensagem: '', tipo: 'geral', paciente_id: '', urgente: false, segmentacao_clinica: '' });

  // Carrega todos os comunicados ativos gerados pela gestão da UBS
  const carregarComunicados = () => {
    setLoading(true);
    api.get('/gestor/comunicados')
      .then(r => setComunicados(r.data))
      .catch((error) => {
        console.error('[ComunicadosGestor] Erro ao carregar comunicados:', error);
        toast.error('Erro ao carregar comunicados.');
      })
      .finally(() => setLoading(false));
  };

  // Carrega a listagem de pacientes para seleção no comunicado individual
  const carregarPacientes = () => {
    api.get('/gestor/pacientes')
      .then(r => setPacientes(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    carregarComunicados();
    carregarPacientes();
  }, []);

  // Abre o modal de novo comunicado pré-preenchido quando o gestor navega
  // a partir de um alerta gerado na Vigilância Epidemiológica
  useEffect(() => {
    if (location.state?.abrirModal) {
      setForm(prev => ({
        ...prev,
        titulo:   location.state.titulo   || '',
        mensagem: location.state.mensagem || '',
        urgente:  location.state.urgente  ?? false,
        tipo:     'geral',
      }));
      setModalAberto(true);
      // Limpa o state do histórico para evitar abertura repetida no recarregamento
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Salva o novo comunicado
  const handleSalvar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/gestor/comunicado', {
        ...form,
        paciente_id: form.tipo === 'individual' ? form.paciente_id : null,
        segmentacao_clinica: form.tipo === 'segmentado' ? form.segmentacao_clinica : null,
        urgente:     form.urgente,
      });
      toast.success('Comunicado publicado com sucesso!');
      setModalAberto(false);
      setForm({ titulo: '', mensagem: '', tipo: 'geral', paciente_id: '', urgente: false, segmentacao_clinica: '' });
      carregarComunicados();
    } catch (error) {
      console.error('[ComunicadosGestor] Erro ao salvar comunicado:', error);
      toast.error('Erro ao criar comunicado.');
    } finally {
      setEnviando(false);
    }
  };

  // Exclui um comunicado existente
  const handleExcluir = async (id) => {
    try {
      await api.delete(`/gestor/comunicado/${id}`);
      setComunicados(prev => prev.filter(c => c.id !== id));
      toast.success('Comunicado excluído.');
    } catch (error) {
      console.error('[ComunicadosGestor] Erro ao excluir comunicado:', error);
      toast.error('Erro ao excluir comunicado.');
    }
  };

  return (
    <GestorLayout>
      {/* ── CABEÇALHO E BOTÃO DE NOVO COMUNICADO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">
            Comunicados
          </h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm md:text-base">
            Publique avisos importantes, informes epidemiológicos ou orientações individuais.
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Novo Comunicado
        </button>
      </div>

      {/* ── LISTA DE COMUNICADOS ATIVOS ── */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-surface-container-low/50 rounded-3xl animate-pulse border border-surface-variant/20" />
          ))
        ) : comunicados.length > 0 ? (
          comunicados.map(c => {
            // Define estilos cromáticos específicos com base na urgência e no tipo de comunicado
            const isUrgente = c.urgente;
            const isIndividual = c.tipo === 'individual';

            return (
              <div
                key={c.id}
                className={`bg-surface-container-lowest rounded-3xl border p-5 md:p-6 flex justify-between items-start gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isUrgente
                    ? 'border-red-500/20 bg-gradient-to-br from-red-500/[0.01] to-red-500/[0.03]'
                    : 'border-surface-variant/45'
                }`}
              >
                <div className="flex gap-4 items-start flex-1 min-w-0">
                  {/* Ícone Circular Glassmorphic com Paleta HSL */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all ${
                      isUrgente
                        ? 'bg-red-500/10 text-red-700 border-red-500/20'
                        : isIndividual
                        ? 'bg-purple-500/10 text-purple-700 border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {isUrgente ? 'warning' : isIndividual ? 'person' : 'campaign'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="font-extrabold text-on-background text-base md:text-lg truncate">
                        {c.titulo}
                      </h3>

                      {/* Badge Translúcido de Tipo */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${
                          isIndividual
                            ? 'bg-purple-500/10 text-purple-800 border-purple-500/15'
                            : 'bg-blue-500/10 text-blue-800 border-blue-500/15'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isIndividual ? 'bg-purple-500' : 'bg-blue-500'}`} />
                        {isIndividual ? 'INDIVIDUAL' : 'GERAL'}
                      </span>

                      {/* Badge de Urgência Translúcido com Bolinha Pulsante */}
                      {isUrgente && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500/10 text-red-800 border border-red-500/15 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          URGENTE
                        </span>
                      )}
                    </div>

                    {/* Destinatário no Comunicado Individual */}
                    {isIndividual && c.paciente_nome && (
                      <p className="text-xs font-extrabold text-purple-800 flex items-center gap-1 mb-2">
                        <span className="material-symbols-outlined text-sm">badge</span>
                        Destinatário: {c.paciente_nome}
                      </p>
                    )}

                    {/* Corpo da Mensagem */}
                    <p className="text-on-surface-variant text-sm leading-relaxed font-medium">
                      {c.mensagem}
                    </p>

                    {/* Data de Criação */}
                    <p className="text-[11px] text-on-surface-variant/75 font-semibold mt-3 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">calendar_today</span>
                      Publicado em {new Date(c.criado_em).toLocaleDateString('pt-BR')} às {new Date(c.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Ação de Exclusão (Lixeira com Hover Vermelho Translúcido) */}
                <button
                  onClick={() => handleExcluir(c.id)}
                  title="Excluir comunicado"
                  className="w-10 h-10 rounded-xl hover:bg-red-500/10 text-on-surface-variant hover:text-red-700 flex items-center justify-center transition-all flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center text-on-surface-variant font-semibold bg-surface-container-lowest rounded-3xl border border-surface-variant/45 shadow-sm max-w-lg mx-auto">
            <span className="material-symbols-outlined text-on-surface-variant/50 text-5xl">notifications_off</span>
            <p className="mt-4 text-sm">Nenhum comunicado ativo no mural desta UBS.</p>
          </div>
        )}
      </div>

      {/* ── MODAL: CRIAR NOVO COMUNICADO ── */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-md transition-opacity"
            onClick={() => setModalAberto(false)}
          />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden border border-surface-variant/30 flex flex-col max-h-[90vh]">
            <header className="p-6 md:p-8 border-b border-surface-variant/40 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-on-background">Novo Comunicado</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Dispare informativos para os canais de pacientes.</p>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <form onSubmit={handleSalvar} className="p-6 md:p-8 space-y-5 overflow-y-auto flex-1">
              {/* Campo: Título */}
              <div className="space-y-2">
                <label className="text-sm font-extrabold text-on-surface-variant">Título do Alerta *</label>
                <input
                  required
                  name="titulo"
                  value={form.titulo}
                  onChange={handleInputChange}
                  placeholder="Ex: Campanha de Multivacinação no Sábado"
                  className="w-full h-12 px-4 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>

              {/* Campo: Tipo */}
              <div className="space-y-2">
                <label className="text-sm font-extrabold text-on-surface-variant">Abrangência do Comunicado *</label>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                >
                  <option value="geral">Geral — Visível para todos os pacientes da unidade</option>
                  <option value="individual">Individual — Direcionado a um paciente específico</option>
                  <option value="segmentado">Segmentado — Por perfil clínico (ex: Diabéticos)</option>
                </select>
              </div>

              {/* Seleção de Segmentação Clínica (Apenas para segmentado) */}
              {form.tipo === 'segmentado' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-sm font-extrabold text-on-surface-variant">Grupo Clínico *</label>
                  <select
                    required
                    name="segmentacao_clinica"
                    value={form.segmentacao_clinica || ''}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                  >
                    <option value="">Selecione um grupo clínico...</option>
                    <option value="Hipertensão">Pacientes com Hipertensão</option>
                    <option value="Diabetes">Pacientes com Diabetes</option>
                    <option value="Gestantes">Gestantes</option>
                    <option value="Asma">Pacientes com Asma</option>
                  </select>
                </div>
              )}

              {/* Seleção de Paciente Destinatário (Apenas para individual) */}
              {form.tipo === 'individual' && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="text-sm font-extrabold text-on-surface-variant">Paciente Destinatário *</label>
                  <select
                    required
                    name="paciente_id"
                    value={form.paciente_id}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  >
                    <option value="">Selecione o paciente na base...</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} (CRA: {p.cra})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Seletor Estilizado de Urgência (Card HSL Vermelho Interativo) */}
              <div className="space-y-2">
                <span className="text-sm font-extrabold text-on-surface-variant block">Classificação de Urgência</span>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, urgente: !prev.urgente }))}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    form.urgente
                      ? 'border-red-400 bg-red-500/5'
                      : 'border-surface-variant bg-surface-container-high/50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      form.urgente ? 'bg-red-600 border-red-600 text-white' : 'border-on-surface-variant/45'
                    }`}
                  >
                    {form.urgente && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                  </div>
                  <div>
                    <p className={`text-sm font-extrabold ${form.urgente ? 'text-red-900' : 'text-on-surface'}`}>
                      {form.urgente ? 'Marcado como URGENTE' : 'Marcar como informativo regular'}
                    </p>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                      Comunicados urgentes aparecem em destaque vermelho no topo para os pacientes.
                    </p>
                  </div>
                </button>
              </div>

              {/* Campo: Mensagem */}
              <div className="space-y-2">
                <label className="text-sm font-extrabold text-on-surface-variant">Mensagem do Comunicado *</label>
                <textarea
                  required
                  name="mensagem"
                  rows={4}
                  value={form.mensagem}
                  onChange={handleInputChange}
                  placeholder="Escreva a orientação de forma clara, objetiva e sem jargões burocráticos..."
                  className="w-full px-4 py-3 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium resize-none focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>

              {/* Botões do Rodapé */}
              <div className="flex gap-3 pt-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 h-12 rounded-2xl border border-surface-variant font-bold text-sm hover:bg-surface-container-low active:scale-98 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 active:scale-98 transition-all"
                >
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
