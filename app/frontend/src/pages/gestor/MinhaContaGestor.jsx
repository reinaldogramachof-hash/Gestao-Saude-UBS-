/**
 * PAGINA: MinhaContaGestor
 * -----------------------------------------------------------------------------
 * FUNCAO: Permite que o gestor autenticado revise e atualize os proprios dados
 *         cadastrais, alem de trocar a senha informando a senha atual.
 *
 * SEGURANCA:
 * - O backend identifica a conta pelo JWT, nunca por ID enviado no frontend.
 * - A troca de senha exige senha atual e revoga sessoes antigas via token_version.
 * -----------------------------------------------------------------------------
 */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import GestorLayout from '../../components/gestor/GestorLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const SENHA_INICIAL = {
  senha_atual: '',
  nova_senha: '',
  confirmar_senha: '',
};

export default function MinhaContaGestor() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [dados, setDados] = useState({
    nome: user?.nome || '',
    email: '',
    perfil: user?.perfil || '',
    ubs_nome: '',
  });
  const [senha, setSenha] = useState(SENHA_INICIAL);

  useEffect(() => {
    let montado = true;

    api.get('/gestor/minha-conta')
      .then((res) => {
        if (!montado) return;
        setDados({
          nome: res.data.nome || '',
          email: res.data.email || '',
          perfil: res.data.perfil || '',
          ubs_nome: res.data.ubs_nome || 'Unidade de Saude',
        });
      })
      .catch(() => toast.error('Nao foi possivel carregar sua conta.'))
      .finally(() => {
        if (montado) setCarregando(false);
      });

    return () => {
      montado = false;
    };
  }, []);

  const salvarDados = async (event) => {
    event.preventDefault();
    setSalvandoDados(true);

    try {
      const res = await api.patch('/gestor/minha-conta', {
        nome: dados.nome,
        email: dados.email,
      });
      updateUser({
        nome: res.data.nome,
        email: res.data.email,
        perfil: res.data.perfil,
        ubs_id: res.data.ubs_id,
      });
      toast.success('Dados da conta atualizados.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar sua conta.');
    } finally {
      setSalvandoDados(false);
    }
  };

  const alterarSenha = async (event) => {
    event.preventDefault();

    if (senha.nova_senha.length < 8) {
      toast.error('A nova senha deve ter no minimo 8 caracteres.');
      return;
    }

    if (senha.nova_senha !== senha.confirmar_senha) {
      toast.error('A confirmacao nao corresponde a nova senha.');
      return;
    }

    setSalvandoSenha(true);
    try {
      await api.patch('/gestor/minha-conta/senha', {
        senha_atual: senha.senha_atual,
        nova_senha: senha.nova_senha,
      });
      toast.success('Senha atualizada. Entre novamente com a nova senha.');
      setSenha(SENHA_INICIAL);
      logout();
      navigate('/login-gestor');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao alterar a senha.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  return (
    <GestorLayout>
      <header className="mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">
          Minha conta
        </h1>
        <p className="text-on-surface-variant font-medium mt-1 text-sm md:text-base">
          Dados de acesso, identificacao profissional e senha do usuario logado.
        </p>
      </header>

      {carregando ? (
        <section className="bg-surface-container-lowest rounded-3xl border border-surface-variant/45 shadow-sm p-8 animate-pulse">
          <div className="h-6 bg-surface-container-high rounded-xl w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-12 bg-surface-container-high rounded-xl" />
            <div className="h-12 bg-surface-container-high rounded-xl" />
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
          <section className="bg-surface-container-lowest rounded-3xl border border-surface-variant/45 shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">badge</span>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-on-background">Dados cadastrais</h2>
                <p className="text-xs font-semibold text-on-surface-variant">Esses dados aparecem na sua sessao e na auditoria.</p>
              </div>
            </div>

            <form onSubmit={salvarDados} className="space-y-5">
              <CampoTexto
                label="Nome completo"
                required
                value={dados.nome}
                onChange={(valor) => setDados((prev) => ({ ...prev, nome: valor }))}
              />
              <CampoTexto
                label="E-mail de acesso"
                type="email"
                required
                value={dados.email}
                onChange={(valor) => setDados((prev) => ({ ...prev, email: valor }))}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CampoLeitura label="Perfil" value={rotuloPerfil(dados.perfil)} icon="verified_user" />
                <CampoLeitura label="Unidade" value={dados.ubs_nome} icon="local_hospital" />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={salvandoDados}
                  className="h-12 px-6 rounded-2xl bg-primary text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95 transition-all"
                >
                  {salvandoDados ? 'Salvando...' : 'Salvar dados'}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-surface-container-lowest rounded-3xl border border-surface-variant/45 shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined">lock_reset</span>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-on-background">Senha de acesso</h2>
                <p className="text-xs font-semibold text-on-surface-variant">Use quando lembrar a senha atual e quiser trocar.</p>
              </div>
            </div>

            <form onSubmit={alterarSenha} className="space-y-5">
              <CampoSenha
                label="Senha atual"
                value={senha.senha_atual}
                onChange={(valor) => setSenha((prev) => ({ ...prev, senha_atual: valor }))}
              />
              <CampoSenha
                label="Nova senha"
                value={senha.nova_senha}
                onChange={(valor) => setSenha((prev) => ({ ...prev, nova_senha: valor }))}
                placeholder="Minimo de 8 caracteres"
              />
              <CampoSenha
                label="Confirmar nova senha"
                value={senha.confirmar_senha}
                onChange={(valor) => setSenha((prev) => ({ ...prev, confirmar_senha: valor }))}
                placeholder="Repita a nova senha"
              />

              <button
                type="submit"
                disabled={salvandoSenha}
                className="w-full h-12 rounded-2xl bg-on-surface text-surface font-bold text-sm shadow-md hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all"
              >
                {salvandoSenha ? 'Alterando...' : 'Alterar senha'}
              </button>
            </form>
          </section>
        </div>
      )}
    </GestorLayout>
  );
}

function CampoTexto({ label, value, onChange, type = 'text', ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-extrabold text-on-surface-variant">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-12 px-4 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
        {...props}
      />
    </label>
  );
}

function CampoSenha({ label, value, onChange, placeholder }) {
  const [mostrar, setMostrar] = useState(false);

  return (
    <label className="block space-y-2">
      <span className="text-sm font-extrabold text-on-surface-variant">{label}</span>
      <div className="relative">
        <input
          type={mostrar ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full h-12 pl-4 pr-12 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
        />
        <button
          type="button"
          onClick={() => setMostrar((valorAtual) => !valorAtual)}
          aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
          title={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-on-surface-variant hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-r-xl"
        >
          <span className="material-symbols-outlined text-xl">{mostrar ? 'visibility_off' : 'visibility'}</span>
        </button>
      </div>
    </label>
  );
}

function CampoLeitura({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-surface-variant/35 bg-surface-container-low p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-on-surface-variant">
        <span className="material-symbols-outlined text-base">{icon}</span>
        {label}
      </div>
      <p className="font-extrabold text-on-background mt-2">{value || '-'}</p>
    </div>
  );
}

function rotuloPerfil(perfil) {
  const labels = {
    recepcionista: 'Recepcionista',
    gestor: 'Gestor',
    admin: 'Administrador',
    medico: 'Medico',
  };

  return labels[perfil] || perfil || '-';
}
