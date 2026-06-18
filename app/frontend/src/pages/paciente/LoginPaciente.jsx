/**
 * PÁGINA: LoginPaciente.jsx + Responsividade
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Tela de autenticação para pacientes via CRA + Data de Nascimento.
 *         Card centralizado no desktop (max-w-md), tela cheia no mobile.
 *         Acessível — sem jargão técnico, instruções claras ao usuário.
 *
 * API: POST /api/auth/login-paciente
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function LoginPaciente() {
  const [cra, setCra] = useState('');
  const [dataNascimento, setData] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Aplica máscara de data DD/MM/AAAA durante a digitação, removendo não-dígitos
  const aplicarMascaraData = (value) => {
    let v = value.replace(/\D/g, ''); // Remove tudo que não for número
    if (v.length > 8) v = v.substring(0, 8); // Limita em 8 dígitos (DDMMAAAA)
    if (v.length > 4) {
      v = `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4)}`;
    } else if (v.length > 2) {
      v = `${v.substring(0, 2)}/${v.substring(2)}`;
    }
    return v;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Valida se o usuário preencheu a data por completo
    if (dataNascimento.length !== 10) {
      setError('Por favor, informe a data de nascimento completa no formato DD/MM/AAAA.');
      setLoading(false);
      return;
    }

    try {
      // Converte data de nascimento do formato DD/MM/AAAA para YYYY-MM-DD exigido pela API
      const [dia, mes, ano] = dataNascimento.split('/');
      const dataNascimentoISO = `${ano}-${mes}-${dia}`;

      const res = await api.post('/auth/login-paciente', { cra, data_nascimento: dataNascimentoISO });
      login(res.data, res.data.token);
      navigate('/paciente/dashboard');
    } catch {
      setError('CRA ou Data de Nascimento inválidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Wrapper: centraliza e aplica fundo suave no desktop */
    <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center p-6 text-on-surface">

      {/* ── Logo e nome do sistema ── */}
      <div className="w-full max-w-md mb-8 text-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mx-auto mb-5">
          <span className="material-symbols-outlined text-on-primary text-3xl">health_and_safety</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-background mb-1">Gestão Saúde UBS+</h1>
        <p className="text-on-surface-variant font-medium">Portal do Paciente — São José dos Campos</p>
      </div>

      {/* ── Card do formulário ── */}
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-md p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 font-semibold text-sm rounded-xl p-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-on-surface-variant">Número do CRA</label>
            <input
              value={cra}
              onChange={e => setCra(e.target.value)}
              required
              type="text"
              placeholder="Ex: 00123456"
              className="w-full h-12 bg-surface-container-high border-none rounded-xl px-4 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none font-medium"
            />
            <p className="text-xs text-on-surface-variant ml-1">O CRA é o seu número de cadastro na unidade de saúde.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-on-surface-variant">Data de Nascimento</label>
            <input
              value={dataNascimento}
              onChange={e => setData(aplicarMascaraData(e.target.value))}
              required
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="Ex: 25/10/1995"
              className="w-full h-12 bg-surface-container-high border-none rounded-xl px-4 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-white font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Nota de privacidade (LGPD) */}
        <p className="text-center text-xs text-on-surface-variant pt-2">
          🔒 Seus dados são protegidos — LGPD/Lei 13.709
        </p>
      </div>

      {/* ── Cadastro + link do gestor ── */}
      <div className="mt-6 text-center space-y-3">
        {/* CTA de cadastro — destaque para quem ainda não tem CRA */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 max-w-md w-full border border-surface-variant">
          <p className="text-sm font-semibold text-on-surface-variant mb-2">Ainda não tem cadastro?</p>
          <Link
            to="/cadastro-paciente"
            className="inline-flex items-center gap-2 h-11 px-6 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Solicitar Cadastro na UBS
          </Link>
        </div>

        <p className="text-on-surface-variant text-sm font-medium">
          Equipe da UBS?{' '}
          <a href="/login-gestor" className="text-primary font-bold hover:underline">Acesse o Portal do Gestor</a>
        </p>
      </div>
    </div>
  );
}
