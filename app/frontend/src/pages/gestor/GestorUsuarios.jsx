// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: GestorUsuarios
// FUNÇÃO: Gerenciamento dos usuários gestores da UBS (staff de atendimento).
//         Permite ao administrador cadastrar novos colaboradores, editar dados,
//         alterar senhas e desativar ou reativar cadastros de funcionários.
// DESIGN: Visual de alta fidelidade com mini-cards estatísticos de equipe em HSL,
//         tabela de staff refinada com badges translúcidos de perfil e status,
//         chips de ação modernos e modais rounded-[2rem] com seleção de perfil
//         avançada em chips de clique tátil (Wow Factor).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import GestorLayout from '../../components/gestor/GestorLayout';
import { useAuth } from '../../hooks/useAuth';

// Configuração inicial de formulário para novos cadastros
const FORM_CRIACAO_INICIAL = {
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  perfil: 'recepcionista',
};

// Badges translúcidos elegantes por perfil com bolinha sólida no início (Paleta HSL)
const PERFIL_BADGE = {
  recepcionista: 'bg-blue-500/10 text-blue-850 border border-blue-500/20',
  gestor:        'bg-emerald-500/10 text-emerald-850 border border-emerald-500/20',
  admin:         'bg-violet-500/10 text-violet-850 border border-violet-500/20',
  medico:        'bg-cyan-500/10 text-cyan-850 border border-cyan-500/20',
};

