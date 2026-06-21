/**
 * PÁGINA: LoginGestor.jsx + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Tela de autenticação para gestores da UBS.
 *         Card de login centralizado no desktop e tela cheia no mobile.
 *         Design institucional com identidade visual da UBS+.
 *
 * API: POST /api/auth/login-gestor
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function LoginGestor() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login-gestor', { email, senha });
      login(res.data, res.data.token);
      navigate('/gestor/dashboard');
    } catch {
      setError('Credenciais inválidas. Verifique e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Wrapper: centraliza o card em telas maiores */
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* ── Logo e título ── */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-5">
            <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain invert" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-background">Gestão Saúde</h1>
          <p className="text-on-surface-variant font-medium mt-1">Portal do Gestor</p>
        </div>

        {/* ── Formulário de login ── */}
        <form onSubmit={handleLogin} className="bg-surface-container-lowest rounded-3xl shadow-md p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-semibold text-sm rounded-xl p-4 text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant">E-mail</label>
            <input
              required
              type="email"
              autoComplete="off"
              placeholder="gestor@gestaoubs.dev"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant">Senha</label>
            <input
              required
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-white font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-60 mt-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* ── Link para o portal do paciente ── */}
        <p className="text-center text-on-surface-variant text-sm font-medium mt-6">
          Paciente? {' '}
          <a href="/login-paciente" className="text-primary font-bold hover:underline">Acesse o Portal do Paciente</a>
        </p>
      </div>
    </div>
  );
}
