/**
 * PÁGINA: PerfilPaciente.jsx (Portal do Paciente)
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Exibe as informações cadastrais e o prontuário de dados clínicos
 *         do paciente autenticado em modo somente leitura (MVP).
 *         Organizado em blocos visuais responsivos e elegantes (Mobile-First).
 *
 * API: GET /api/paciente/perfil
 * LAYOUT: PacienteLayout (design premium)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PacienteLayout from '../../components/paciente/PacienteLayout';

export default function PerfilPaciente() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  // Aplica máscara parcial ao CPF do paciente: "123.456.789-10" → "***.***.789-10"
  // Mantém os últimos 5 dígitos visíveis para fácil conferência pelo paciente.
  const mascaraCPF = (cpf) => {
    if (!cpf) return '—';
    const nums = cpf.replace(/\D/g, ''); // remove pontuação
    if (nums.length !== 11) return cpf;  // caso o CPF possua tamanho inesperado, exibe sem mascarar
    return `***.***.${nums.substring(6, 9)}-${nums.substring(9, 11)}`;
  };

  // Exibe o valor em formato legível ou um placeholder cinza e em itálico "Não informado"
  // caso o dado clínico esteja ausente.
  const valorOuPlaceholder = (valor) => {
    if (!valor || valor === '—') {
      return <span className="text-on-surface-variant/50 italic text-xs">Não informado</span>;
    }
    return <span className="font-medium text-on-surface text-sm whitespace-pre-wrap">{valor}</span>;
  };

  // Calcula o Índice de Massa Corporal (IMC) e retorna o valor numérico com sua respectiva classificação.
  // Destinado apenas a contexto informativo do paciente.
  const calcularIMC = (peso, altura) => {
    if (!peso || !altura || peso === '—' || altura === '—') return null;
    const pesoNum = parseFloat(peso);
    const alturaNum = parseFloat(altura);
    
    // Tratamento de segurança contra valores inválidos ou divisões por zero
    if (isNaN(pesoNum) || isNaN(alturaNum) || alturaNum <= 0) return null;
    
    const alturaM = alturaNum / 100;
    const imc = (pesoNum / (alturaM * alturaM)).toFixed(1);
    const classificacao =
      imc < 18.5 ? 'Abaixo do peso' :
      imc < 25   ? 'Peso normal' :
      imc < 30   ? 'Sobrepeso' : 'Obesidade';
    return { imc, classificacao };
  };

  const carregarPerfil = () => {
    setLoading(true);
    setErro(false);
    api.get('/paciente/perfil')
      .then(r => setPerfil(r.data))
      .catch(() => {
        setErro(true);
        toast.error('Erro ao carregar dados do perfil.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarPerfil();
  }, []);

  // Formata data do formato AAAA-MM-DD para DD/MM/AAAA sem desvios de fuso horário
  const formatarDataBR = (dataString) => {
    if (!dataString) return '—';
    const datePart = dataString.split('T')[0];
    const partes = datePart.split('-');
    if (partes.length !== 3) return dataString;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <PacienteLayout>
      {/* ── Cabeçalho verde premium ── */}
      <header className="bg-primary pt-12 pb-6 px-6">
        <h1 className="text-on-primary text-2xl font-extrabold">Meu Perfil</h1>
        <p className="text-white/70 text-sm mt-1">Dados pessoais e prontuário de saúde</p>
      </header>

      <main className="px-6 py-6 space-y-6">
        {loading ? (
          // Skeleton loader
          <div className="space-y-6 animate-pulse">
            <div className="bg-surface-container-low h-48 rounded-3xl" />
            <div className="bg-surface-container-low h-64 rounded-3xl" />
          </div>
        ) : erro ? (
          // Estado de erro com botão de recarregar
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <span className="material-symbols-outlined text-5xl text-red-400">wifi_off</span>
            <p className="text-on-surface-variant text-center text-sm font-medium">
              Não foi possível carregar o perfil.<br />Verifique sua conexão e tente novamente.
            </p>
            <button
              onClick={carregarPerfil}
              className="bg-primary text-on-primary px-6 py-2 rounded-full text-sm font-bold"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            {/* ── Bloco 1: Dados Pessoais ── */}
            <section className="bg-surface-container-lowest rounded-3xl border border-surface-variant p-6 space-y-5 shadow-sm">
              <div className="flex items-center gap-3 border-b border-surface-variant pb-3 text-primary">
                <span className="material-symbols-outlined text-2xl">badge</span>
                <h2 className="text-lg font-extrabold text-on-surface">Dados Pessoais</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nome Completo</label>
                  <p className="font-semibold text-on-surface mt-0.5 text-sm">{perfil.nome}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">CRA (Cadastro Regulação)</label>
                  <p className="font-semibold text-on-surface mt-0.5 text-sm">{perfil.cra}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Data de Nascimento</label>
                  <p className="font-semibold text-on-surface mt-0.5 text-sm">{formatarDataBR(perfil.data_nascimento)}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">CPF</label>
                  <p className="font-semibold text-on-surface mt-0.5 text-sm font-mono tracking-wider">{mascaraCPF(perfil.cpf)}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Telefone</label>
                  <p className="font-semibold text-on-surface mt-0.5 text-sm">{perfil.telefone}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">E-mail</label>
                  <p className="font-semibold text-on-surface mt-0.5 text-sm">{perfil.email}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Bairro de Residência</label>
                  <p className="font-semibold text-on-surface mt-0.5 text-sm">{perfil.ubs_bairro}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">UBS de Referência</label>
                  <p className="font-bold text-primary mt-0.5 text-sm">{perfil.ubs_nome}</p>
                </div>
              </div>
            </section>

            {/* ── Bloco 2: Informações de Saúde (Ficha Clínica) ── */}
            <section className="bg-surface-container-lowest rounded-3xl border border-surface-variant p-6 space-y-5 shadow-sm">
              <div className="flex items-center gap-3 border-b border-surface-variant pb-3 text-red-500">
                <span className="material-symbols-outlined text-2xl">clinical_notes</span>
                <h2 className="text-lg font-extrabold text-on-surface">Informações de Saúde</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50/50 dark:bg-red-950/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <label className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">Tipo Sanguíneo</label>
                  <p className="font-extrabold text-red-600 dark:text-red-400 mt-1 text-base">{perfil.tipo_sanguineo}</p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                  <label className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Peso (kg)</label>
                  <p className="font-extrabold text-blue-600 dark:text-blue-400 mt-1 text-base">
                    {perfil.peso_kg !== '—' ? `${perfil.peso_kg} kg` : '—'}
                  </p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                  <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Altura (cm)</label>
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 text-base">
                    {perfil.altura_cm !== '—' ? `${perfil.altura_cm} cm` : '—'}
                  </p>
                </div>
                {/* Card de IMC - Calculado e exibido de forma informativa se ambos peso e altura existirem */}
                {calcularIMC(perfil.peso_kg, perfil.altura_cm) && (() => {
                  const { imc, classificacao } = calcularIMC(perfil.peso_kg, perfil.altura_cm);
                  return (
                    <div className="bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                      <label className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">IMC</label>
                      <p className="font-extrabold text-amber-600 dark:text-amber-400 mt-1 text-base">{imc}</p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5 font-medium">{classificacao}</p>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-4 pt-2">
                <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-variant">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 text-amber-600">
                    <span className="material-symbols-outlined text-sm">warning</span> Alergias
                  </label>
                  <div className="mt-1">{valorOuPlaceholder(perfil.alergias)}</div>
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-variant">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 text-primary">
                    <span className="material-symbols-outlined text-sm">coronavirus</span> Comorbidades
                  </label>
                  <div className="mt-1">{valorOuPlaceholder(perfil.comorbidades)}</div>
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-variant">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                    <span className="material-symbols-outlined text-sm">medication</span> Medicamentos de Uso Contínuo
                  </label>
                  <div className="mt-1">{valorOuPlaceholder(perfil.medicamentos_uso_continuo)}</div>
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-variant">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">description</span> Observações Clínicas
                  </label>
                  <div className="mt-1">{valorOuPlaceholder(perfil.observacoes_clinicas)}</div>
                </div>
              </div>
            </section>

            {/* ── Ação: Solicitar correção de dados ── */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3 shadow-sm">
              <span className="material-symbols-outlined text-amber-600 text-xl flex-shrink-0 mt-0.5">info</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800">Dados incorretos ou desatualizados?</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Seus dados cadastrais e prontuário de saúde são gerenciados pela equipe da UBS.
                  Agende um atendimento presencial com a gestão para solicitar eventuais correções.
                </p>
                <button
                  onClick={() => navigate('/paciente/agendamentos')}
                  className="mt-3 text-sm font-bold text-amber-800 border border-amber-400 px-4 py-1.5 rounded-xl hover:bg-amber-100 transition-colors bg-white/50"
                >
                  Agendar atendimento
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </PacienteLayout>
  );
}