const PERFIL_CORES = {
  recepcionista: 'bg-blue-500',
  gestor:        'bg-emerald-500',
  admin:         'bg-violet-500',
  medico:        'bg-cyan-500',
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

  // Carrega a listagem de funcionários vinculados à UBS
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
      console.error('[GestorUsuarios] Erro ao carregar equipe:', error);
      setErro(error.response?.data?.error || 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, [user?.perfil]);

  // Salva o cadastro de um novo funcionário na base
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

  // Prepara o formulário para edição
  const abrirEdicao = (usuario) => {
    setUsuarioSelecionado(usuario);
    setFormEdicao({
      nome:   usuario.nome,
      email:  usuario.email,
      perfil: usuario.perfil,
    });
    setModalEdicao(true);
  };

  // Salva os dados cadastrais atualizados do usuário
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

  // Transiciona o fluxo de edição para o modal de alteração de senha
  const abrirAlteracaoSenha = () => {
    setNovaSenha('');
    setModalEdicao(false);
    setModalSenha(true);
  };

  // Salva a nova senha redefinida pelo administrador
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

  // Executa exclusão lógica (desativação) ou reativação do usuário na base
  const handleAlternarStatus = async (usuario) => {
    try {
      if (usuario.ativo) {
        await api.delete(`/admin/usuario/${usuario.id}`);
        toast.success('Usuário desativado.');
      } else {
        // A reativação utiliza o PATCH para reverter o status de exclusão lógica
        await api.patch(`/admin/usuario/${usuario.id}`, { ativo: true });
        toast.success('Usuário reativado.');
      }
      await carregarUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao alterar status do usuário.');
    }
  };

  // Bloqueio preventivo de segurança se o usuário logado não possuir perfil de administrador
  if (user?.perfil !== 'admin') {
    return (
      <GestorLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <section className="w-full max-w-lg bg-surface-container-lowest rounded-[2rem] border border-red-500/15 shadow-sm p-8 text-center">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-600 mx-auto">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <h1 className="text-2xl font-extrabold text-on-background mt-4">Acesso Negado</h1>
            <p className="text-on-surface-variant font-medium mt-2 text-sm">
              Sua conta atual não possui permissões administrativas. Apenas administradores do sistema podem visualizar, cadastrar ou editar a equipe gestora da unidade.
            </p>
          </section>
        </div>
      </GestorLayout>
    );
  }

  // Cálculos quantitativos por perfil para alimentar a barra de contadores
  const totalAdmin = usuarios.filter(u => u.perfil === 'admin' && u.ativo).length;
  const totalGestores = usuarios.filter(u => u.perfil === 'gestor' && u.ativo).length;
  const totalMedicos = usuarios.filter(u => u.perfil === 'medico' && u.ativo).length;
  const totalRecepcionistas = usuarios.filter(u => u.perfil === 'recepcionista' && u.ativo).length;

  return (
    <GestorLayout>
      {/* ── CABEÇALHO E AÇÃO PRINCIPAL ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-on-background">
            Gestão de Equipe
          </h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm md:text-base">
            Cadastro, controle de acesso e redefinições de credenciais dos colaboradores da unidade.
          </p>
        </div>
        <button
          onClick={() => setModalCriacao(true)}
          className="h-12 px-6 text-sm md:h-14 md:px-8 md:text-base bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
        >
          <span className="material-symbols-outlined text-xl">person_add</span>
          Novo Usuário
        </button>
      </header>

      {/* ── BARRA DE CONTADORES RÁPIDOS DA EQUIPE (HSL GLASSMORPHIC) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Administradores */}
        <div className="bg-gradient-to-br from-violet-500/5 to-violet-500/10 border border-violet-500/15 rounded-3xl p-5 flex items-center gap-3 transition-all hover:shadow-md">
          <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-700 flex-shrink-0">
            <span className="material-symbols-outlined text-xl">shield</span>
          </div>
          <div>
            <div className="text-2xl font-black text-violet-950 tracking-tight">{totalAdmin}</div>
            <div className="text-[10px] font-extrabold text-violet-800 uppercase tracking-wider">Admins</div>
          </div>
        </div>

        {/* Gestores */}
        <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/15 rounded-3xl p-5 flex items-center gap-3 transition-all hover:shadow-md">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-750 flex-shrink-0">
            <span className="material-symbols-outlined text-xl">manage_accounts</span>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 tracking-tight">{totalGestores}</div>
            <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Gestores</div>
          </div>
        </div>

        {/* Médicos */}
        <div className="bg-gradient-to-br from-cyan-500/5 to-cyan-500/10 border border-cyan-500/15 rounded-3xl p-5 flex items-center gap-3 transition-all hover:shadow-md">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-700 flex-shrink-0">
            <span className="material-symbols-outlined text-xl">stethoscope</span>
          </div>
          <div>
            <div className="text-2xl font-black text-cyan-950 tracking-tight">{totalMedicos}</div>
            <div className="text-[10px] font-extrabold text-cyan-800 uppercase tracking-wider">Médicos</div>
          </div>
        </div>

        {/* Recepcionistas */}
        <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/15 rounded-3xl p-5 flex items-center gap-3 transition-all hover:shadow-md">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-700 flex-shrink-0">
            <span className="material-symbols-outlined text-xl">badge</span>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-950 tracking-tight">{totalRecepcionistas}</div>
            <div className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider">Recepção</div>
          </div>
        </div>
      </div>

      {/* ── LISTAGEM DE USUÁRIOS (TABELA DE ALTA FIDELIDADE) ── */}
      {erro && !loading ? (
        <section className="bg-surface-container-lowest rounded-3xl border border-red-500/15 p-10 text-center max-w-md mx-auto shadow-sm">
          <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
          <h3 className="font-bold text-on-background mt-4 text-lg">Falha ao Carregar</h3>
          <p className="text-on-surface-variant text-sm mt-2 font-medium">{erro}</p>
          <button
            onClick={carregarUsuarios}
            className="mt-6 h-12 px-6 bg-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2 mx-auto"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Tentar novamente
          </button>
        </section>
      ) : (
        <section className="bg-surface-container-lowest rounded-3xl border border-surface-variant/45 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-variant/40">
                  <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">E-mail</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Perfil</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/30">
                {loading ? (
                  Array.from({ length: 4 }, (_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td colSpan="5" className="px-6 py-5">
                        <div className="h-6 bg-surface-container-high rounded-lg w-full" />
                      </td>
                    </tr>
                  ))
                ) : usuarios.length > 0 ? (
                  usuarios.map((usuario) => {
                    const proprioUsuario = Number(usuario.id) === Number(user.id);
                    return (
                      <tr key={usuario.id} className="hover:bg-surface-container-low/40 transition-colors">
                        {/* Nome do Colaborador */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-bold text-on-background text-base">{usuario.nome}</p>
                              {proprioUsuario && (
                                <span className="inline-flex mt-1 text-[10px] font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                                  Sua conta
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* E-mail Institucional */}
                        <td className="px-6 py-5 text-sm text-on-surface-variant font-medium">
                          {usuario.email}
                        </td>

                        {/* Perfil de Acesso com Badge Translúcida HSL */}
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${PERFIL_BADGE[usuario.perfil] || 'bg-surface-variant/10 text-on-surface border border-surface-variant/20'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${PERFIL_CORES[usuario.perfil] || 'bg-on-surface/50'}`} />
                            {PERFIL_LABEL[usuario.perfil] || usuario.perfil}
                          </span>
                        </td>

                        {/* Status do Funcionário */}
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                              usuario.ativo
                                ? 'bg-emerald-500/10 text-emerald-850 border-emerald-500/20'
                                : 'bg-surface-variant/15 text-on-surface-variant/80 border border-surface-variant/25'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${usuario.ativo ? 'bg-emerald-500' : 'bg-on-surface-variant/40'}`} />
                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>

                        {/* Ações Administrativas */}
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!proprioUsuario ? (
                              <>
                                <button
                                  onClick={() => abrirEdicao(usuario)}
                                  aria-label={`Editar ${usuario.nome}`}
                                  className="w-9 h-9 rounded-xl border border-surface-variant/50 hover:bg-primary/10 text-on-surface-variant hover:text-primary flex items-center justify-center transition-all"
                                >
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                  onClick={() => handleAlternarStatus(usuario)}
                                  aria-label={`${usuario.ativo ? 'Desativar' : 'Reativar'} ${usuario.nome}`}
                                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                                    usuario.ativo
                                      ? 'border-red-500/20 hover:bg-red-500/10 text-red-700'
                                      : 'border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-755'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-lg">
                                    {usuario.ativo ? 'person_off' : 'person'}
                                  </span>
                                </button>
                              </>
                            ) : (
                              <span className="text-xs font-semibold text-on-surface-variant/35 italic mr-4">Sem ações</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-on-surface-variant font-semibold text-sm">
                      Nenhum colaborador registrado nesta unidade.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── MODAL: CADASTRAR NOVO COLABORADOR ── */}
      {modalCriacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-md transition-opacity"
            onClick={() => setModalCriacao(false)}
          />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden border border-surface-variant/30 flex flex-col max-h-[90vh]">
            <header className="p-6 md:p-8 border-b border-surface-variant/40 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-xl font-extrabold text-on-background">Novo Colaborador</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Cadastre um funcionário na equipe gestora da UBS.</p>
              </div>
              <button
                onClick={() => setModalCriacao(false)}
                aria-label="Fechar cadastro"
                className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <form onSubmit={handleCriar} className="p-6 md:p-8 space-y-5 overflow-y-auto flex-1">
              <CampoTexto
                label="Nome completo *"
                required
                value={formCriacao.nome}
                onChange={(value) => setFormCriacao((prev) => ({ ...prev, nome: value }))}
                placeholder="Ex: João da Silva"
              />
              <CampoTexto
                label="E-mail institucional *"
                type="email"
                required
                value={formCriacao.email}
                onChange={(value) => setFormCriacao((prev) => ({ ...prev, email: value }))}
                placeholder="Ex: joao.silva@ubs.sjc.sp.gov.br"
              />
              <CampoTexto
                label="Senha de Acesso *"
                type="password"
                required
                minLength={6}
                value={formCriacao.senha}
                onChange={(value) => setFormCriacao((prev) => ({ ...prev, senha: value }))}
                placeholder="Mínimo de 6 caracteres"
              />
              <CampoTexto
                label="Confirmar senha *"
                type="password"
                required
                minLength={6}
                value={formCriacao.confirmarSenha}
                onChange={(value) => setFormCriacao((prev) => ({ ...prev, confirmarSenha: value }))}
                placeholder="Repita a senha digitada"
              />

              {/* Seletor de Perfil em Chips Táteis Modernos (Wow Factor) */}
              <CampoPerfil
                value={formCriacao.perfil}
                onChange={(value) => setFormCriacao((prev) => ({ ...prev, perfil: value }))}
              />

              <div className="flex gap-3 pt-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setModalCriacao(false)}
                  className="flex-1 h-12 rounded-2xl border border-surface-variant font-bold text-sm hover:bg-surface-container-low active:scale-98 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 active:scale-98 transition-all"
                >
                  {salvando ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR DADOS DO COLABORADOR ── */}
      {modalEdicao && usuarioSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-md transition-opacity"
            onClick={() => setModalEdicao(false)}
          />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden border border-surface-variant/30 flex flex-col max-h-[90vh]">
            <header className="p-6 md:p-8 border-b border-surface-variant/40 flex-shrink-0">
              <p className="text-xs font-black uppercase tracking-wider text-primary">Editar usuário</p>
              <h2 className="text-xl font-extrabold text-on-background mt-1">{usuarioSelecionado.nome}</h2>
            </header>

            <form onSubmit={handleEditar} className="p-6 md:p-8 space-y-5 overflow-y-auto flex-1">
              <CampoTexto
                label="Nome completo *"
                required
                value={formEdicao.nome}
                onChange={(value) => setFormEdicao((prev) => ({ ...prev, nome: value }))}
              />
              <CampoTexto
                label="E-mail institucional *"
                type="email"
                required
                value={formEdicao.email}
                onChange={(value) => setFormEdicao((prev) => ({ ...prev, email: value }))}
              />

              {/* Seletor de Perfil em Chips Táteis Modernos (Wow Factor) */}
              <CampoPerfil
                value={formEdicao.perfil}
                onChange={(value) => setFormEdicao((prev) => ({ ...prev, perfil: value }))}
              />

              <button
                type="button"
                onClick={abrirAlteracaoSenha}
                className="w-full h-12 rounded-xl bg-surface-container-high/70 hover:bg-surface-container-high font-bold text-primary text-sm transition-all border border-primary/15"
              >
                Alterar Senha de Acesso
              </button>

              <div className="flex gap-3 pt-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setModalEdicao(false)}
                  className="flex-1 h-12 rounded-2xl border border-surface-variant font-bold text-sm hover:bg-surface-container-low active:scale-98 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 active:scale-98 transition-all"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ALTERAR SENHA ── */}
      {modalSenha && usuarioSelecionado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/50 backdrop-blur-md transition-opacity"
            onClick={() => setModalSenha(false)}
          />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-[2rem] shadow-2xl overflow-hidden border border-surface-variant/30 flex flex-col">
            <header className="p-6 border-b border-surface-variant/40 flex-shrink-0">
              <h2 className="text-xl font-extrabold text-on-background">Alterar Senha</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">{usuarioSelecionado.nome}</p>
            </header>

            <form onSubmit={handleAlterarSenha} className="p-6 space-y-5">
              <CampoTexto
                label="Nova senha *"
                type="password"
                required
                minLength={6}
                value={novaSenha}
                onChange={setNovaSenha}
                placeholder="Mínimo de 6 caracteres"
              />

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalSenha(false)}
                  className="flex-1 h-12 rounded-2xl border border-surface-variant font-bold text-sm hover:bg-surface-container-low active:scale-98 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 active:scale-98 transition-all"
                >
                  {salvando ? 'Salvando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GestorLayout>
  );
}

// Campo genérico de texto estilizado com foco translúcido
function CampoTexto({ label, type = 'text', value, onChange, placeholder, ...inputProps }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-extrabold text-on-surface-variant">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full h-12 px-4 bg-surface-container-high/75 border border-surface-variant/20 rounded-xl outline-none font-medium focus:border-primary/50 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all text-sm"
        {...inputProps}
      />
    </label>
  );
}

// Seletor de Perfil avançado em Chips Interativos HSL de clique tátil (Wow Factor)
function CampoPerfil({ value, onChange }) {
  const perfis = [
    { id: 'recepcionista', label: 'Recepcionista', icon: 'badge', desc: 'Acesso a agendas, recepção e triagem pública.', cor: 'bg-blue-500/10 text-blue-800 border-blue-500/20 border-2' },
    { id: 'gestor', label: 'Gestor', icon: 'manage_accounts', desc: 'Acesso total a regulação, estoque e comunicados.', cor: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20 border-2' },
    { id: 'medico', label: 'Médico', icon: 'stethoscope', desc: 'Acesso clínico completo (Painel Médico read-only).', cor: 'bg-cyan-500/10 text-cyan-800 border-cyan-500/20 border-2' },
    { id: 'admin', label: 'Administrador', icon: 'shield', desc: 'Acesso total e controle cadastral do staff.', cor: 'bg-violet-500/10 text-violet-800 border-violet-500/20 border-2' },
  ];

  return (
    <div className="space-y-2">
      <span className="text-sm font-extrabold text-on-surface-variant block">Perfil de Acesso *</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {perfis.map((p) => {
          const selecionado = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex items-start gap-3 hover:-translate-y-0.5 active:translate-y-0 ${
                selecionado
                  ? p.cor
                  : 'border-surface-variant bg-surface-container-high/50 hover:bg-surface-container-high'
              }`}
            >
              <span className={`material-symbols-outlined mt-0.5 ${selecionado ? '' : 'text-on-surface-variant'}`}>
                {p.icon}
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">{p.label}</p>
                <p className="text-[10px] text-on-surface-variant/85 font-semibold leading-relaxed mt-0.5">
                  {p.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
