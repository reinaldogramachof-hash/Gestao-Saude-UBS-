// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: GestoresAdmin
// FUNÇÃO: Gerencia o onboarding centralizado de gestores reais, exibindo a
//         senha temporária somente uma vez após criação ou reset, conforme a
//         regra operacional da task 4.8.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const FORM_INICIAL = {
  nome: '',
  email: '',
  perfil: 'gestor',
  ubs_id: '',
};

const PERFIS = [
  { id: 'recepcionista', label: 'Recepcionista' },
  { id: 'gestor', label: 'Gestor' },
  { id: 'medico', label: 'Médico' },
];

export default function GestoresAdmin() {
  const [gestores, setGestores] = useState([]);
  const [ubs, setUbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [gestoresResponse, ubsResponse] = await Promise.all([
        api.get('/admin/gestores'),
        api.get('/admin/ubs'),
      ]);

      setGestores(gestoresResponse.data);
      setUbs(ubsResponse.data.filter((item) => item.ativa));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível carregar os gestores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleCriar = async (event) => {
    event.preventDefault();
    try {
      setSalvando(true);
      const { data } = await api.post('/admin/gestores', {
        ...form,
        ubs_id: Number(form.ubs_id),
      });
      setSenhaVisivel({
        titulo: 'Senha inicial gerada',
        senha: data.senha_temporaria,
        nome: data.gestor?.nome || form.nome,
      });
      setForm(FORM_INICIAL);
      setModalAberto(false);
      toast.success('Gestor cadastrado com sucesso.');
      await carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível cadastrar o gestor.');
    } finally {
      setSalvando(false);
    }
  };

  const alternarStatus = async (gestor) => {
    const proximaAcao = gestor.ativo ? 'desativar' : 'ativar';
    const confirmou = window.confirm(
      gestor.ativo
        ? `Deseja desativar a conta de ${gestor.nome}?`
        : `Deseja reativar a conta de ${gestor.nome}?`
    );

    if (!confirmou) return;

    try {
      await api.patch(`/admin/gestores/${gestor.id}/${proximaAcao}`);
      toast.success(gestor.ativo ? 'Conta desativada.' : 'Conta reativada.');
      await carregarDados();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível alterar o status do gestor.');
    }
  };

  const resetarSenha = async (gestor) => {
    const confirmou = window.confirm(`Gerar uma nova senha para ${gestor.nome}?`);
    if (!confirmou) return;

    try {
      const { data } = await api.post(`/admin/gestores/${gestor.id}/reset-senha`);
      setSenhaVisivel({
        titulo: 'Nova senha temporária',
        senha: data.nova_senha,
        nome: gestor.nome,
      });
      toast.success('Senha redefinida com sucesso.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Não foi possível resetar a senha.');
    }
  };

  return (
    <section className="rounded-[2rem] border border-surface-variant/40 bg-surface-container-lowest p-5 shadow-sm md:p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-on-background md:text-2xl">Gestores da Rede</h2>
          <p className="mt-1 text-sm font-medium text-on-surface-variant">
            Criação, ativação, desativação e reset de senha das contas operacionais.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="inline-flex h-12 items-center gap-2 self-start rounded-2xl bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/30"
        >
          <span className="material-symbols-outlined text-xl">person_add</span>
          Novo Gestor
        </button>
      </header>

      <div className="overflow-x-auto rounded-3xl border border-surface-variant/30">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-variant/35">
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Nome</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">E-mail</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Perfil</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">UBS</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Status</th>
              <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-[0.16em] text-on-surface-variant">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant/25">
            {loading ? (
              Array.from({ length: 4 }, (_, index) => (
                <tr key={index} className="animate-pulse">
                  <td colSpan="6" className="px-5 py-5">
                    <div className="h-6 rounded-xl bg-surface-container-high" />
                  </td>
                </tr>
              ))
            ) : gestores.length > 0 ? (
              gestores.map((gestor) => (
                <tr key={gestor.id} className="hover:bg-surface-container-low/40">
                  <td className="px-5 py-4 font-bold text-on-background">{gestor.nome}</td>
                  <td className="px-5 py-4 text-sm font-medium text-on-surface-variant">{gestor.email}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
                      {formatarPerfil(gestor.perfil)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-on-surface-variant">{gestor.ubs_nome || '-'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ${
                      gestor.ativo
                        ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-700 border border-red-500/20'
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${gestor.ativo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {gestor.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => alternarStatus(gestor)}
                        className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold ${
                          gestor.ativo
                            ? 'bg-red-500/10 text-red-700 hover:bg-red-500/15'
                            : 'bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/15'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {gestor.ativo ? 'person_off' : 'person_check'}
                        </span>
                        {gestor.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => resetarSenha(gestor)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-surface-container-high px-3 text-xs font-bold text-on-surface hover:bg-surface-container-highest"
                      >
                        <span className="material-symbols-outlined text-lg">key_reset</span>
                        Resetar senha
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-5 py-12 text-center text-sm font-semibold text-on-surface-variant">
                  Nenhum gestor cadastrado no momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <ModalShell
          title="Novo Gestor"
          subtitle="Cadastre a conta e gere a senha inicial automaticamente."
          onClose={() => setModalAberto(false)}
        >
          <form onSubmit={handleCriar} className="space-y-4">
            <CampoTexto
              label="Nome completo"
              value={form.nome}
              onChange={(value) => setForm((prev) => ({ ...prev, nome: value }))}
              placeholder="Ex: Maria Aparecida Santos"
              required
            />
            <CampoTexto
              label="E-mail institucional"
              type="email"
              value={form.email}
              onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
              placeholder="nome@ubs.sjc.sp.gov.br"
              required
            />
            <CampoSelect
              label="Perfil"
              value={form.perfil}
              onChange={(value) => setForm((prev) => ({ ...prev, perfil: value }))}
              options={PERFIS.map((item) => ({ value: item.id, label: item.label }))}
            />
            <CampoSelect
              label="UBS"
              value={form.ubs_id}
              onChange={(value) => setForm((prev) => ({ ...prev, ubs_id: value }))}
              options={ubs.map((item) => ({ value: String(item.id), label: item.nome }))}
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

      {senhaVisivel && (
        <ModalShell
          title={senhaVisivel.titulo}
          subtitle={`Copie a senha de ${senhaVisivel.nome}. Ela não será exibida novamente.`}
          onClose={() => setSenhaVisivel(null)}
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Senha temporária</p>
              <p className="mt-2 break-all font-mono text-2xl font-black text-on-background">
                {senhaVisivel.senha}
              </p>
            </div>
            <p className="text-sm font-medium text-on-surface-variant">
              Oriente o gestor a trocar essa senha no primeiro acesso e nunca a envie em listagens ou relatórios.
            </p>
            <button
              type="button"
              onClick={() => setSenhaVisivel(null)}
              className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white"
            >
              Fechar
            </button>
          </div>
        </ModalShell>
      )}
    </section>
  );
}

function formatarPerfil(perfil) {
  return PERFIS.find((item) => item.id === perfil)?.label || perfil;
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

function CampoSelect({ label, value, onChange, options, ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-extrabold text-on-surface-variant">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-surface-variant/30 bg-surface-container-high/70 px-4 text-sm font-medium text-on-background outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
        {...props}
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
