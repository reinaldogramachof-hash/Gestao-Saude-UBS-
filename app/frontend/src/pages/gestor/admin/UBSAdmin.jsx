// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: UBSAdmin
// FUNÇÃO: Permite ao superadmin listar, criar, ativar e desativar UBSs do
//         piloto. O MVP usa tabela simples sem paginação porque o volume é
//         pequeno e o objetivo é onboarding administrativo rápido.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const FORM_INICIAL = {
  nome: '',
  endereco: '',
  bairro: '',
};

export default function UBSAdmin() {
  const [ubs, setUbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);

  const carregarUbs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/ubs');
      setUbs(data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível carregar as UBSs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUbs();
  }, []);

  const handleCriar = async (event) => {
    event.preventDefault();
    try {
      setSalvando(true);
      await api.post('/admin/ubs', form);
      toast.success('UBS cadastrada com sucesso.');
      setForm(FORM_INICIAL);
      setModalAberto(false);
      await carregarUbs();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível cadastrar a UBS.');
    } finally {
      setSalvando(false);
    }
  };

  const alternarStatus = async (unidade) => {
    const proximaAcao = unidade.ativa ? 'desativar' : 'ativar';
    const confirmou = window.confirm(
      unidade.ativa
        ? `Deseja desativar a UBS "${unidade.nome}"?`
        : `Deseja reativar a UBS "${unidade.nome}"?`
    );

    if (!confirmou) return;

    try {
      await api.patch(`/admin/ubs/${unidade.id}/${proximaAcao}`);
      toast.success(unidade.ativa ? 'UBS desativada.' : 'UBS reativada.');
      await carregarUbs();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível alterar o status da UBS.');
    }
  };

  return (
    <section className="rounded-[2rem] border border-surface-variant/40 bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-on-background md:text-2xl">UBSs do Piloto</h2>
          <p className="mt-1 text-sm font-medium text-on-surface-variant">
            Cadastro e controle operacional das unidades participantes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="inline-flex h-12 items-center gap-2 self-start rounded-2xl bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/30"
        >
          <span className="material-symbols-outlined text-xl">add_business</span>
          Nova UBS
        </button>
      </header>

      <div className="overflow-x-auto rounded-3xl border border-surface-variant/30">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-variant/35">
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Nome</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Bairro</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Endereço</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Status</th>
              <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant/25">
            {loading ? (
              Array.from({ length: 4 }, (_, index) => (
                <tr key={index} className="animate-pulse">
                  <td colSpan="5" className="px-5 py-5">
                    <div className="h-6 rounded-xl bg-surface-container-high" />
                  </td>
                </tr>
              ))
            ) : ubs.length > 0 ? (
              ubs.map((unidade) => (
                <tr key={unidade.id} className="hover:bg-surface-container-low/40">
                  <td className="px-5 py-4 font-bold text-on-background">{unidade.nome}</td>
                  <td className="px-5 py-4 text-sm font-medium text-on-surface-variant">{unidade.bairro}</td>
                  <td className="px-5 py-4 text-sm font-medium text-on-surface-variant">{unidade.endereco}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ${
                      unidade.ativa
                        ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-700 border border-red-500/20'
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${unidade.ativa ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {unidade.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => alternarStatus(unidade)}
                      className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all ${
                        unidade.ativa
                          ? 'bg-red-500/10 text-red-700 hover:bg-red-500/15'
                          : 'bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/15'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {unidade.ativa ? 'toggle_off' : 'toggle_on'}
                      </span>
                      {unidade.ativa ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-5 py-12 text-center text-sm font-semibold text-on-surface-variant">
                  Nenhuma UBS cadastrada até o momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <ModalShell
          title="Nova UBS"
          subtitle="Cadastre a unidade participante do piloto."
          onClose={() => setModalAberto(false)}
        >
          <form onSubmit={handleCriar} className="space-y-4">
            <CampoTexto
              label="Nome oficial"
              value={form.nome}
              onChange={(value) => setForm((prev) => ({ ...prev, nome: value }))}
              placeholder="Ex: UBS Centro"
              required
            />
            <CampoTexto
              label="Endereço"
              value={form.endereco}
              onChange={(value) => setForm((prev) => ({ ...prev, endereco: value }))}
              placeholder="Rua, número e complemento"
              required
            />
            <CampoTexto
              label="Bairro"
              value={form.bairro}
              onChange={(value) => setForm((prev) => ({ ...prev, bairro: value }))}
              placeholder="Ex: Jardim Paulista"
              required
            />
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="flex-1 rounded-2xl border border-surface-variant px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {salvando ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </section>
  );
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

function ModalShell({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-[2rem] border border-surface-variant/30 bg-surface-container-lowest p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-on-background">{title}</h3>
            <p className="mt-1 text-sm font-medium text-on-surface-variant">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
