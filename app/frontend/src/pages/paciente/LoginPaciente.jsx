/**
 * PAGINA: LoginPaciente.jsx
 * -----------------------------------------------------------------------------
 * FUNCAO: Autentica pacientes por CRA + Data de Nascimento e bloqueia a
 *         navegacao ate o aceite LGPD ser registrado no backend.
 * -----------------------------------------------------------------------------
 */
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import LgpdModal from '../../components/paciente/LgpdModal';

export default function LoginPaciente() {
  const [cra, setCra] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aguardandoAceite, setAguardandoAceite] = useState(false);
  const { login, updateUser, user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Centraliza a ida ao dashboard para manter o fluxo de login e o fluxo
  // pos-aceite apontando para o mesmo destino.
  const abrirDashboard = () => navigate('/paciente/dashboard');

  // Se a sessao ja existir, esta tela decide se abre o modal LGPD ou segue
  // para o dashboard do paciente.
  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.tipo !== 'paciente') return;

    if (user.lgpd_pendente) {
      setAguardandoAceite(true);
      return;
    }

    abrirDashboard();
  }, [authLoading, isAuthenticated, navigate, user]);

  const aplicarMascaraData = (value) => {
    let valor = value.replace(/\D/g, '');
    if (valor.length > 8) valor = valor.substring(0, 8);

    if (valor.length > 4) {
      return `${valor.substring(0, 2)}/${valor.substring(2, 4)}/${valor.substring(4)}`;
    }

    if (valor.length > 2) {
      return `${valor.substring(0, 2)}/${valor.substring(2)}`;
    }

    return valor;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (dataNascimento.length !== 10) {
      setError('Por favor, informe a data de nascimento completa no formato DD/MM/AAAA.');
      setLoading(false);
      return;
    }

    try {
      const [dia, mes, ano] = dataNascimento.split('/');
      const dataNascimentoISO = `${ano}-${mes}-${dia}`;

      const res = await api.post('/auth/login-paciente', { cra, data_nascimento: dataNascimentoISO });
      login(res.data, res.data.token);

      if (res.data.lgpd_pendente) {
        setAguardandoAceite(true);
      } else {
        abrirDashboard();
      }
    } catch {
      setError('CRA ou Data de Nascimento invalidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {aguardandoAceite && (
        <LgpdModal
          onAceite={() => {
            updateUser({
              lgpd_pendente: false,
              lgpd_aceite_em: new Date().toISOString(),
            });
            setAguardandoAceite(false);
            abrirDashboard();
          }}
        />
      )}

      <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center p-6 text-on-surface">
        <div className="w-full max-w-md mb-8 text-center">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-5">
            <img src="/logo.webp" alt="Logotipo Gestão Saúde UBS+" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-background mb-1">Gestao Saude</h1>
          <p className="text-on-surface-variant font-medium">Portal do Paciente - Sao Jose dos Campos</p>
        </div>

        <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-md p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-semibold text-sm rounded-xl p-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="cra" className="block text-sm font-bold text-on-surface-variant">Numero do CRA</label>
              <input
                id="cra"
                value={cra}
                onChange={(event) => setCra(event.target.value)}
                required
                type="text"
                placeholder="Ex: 00123456"
                className="w-full h-12 bg-surface-container-high border-none rounded-xl px-4 text-on-surface focus:ring-2 focus:ring-primary outline-none font-medium"
              />
              <p className="text-xs text-on-surface-variant ml-1">O CRA e o seu numero de cadastro na unidade de saude.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="dataNascimento" className="block text-sm font-bold text-on-surface-variant">Data de Nascimento</label>
              <input
                id="dataNascimento"
                value={dataNascimento}
                onChange={(event) => setDataNascimento(aplicarMascaraData(event.target.value))}
                required
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="Ex: 25/10/1995"
                className="w-full h-12 bg-surface-container-high border-none rounded-xl px-4 text-on-surface focus:ring-2 focus:ring-primary outline-none font-medium"
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

          <p className="text-center text-xs text-on-surface-variant pt-2">
            Seus dados sao protegidos - LGPD/Lei 13.709
          </p>
        </div>

        <div className="mt-6 text-center space-y-3">
          <div className="bg-surface-container-lowest rounded-2xl p-4 max-w-md w-full border border-surface-variant">
            <p className="text-sm font-semibold text-on-surface-variant mb-2">Ainda nao tem cadastro?</p>
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

          <p className="pt-2">
            <Link to="/privacidade" target="_blank" className="text-xs text-on-surface-variant/70 hover:text-primary font-semibold hover:underline">
              Politica de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
