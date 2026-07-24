/**
 * PÁGINA: LoginExterna.jsx + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Tela de autenticação para Unidades Externas (AME, CAPS, etc).
 *         Estrutura similar ao login de gestores.
 * API: POST /api/auth/login-externa
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function LoginExterna() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login-externa', { email, senha });
      login(res.data, res.data.token);
      navigate('/externa/dashboard');
    } catch {
      setError('Credenciais inválidas. Verifique e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* ── Logo e título ── */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-5">
            <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-background">Gestão Saúde</h1>
          <p className="text-on-surface-variant font-medium mt-1">Portal de Unidades Externas</p>
        </div>

        {/* ── Formulário de login ── */}
        <form onSubmit={handleLogin} className="bg-surface-container-lowest rounded-3xl shadow-md p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-semibold text-sm rounded-xl p-4 text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant">E-mail Corporativo</label>
            <input
              required
              type="email"
              autoComplete="off"
              placeholder="contato@ame-sjc.sp.gov.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-12 px-4 bg-surface-container-high border-none rounded-xl outline-none font-medium focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant">Senha</label>
            <div className="relative">
            <input
              required
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full h-12 pl-4 pr-12 bg-surface-container-high border-none rounded-xl outline-none font-medium focus:ring-2 focus:ring-primary/20"
            />
            {/* Alterna a visualizacao local da senha sem alterar o valor enviado ao backend. */}
            <button
              type="button"
              onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-on-surface-variant hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-r-xl"
            >
              {mostrarSenha ? (
                <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12a19.77 19.77 0 0 1 5.06-6.94" />
                  <path d="M9.9 4.24A10.45 10.45 0 0 1 12 4c5 0 9.27 3.11 11 8a19.84 19.84 0 0 1-2.2 3.45" />
                  <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-white font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-60 mt-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* ── Links auxiliares ── */}
        <p className="text-center text-on-surface-variant text-sm font-medium mt-6">
          <a href="/login-gestor" className="text-primary font-bold hover:underline transition-colors">
            Acesso para gestores UBS &rarr;
          </a>
        </p>
      </div>
    </div>
  );
}
