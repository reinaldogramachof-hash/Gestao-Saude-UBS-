// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: EsqueciSenha
// FUNÇÃO: Tela para solicitação de redefinição de senha para gestores.
//         Exibe formulário de e-mail e faz chamada à API do backend.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Faz a requisição de solicitação sem revelar se o e-mail de fato existe
      await api.post('/auth/reset-senha/solicitar', { email: email.trim() });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Erro ao processar solicitação. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        
        {/* Logo e cabeçalho */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-5">
            <img src="/logo.webp" alt="Logotipo Gestão Saúde UBS+" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-background">Recuperar Senha</h1>
          <p className="text-on-surface-variant font-medium mt-1">Portal do Gestor</p>
        </div>

        {/* Card do formulário */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-md p-8">
          {success ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <span className="material-symbols-outlined text-3xl">mark_email_read</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900">E-mail de instruções enviado</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Se o endereço informado estiver associado a uma conta ativa de gestor no sistema, você receberá um link para redefinição em instantes.
                </p>
              </div>
              <button
                onClick={() => navigate('/login-gestor')}
                className="w-full h-12 bg-primary text-white font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
              >
                Voltar ao Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 font-semibold text-sm rounded-xl p-4 text-center">
                  {error}
                </div>
              )}

              <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                Informe o seu e-mail institucional. Nós enviaremos um link seguro para que você possa criar uma nova senha de acesso.
              </p>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold text-on-surface-variant">E-mail Institucional</label>
                <input
                  id="email"
                  required
                  type="email"
                  placeholder="gestor@gestaoubs.dev"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium focus:ring-2 focus:ring-primary text-on-surface"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary text-white font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-60 mt-2"
              >
                {loading ? 'Processando...' : 'Enviar instruções'}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login-gestor"
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Voltar ao login
                </Link>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
