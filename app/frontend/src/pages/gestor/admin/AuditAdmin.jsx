// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: AuditAdmin
// FUNÇÃO: Consulta a trilha de auditoria administrativa com filtros por UBS,
//         resultado e período. A paginação é simples via offset para manter o
//         contrato leve e compatível com o endpoint administrativo existente.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const LIMITE = 20;

export default function AuditAdmin() {
  const [logs, setLogs] = useState([]);
  const [ubs, setUbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filtros, setFiltros] = useState({
    ubs_id: '',
    resultado: '',
    data_inicio: '',
    data_fim: '',
  });

  const carregarUbs = async () => {
    try {
      const { data } = await api.get('/admin/ubs');
      setUbs(data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível carregar as UBSs.');
    }
  };

  const carregarLogs = async (novoOffset = offset) => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/audit/logs', {
        params: {
          ...filtros,
          offset: novoOffset,
          limit: LIMITE,
        },
      });
      setLogs(data.logs || []);
      setOffset(novoOffset);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível carregar os logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUbs();
  }, []);

  useEffect(() => {
    carregarLogs(0);
  }, []);

  const aplicarFiltros = async (event) => {
    event.preventDefault();
    await carregarLogs(0);
  };

  return (
    <section className="rounded-[2rem] border border-surface-variant/40 bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <header className="mb-6">
        <h2 className="text-xl font-extrabold text-on-background md:text-2xl">Logs de Auditoria</h2>
        <p className="mt-1 text-sm font-medium text-on-surface-variant">
          Acompanhamento de ações administrativas com filtros operacionais e paginação simples.
        </p>
      </header>

      <form
        onSubmit={aplicarFiltros}
        className="mb-6 grid gap-4 rounded-3xl border border-surface-variant/30 bg-surface-container-low p-4 md:grid-cols-2 xl:grid-cols-5"
      >
        <CampoSelect
          label="UBS"
          value={filtros.ubs_id}
          onChange={(value) => setFiltros((prev) => ({ ...prev, ubs_id: value }))}
          options={ubs.map((item) => ({ value: String(item.id), label: item.nome }))}
        />
        <CampoSelect
          label="Resultado"
          value={filtros.resultado}
          onChange={(value) => setFiltros((prev) => ({ ...prev, resultado: value }))}
          options={[
            { value: 'sucesso', label: 'Sucesso' },
            { value: 'falha', label: 'Falha' },
            { value: 'erro', label: 'Erro' },
          ]}
        />
        <CampoTexto
          label="Data início"
          type="date"
          value={filtros.data_inicio}
          onChange={(value) => setFiltros((prev) => ({ ...prev, data_inicio: value }))}
        />
        <CampoTexto
          label="Data fim"
          type="date"
          value={filtros.data_fim}
          onChange={(value) => setFiltros((prev) => ({ ...prev, data_fim: value }))}
        />
        <div className="flex items-end">
          <button
            type="submit"
            className="h-12 w-full rounded-2xl bg-primary px-4 text-sm font-bold text-white"
          >
            Filtrar logs
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-3xl border border-surface-variant/30">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-variant/35">
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Data/hora</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Usuário</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Ação</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Entidade</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Resultado</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant/25">
            {loading ? (
              Array.from({ length: 5 }, (_, index) => (
                <tr key={index} className="animate-pulse">
                  <td colSpan="6" className="px-5 py-5">
                    <div className="h-6 rounded-xl bg-surface-container-high" />
                  </td>
                </tr>
              ))
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-container-low/40">
                  <td className="px-5 py-4 text-sm font-medium text-on-background">
                    {formatarDataHora(log.created_at)}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-on-surface-variant">
                    {log.usuario_nome || `ID ${log.usuario_id || '-'}`}
                  </td>
                  <td className="px-5 py-4 text-xs font-extrabold text-on-background">{log.acao}</td>
                  <td className="px-5 py-4 text-xs font-bold text-on-surface-variant">{log.entidade}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
                      log.resultado === 'sucesso'
                        ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-700 border border-red-500/20'
                    }`}>
                      {log.resultado}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-on-surface-variant">{log.ip_origem || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-5 py-12 text-center text-sm font-semibold text-on-surface-variant">
                  Nenhum log encontrado para os filtros informados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => carregarLogs(Math.max(offset - LIMITE, 0))}
          disabled={offset === 0 || loading}
          className="rounded-2xl border border-surface-variant px-4 py-3 text-sm font-bold text-on-surface-variant disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-sm font-bold text-on-surface-variant">
          Página {(offset / LIMITE) + 1}
        </span>
        <button
          type="button"
          onClick={() => carregarLogs(offset + LIMITE)}
          disabled={loading || logs.length < LIMITE}
          className="rounded-2xl bg-surface-container-high px-4 py-3 text-sm font-bold text-on-background disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </section>
  );
}

function formatarDataHora(valor) {
  if (!valor) return '-';
  const data = new Date(valor);
  return data.toLocaleString('pt-BR');
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

function CampoSelect({ label, value, onChange, options }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-extrabold text-on-surface-variant">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-surface-variant/30 bg-surface-container-high/70 px-4 text-sm font-medium text-on-background outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
