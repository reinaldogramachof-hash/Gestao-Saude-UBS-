/**
 * PÁGINA: GestorUsuarios.jsx
 * -----------------------------------------------------------------------------
 * FUNÇÃO: Permite ao administrador gerenciar os usuários gestores da própria
 *         UBS, incluindo cadastro, edição, redefinição de senha e status.
 * PROPS: Nenhuma. O usuário autenticado é lido pelo hook useAuth().
 * API: GET    /api/admin/usuarios
 *      POST   /api/admin/usuario
 *      PATCH  /api/admin/usuario/:id
 *      PATCH  /api/admin/usuario/:id/senha
 *      DELETE /api/admin/usuario/:id
 */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import GestorLayout from '../../components/gestor/GestorLayout';
import { useAuth } from '../../hooks/useAuth';

const FORM_CRIACAO_INICIAL = {
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  perfil: 'recepcionista',
};

const PERFIL_BADGE = {
  recepcionista: 'bg-blue-100 text-blue-700',
  gestor:        'bg-emerald-100 text-emerald-700',
  admin:         'bg-violet-100 text-violet-700',
  medico:        'bg-cyan-100 text-cyan-700',
};

const PERFIL_LABEL = {
  recepcionista: 'Recepcionista',
  gestor:        'Gestor',
  admin:         'Administrador',
  medico:        'Médico',
};

