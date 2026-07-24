// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA: AcessosPaciente
// FUNÇÃO: Exibe histórico de acessos a dados de um paciente específico.
//         Disponível apenas para perfil 'admin'.
//         Permite auditoria de quem visualizou dados sensíveis e quando.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

export default function AcessosPaciente() {
  const [termoBusca, setTermoBusca] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: '',
  });

  // Evita buscas genéricas em massa; o admin precisa informar pelo menos
  // parte do nome ou o CRA para localizar um paciente específico.
  const buscaHabilitada = termoBusca.trim().length >= 2;

  async function buscarPacientes(event) {
    event?.preventDefault();

    if (!buscaHabilitada) {
      toast.error('Informe ao menos 2 caracteres do nome ou CRA.');
      return;
    }

    try {
      setLoadingBusca(true);
      const { data } = await api.get('/gestor/pacientes', {
        params: { busca: termoBusca.trim(), limite: 10, pagina: 1 },
      });
      setPacientes(data || []);
      if (!data?.length) {
        toast('Nenhum paciente encontrado para a busca informada.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível buscar pacientes.');
    } finally {
      setLoadingBusca(false);
    }
  }

  async function carregarAcessos(paciente = pacienteSelecionado, filtrosAtuais = filtros) {
    if (!paciente?.id) return;

    try {
      setLoadingLogs(true);
      const { data } = await api.get(`/audit/logs/paciente/${paciente.id}`, {
        params: filtrosAtuais,
      });
      setLogs(data.logs || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível carregar os acessos do paciente.');
    } finally {
      setLoadingLogs(false);
    }
  }

  function selecionarPaciente(paciente) {
    setPacienteSelecionado(paciente);
    setLogs([]);
    carregarAcessos(paciente, filtros);
  }

  async function aplicarFiltros(event) {
    event.preventDefault();

    if (!pacienteSelecionado?.id) {
      toast.error('Selecione um paciente antes de filtrar os acessos.');
      return;
    }

    await carregarAcessos(pacienteSelecionado, filtros);
  }

  // Converte a grade atual para CSV simples e abre em nova aba para download
  // ou inspeção rápida pelo superadmin sem depender de biblioteca externa.
  const csvAtual = useMemo(() => {
    const cabecalho = [
      'Data/Hora',
      'Gestor',
      'Perfil',
      'UBS',
      'IP de origem',
    ];

    const linhas = logs.map((log) => [
      formatarDataHora(log.created_at),
      log.usuario_nome || `ID ${log.usuario_id || '-'}`,
      log.usuario_perfil || '-',
      log.ubs_nome || '-',
      log.ip_origem || '-',
    ]);

    return [cabecalho, ...linhas]
      .map((colunas) => colunas.map(escaparCsv).join(';'))
      .join('\n');
  }, [logs]);

  function exportarCsv() {
    if (!logs.length) {
      toast.error('Não há acessos carregados para exportar.');
      return;
    }

    const blob = new Blob(['\uFEFF' + csvAtual], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return (
    <section className="rounded-[2rem] border border-surface-variant/40 bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <header className="mb-6">
        <h2 className="text-xl font-extrabold text-on-background md:text-2xl">Acessos por Paciente</h2>
        <p className="mt-1 text-sm font-medium text-on-surface-variant">
          Consulte quais gestores visualizaram dados de um paciente específico, quando isso ocorreu e de qual IP partiu o acesso.
        </p>
      </header>

      <form
        onSubmit={buscarPacientes}
        className="mb-6 grid gap-4 rounded-3xl border border-surface-variant/30 bg-surface-container-low p-4 lg:grid-cols-[minmax(0,1fr)_180px]"
      >
        <CampoTexto
          label="Buscar paciente por nome ou CRA"
          placeholder="Ex.: Maria Silva ou 00123456"
          value={termoBusca}
          onChange={setTermoBusca}
        />
        <div className="flex items-end">
          <button
            type="submit"
            disabled={!buscaHabilitada || loadingBusca}
            className="h-12 w-full rounded-2xl bg-primary px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingBusca ? 'Buscando...' : 'Buscar paciente'}
          </button>
        </div>
      </form>

      <div className="mb-6 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-surface-variant/30 bg-surface-container-low p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-on-surface-variant">
              Resultados da busca
            </h3>
            <span className="text-xs font-bold text-on-surface-variant/80">
              {pacientes.length} encontrado(s)
            </span>
          </div>

          <div className="space-y-3">
            {pacientes.length > 0 ? (
              pacientes.map((paciente) => (
                <button
                  key={paciente.id}
                  type="button"
                  onClick={() => selecionarPaciente(paciente)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                    pacienteSelecionado?.id === paciente.id
                      ? 'border-primary/40 bg-primary/10 shadow-sm'
                      : 'border-surface-variant/25 bg-surface-container-high/60 hover:border-primary/20 hover:bg-surface-container-high'
                  }`}
                >
                  <p className="text-sm font-extrabold text-on-background">{paciente.nome}</p>
                  <p className="mt-1 text-xs font-mono text-on-surface-variant">CRA {paciente.cra || 'S/CRA'}</p>
                  <p className="mt-1 text-xs font-medium text-on-surface-variant">{paciente.ubs_nome || 'UBS não informada'}</p>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-surface-variant/35 px-4 py-5 text-sm font-medium text-on-surface-variant">
                Faça uma busca para selecionar um paciente e abrir o histórico de acessos.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-surface-variant/30 bg-surface-container-low p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-on-background">
                {pacienteSelecionado ? pacienteSelecionado.nome : 'Nenhum paciente selecionado'}
              </h3>
              <p className="mt-1 text-sm font-medium text-on-surface-variant">
                {pacienteSelecionado
                  ? `CRA ${pacienteSelecionado.cra || 'S/CRA'} • ${pacienteSelecionado.ubs_nome || 'UBS não informada'}`
                  : 'Selecione um paciente na busca ao lado para carregar os acessos.'}
              </p>
            </div>

            <button
              type="button"
              onClick={exportarCsv}
              disabled={!logs.length}
              className="rounded-2xl border border-surface-variant px-4 py-3 text-sm font-bold text-on-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              Exportar CSV
            </button>
          </div>

          <form onSubmit={aplicarFiltros} className="mt-5 grid gap-4 md:grid-cols-3">
            <CampoTexto
              label="Data início"
              type="date"
              value={filtros.data_inicio}
              onChange={(valor) => setFiltros((prev) => ({ ...prev, data_inicio: valor }))}
            />
            <CampoTexto
              label="Data fim"
              type="date"
              value={filtros.data_fim}
              onChange={(valor) => setFiltros((prev) => ({ ...prev, data_fim: valor }))}
            />
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!pacienteSelecionado?.id || loadingLogs}
                className="h-12 w-full rounded-2xl bg-surface-container-high px-4 text-sm font-bold text-on-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingLogs ? 'Filtrando...' : 'Aplicar período'}
              </button>
            </div>
          </form>

          <div className="mt-5 overflow-x-auto rounded-3xl border border-surface-variant/30">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead>
                <tr className="border-b border-surface-variant/35 bg-surface-container-low">
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Data/hora</th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Nome do gestor</th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Perfil</th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">UBS</th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">IP de origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/25">
                {loadingLogs ? (
                  Array.from({ length: 4 }, (_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td colSpan="5" className="px-5 py-5">
                        <div className="h-6 rounded-xl bg-surface-container-high" />
                      </td>
                    </tr>
                  ))
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container-low/40">
                      <td className="px-5 py-4 text-sm font-medium text-on-background">{formatarDataHora(log.created_at)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-on-background">{log.usuario_nome || `ID ${log.usuario_id || '-'}`}</td>
                      <td className="px-5 py-4 text-sm font-medium text-on-surface-variant capitalize">{log.usuario_perfil || '-'}</td>
                      <td className="px-5 py-4 text-sm font-medium text-on-surface-variant">{log.ubs_nome || '-'}</td>
                      <td className="px-5 py-4 text-xs font-mono text-on-surface-variant">{log.ip_origem || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-sm font-semibold text-on-surface-variant">
                      Nenhum acesso encontrado para os filtros informados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}

function formatarDataHora(valor) {
  if (!valor) return '-';
  return new Date(valor).toLocaleString('pt-BR');
}

function escaparCsv(valor) {
  const texto = String(valor ?? '');
  return `"${texto.replaceAll('"', '""')}"`;
}

function CampoTexto({ label, value, onChange, ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-extrabold text-on-surface-variant">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-surface-variant/30 bg-surface-container-high/70 px-4 text-sm font-medium text-on-background outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
        {...props}
      />
    </label>
  );
}
