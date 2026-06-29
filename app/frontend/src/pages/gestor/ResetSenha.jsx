// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: ResetSenha
// FUNÇÃO: Tela para digitação e confirmação de nova senha para gestores.
//         Lê o token da URL e faz a chamada de confirmação à API.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ResetSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Se não houver token na URL, impede a permanência na tela
    if (!token) {
      toast.error('Token de redefinição inválido ou ausente.');
      navigate('/login-gestor');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações no lado do cliente
    if (senha.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas digitadas não são iguais.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-senha/confirmar', { token, nova_senha: senha });
      toast.success('Senha atualizada com sucesso!');
      navigate('/login-gestor');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        'Erro ao redefinir a senha. O link pode ter expirado ou já ter sido utilizado.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-6 text-on-surface">
      <div className="w-full max-w-md">
        
        {/* Logo e cabeçalho */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-5">
            <img src="/logo.webp" alt="Logotipo Gestão Saúde UBS+" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-background">Nova Senha</h1>
          <p className="text-on-surface-variant font-medium mt-1">Crie sua nova senha de acesso</p>
        </div>

        {/* Card do formulário */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 font-semibold text-sm rounded-xl p-4 text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="senha" className="text-sm font-bold text-on-surface-variant">Nova Senha</label>
              <input
                id="senha"
                required
                type="password"
                placeholder="No mínimo 8 caracteres"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium focus:ring-2 focus:ring-primary text-on-surface"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmarSenha" className="text-sm font-bold text-on-surface-variant">Confirmar Nova Senha</label>
              <input
                id="confirmarSenha"
                required
                type="password"
                placeholder="Repita a senha digitada"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium focus:ring-2 focus:ring-primary text-on-surface"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-white font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-60 mt-4"
            >
              {loading ? 'Redefinindo...' : 'Atualizar Senha'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