export default function GestorUsuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [modalCriacao, setModalCriacao] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [modalSenha, setModalSenha] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [formCriacao, setFormCriacao] = useState(FORM_CRIACAO_INICIAL);
  const [formEdicao, setFormEdicao] = useState({ nome: '', email: '', perfil: 'gestor' });
  const [novaSenha, setNovaSenha] = useState('');

  const carregarUsuarios = async () => {
    if (user?.perfil !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro('');
    try {
      const response = await api.get('/admin/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, [user?.perfil]);

  const handleCriar = async (event) => {
    event.preventDefault();
    if (formCriacao.senha !== formCriacao.confirmarSenha) {
      toast.error('As senhas informadas não são iguais.');
      return;
    }
    if (formCriacao.senha.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setSalvando(true);
    try {
      const { confirmarSenha: _confirmacao, ...payload } = formCriacao;
      await api.post('/admin/usuario', payload);
      toast.success('Usuário cadastrado com sucesso!');
      setModalCriacao(false);
      setFormCriacao(FORM_CRIACAO_INICIAL);
      await carregarUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao cadastrar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const abrirEdicao = (usuario) => {
    setUsuarioSelecionado(usuario);
    setFormEdicao({
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    });
    setModalEdicao(true);
  };

  const handleEditar = async (event) => {
    event.preventDefault();
    setSalvando(true);
    try {
      await api.patch(`/admin/usuario/${usuarioSelecionado.id}`, formEdicao);
      toast.success('Usuário atualizado com sucesso!');
      setModalEdicao(false);
      setUsuarioSelecionado(null);
      await carregarUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const abrirAlteracaoSenha = () => {
    setNovaSenha('');
    setModalEdicao(false);
    setModalSenha(true);
  };

  const handleAlterarSenha = async (event) => {
    event.preventDefault();
    if (novaSenha.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setSalvando(true);
    try {
      await api.patch(`/admin/usuario/${usuarioSelecionado.id}/senha`, {
        nova_senha: novaSenha,
      });
      toast.success('Senha atualizada com sucesso!');
      setModalSenha(false);
      setUsuarioSelecionado(null);
      setNovaSenha('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar senha.');
    } finally {
      setSalvando(false);
    }
  };

  const handleAlternarStatus = async (usuario) => {
    try {
      if (usuario.ativo) {
        await api.delete(`/admin/usuario/${usuario.id}`);
        toast.success('Usuário desativado.');
      } else {
        // A reativação usa o PATCH para preservar o DELETE como exclusão lógica.
        await api.patch(`/admin/usuario/${usuario.id}`, { ativo: true });
        toast.success('Usuário reativado.');
      }
      await carregarUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao alterar status do usuário.');
    }
  };

  if (user?.perfil !== 'admin') {
    return (
      <GestorLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <section className="w-full max-w-lg bg-surface-container-lowest rounded-2xl border border-red-200 shadow-sm p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-red-500">lock</span>
            <h1 className="text-2xl font-extrabold text-on-background mt-4">Acesso negado</h1>
            <p className="text-on-surface-variant font-medium mt-2">
              Apenas administradores podem gerenciar a equipe da unidade.
            </p>
          </section>
        </div>
      </GestorLayout>
    );
  }

  return (
    <GestorLayout>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">Usuários</h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm">Gerencie a equipe da sua unidade.</p>
        </div>
        <button
          onClick={() => setModalCriacao(true)}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined">person_add</span>
          Novo Usuário
        </button>
      </header>

      {erro && !loading ? (
        <section className="bg-surface-container-lowest rounded-2xl border border-red-200 shadow-sm p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-red-500">error</span>
          <p className="font-bold text-on-background mt-3">{erro}</p>
          <button onClick={carregarUsuarios} className="mt-5 h-12 px-6 bg-primary text-white font-bold rounded-2xl">
            Tentar novamente
          </button>
        </section>
      ) : (
        <section className="bg-surface-container-lowest rounded-2xl border border-surface-variant shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-surface-container-low border-b border-surface-variant">
                <tr>
                  {['Nome', 'E-mail', 'Perfil', 'Status', 'Ações'].map((titulo) => (
                    <th key={titulo} className="p-4 md:p-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  Array.from({ length: 4 }, (_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td colSpan="5" className="p-5">
                        <div className="h-5 bg-surface-container-high rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : usuarios.length > 0 ? (
                  usuarios.map((usuario) => {
                    const proprioUsuario = Number(usuario.id) === Number(user.id);
                    return (
                      <tr key={usuario.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="p-4 md:p-6">
                          <p className="font-bold text-on-background">{usuario.nome}</p>
                          {proprioUsuario && <p className="text-xs text-primary font-bold mt-1">Sua conta</p>}
                        </td>
                        <td className="p-4 md:p-6 text-sm text-on-surface-variant">{usuario.email}</td>
                        <td className="p-4 md:p-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${PERFIL_BADGE[usuario.perfil] || 'bg-gray-100 text-gray-600'}`}>
                            {PERFIL_LABEL[usuario.perfil] || usuario.perfil}
                          </span>
                        </td>
                        <td className="p-4 md:p-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${usuario.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="p-4 md:p-6">
                          <div className="flex items-center gap-2">
                            {!proprioUsuario && (
                              <>
                                <button onClick={() => abrirEdicao(usuario)} aria-label={`Editar ${usuario.nome}`} className="w-10 h-10 rounded-xl hover:bg-primary/10 text-on-surface-variant hover:text-primary">
                                  <span className="material-symbols-outlined">edit</span>
                                </button>
                                <button onClick={() => handleAlternarStatus(usuario)} aria-label={`${usuario.ativo ? 'Desativar' : 'Reativar'} ${usuario.nome}`} className="w-10 h-10 rounded-xl hover:bg-surface-container-high text-on-surface-variant">
                                  <span className="material-symbols-outlined">{usuario.ativo ? 'person_off' : 'person'}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-16 text-center text-on-surface-variant font-medium">
                      Nenhum usuário encontrado nesta unidade.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {modalCriacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalCriacao(false)} />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden">
            <header className="p-6 border-b border-surface-variant flex justify-between items-center">
              <h2 className="text-xl font-extrabold">Novo Usuário</h2>
              <button onClick={() => setModalCriacao(false)} aria-label="Fechar cadastro" className="w-10 h-10 rounded-full hover:bg-surface-container-low">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <form onSubmit={handleCriar} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <CampoTexto label="Nome completo*" required value={formCriacao.nome} onChange={(value) => setFormCriacao((prev) => ({ ...prev, nome: value }))} />
              <CampoTexto label="E-mail*" type="email" required value={formCriacao.email} onChange={(value) => setFormCriacao((prev) => ({ ...prev, email: value }))} />
              <CampoTexto label="Senha*" type="password" required minLength={6} value={formCriacao.senha} onChange={(value) => setFormCriacao((prev) => ({ ...prev, senha: value }))} />
              <CampoTexto label="Confirmar senha*" type="password" required minLength={6} value={formCriacao.confirmarSenha} onChange={(value) => setFormCriacao((prev) => ({ ...prev, confirmarSenha: value }))} />
              <CampoPerfil value={formCriacao.perfil} onChange={(value) => setFormCriacao((prev) => ({ ...prev, perfil: value }))} />
              <AcoesModal salvando={salvando} onCancelar={() => setModalCriacao(false)} textoSalvar="Cadastrar" />
            </form>
          </div>
        </div>
      )}

      {modalEdicao && usuarioSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setModalEdicao(false)} />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden">
            <header className="p-6 border-b border-surface-variant">
              <p className="text-xs font-bold uppercase text-on-surface-variant">Editar usuário</p>
              <h2 className="text-xl font-extrabold mt-1">{usuarioSelecionado.nome}</h2>
            </header>
            <form onSubmit={handleEditar} className="p-6 space-y-4">
              <CampoTexto label="Nome*" required value={formEdicao.nome} onChange={(value) => setFormEdicao((prev) => ({ ...prev, nome: value }))} />
              <CampoTexto label="E-mail*" type="email" required value={formEdicao.email} onChange={(value) => setFormEdicao((prev) => ({ ...prev, email: value }))} />
              <CampoPerfil value={formEdicao.perfil} onChange={(value) => setFormEdicao((prev) => ({ ...prev, perfil: value }))} />
              <button type="button" onClick={abrirAlteracaoSenha} className="w-full h-12 rounded-xl bg-surface-container-high font-bold text-primary">
                Alterar Senha
              </button>
              <AcoesModal salvando={salvando} onCancelar={() => setModalEdicao(false)} textoSalvar="Salvar" />
            </form>
          </div>
        </div>
      )}

      {modalSenha && usuarioSelecionado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/50 backdrop-blur-sm" onClick={() => setModalSenha(false)} />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden">
            <header className="p-6 border-b border-surface-variant">
              <h2 className="text-xl font-extrabold">Alterar Senha</h2>
              <p className="text-sm text-on-surface-variant mt-1">{usuarioSelecionado.nome}</p>
            </header>
            <form onSubmit={handleAlterarSenha} className="p-6 space-y-5">
              <CampoTexto label="Nova senha*" type="password" required minLength={6} value={novaSenha} onChange={setNovaSenha} />
              <AcoesModal salvando={salvando} onCancelar={() => setModalSenha(false)} textoSalvar="Atualizar senha" />
            </form>
          </div>
        </div>
      )}
    </GestorLayout>
  );
}

// Campo privado da página que mantém o mesmo padrão visual em todos os modais.
function CampoTexto({ label, type = 'text', value, onChange, ...inputProps }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-on-surface-variant">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium"
        {...inputProps}
      />
    </label>
  );
}

// Select de perfis centralizado para cadastro e edição usarem os mesmos valores.
function CampoPerfil({ value, onChange }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-on-surface-variant">Perfil*</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium">
        <option value="recepcionista">Recepcionista</option>
        <option value="gestor">Gestor</option>
        <option value="admin">Administrador</option>
        <option value="medico">Médico</option>
      </select>
    </label>
  );
}

// Rodapé compartilhado entre os modais, com bloqueio durante requisições.
function AcoesModal({ salvando, onCancelar, textoSalvar }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancelar} className="flex-1 h-12 rounded-2xl border border-outline font-bold">
        Cancelar
      </button>
      <button type="submit" disabled={salvando} className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold disabled:opacity-50">
        {salvando ? 'Salvando...' : textoSalvar}
      </button>
    </div>
  );
}
