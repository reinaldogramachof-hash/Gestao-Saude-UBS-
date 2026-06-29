/**
 * App.jsx - Roteador Principal do Gestao Saude UBS+
 * -----------------------------------------------------------------------------
 * FUNCAO: Define as rotas publicas e protegidas do sistema, reaplicando as
 *         regras de autenticacao, ativacao de cadastro e pendencia LGPD.
 * -----------------------------------------------------------------------------
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import LoginPaciente from './pages/paciente/LoginPaciente';
import CadastroPaciente from './pages/paciente/CadastroPaciente';
import DashboardPaciente from './pages/paciente/DashboardPaciente';
import Medicamentos from './pages/paciente/Medicamentos';
import DetalheSolicitacao from './pages/paciente/DetalheSolicitacao';
import ComunicadosPaciente from './pages/paciente/ComunicadosPaciente';
import AgendamentosPaciente from './pages/paciente/AgendamentosPaciente';
import SolicitacoesPaciente from './pages/paciente/SolicitacoesPaciente';
import PerfilPacientePaciente from './pages/paciente/PerfilPaciente';

import LoginGestor from './pages/gestor/LoginGestor';
import DashboardGestor from './pages/gestor/DashboardGestor';
import GestorPacientes from './pages/gestor/GestorPacientes';
import PerfilPaciente from './pages/gestor/PerfilPaciente';
import MedicamentosGestor from './pages/gestor/MedicamentosGestor';
import ComunicadosGestor from './pages/gestor/ComunicadosGestor';
import AgendamentosGestor from './pages/gestor/AgendamentosGestor';
import RegulacaoGestor from './pages/gestor/RegulacaoGestor';
import VigilanciaGestor from './pages/gestor/VigilanciaGestor';
import GestorUsuarios from './pages/gestor/GestorUsuarios';
import PainelMedico from './pages/gestor/PainelMedico';
import RelatoriosGestor from './pages/gestor/RelatoriosGestor';
import SuperadminLayout from './pages/gestor/admin/SuperadminLayout';
import UBSAdmin from './pages/gestor/admin/UBSAdmin';
import GestoresAdmin from './pages/gestor/admin/GestoresAdmin';
import AuditAdmin from './pages/gestor/admin/AuditAdmin';

import LoginExterna from './pages/externa/LoginExterna';
import DashboardExterna from './pages/externa/DashboardExterna';
import EncaminhamentosExterna from './pages/externa/EncaminhamentosExterna';
import Privacidade from './pages/Privacidade';
import EsqueciSenha from './pages/gestor/EsqueciSenha';
import ResetSenha from './pages/gestor/ResetSenha';

// Garante que cada rota protegida respeite o tipo de usuario e as travas
// adicionais do portal do paciente, incluindo LGPD pendente.
const ProtectedRoute = ({ children, tipo, requireActive = false, perfilPermitidos = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated || user.tipo !== tipo) {
    if (tipo === 'gestor') return <Navigate to="/login-gestor" replace />;
    if (tipo === 'externa') return <Navigate to="/login-externa" replace />;
    return <Navigate to="/login-paciente" replace />;
  }

  if (tipo === 'paciente' && user.ativo === false && requireActive) {
    return <Navigate to="/paciente/agendamentos" replace />;
  }

  if (tipo === 'paciente' && user.lgpd_pendente) {
    return <Navigate to="/login-paciente" replace />;
  }

  if (perfilPermitidos.length > 0 && !perfilPermitidos.includes(user.perfil)) {
    if (tipo === 'gestor') return <Navigate to="/gestor/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontFamily: 'Inter, sans-serif', fontWeight: '600' },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login-paciente" replace />} />

          <Route path="/login-paciente" element={<LoginPaciente />} />
          <Route path="/login-gestor" element={<LoginGestor />} />
          <Route path="/login-externa" element={<LoginExterna />} />
          <Route path="/cadastro-paciente" element={<CadastroPaciente />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/reset-senha" element={<ResetSenha />} />

          <Route path="/paciente/dashboard" element={<ProtectedRoute tipo="paciente" requireActive><DashboardPaciente /></ProtectedRoute>} />
          <Route path="/paciente/medicamentos" element={<ProtectedRoute tipo="paciente" requireActive><Medicamentos /></ProtectedRoute>} />
          <Route path="/paciente/solicitacao/:id" element={<ProtectedRoute tipo="paciente" requireActive><DetalheSolicitacao /></ProtectedRoute>} />
          <Route path="/paciente/comunicados" element={<ProtectedRoute tipo="paciente" requireActive><ComunicadosPaciente /></ProtectedRoute>} />
          <Route path="/paciente/agendamentos" element={<ProtectedRoute tipo="paciente"><AgendamentosPaciente /></ProtectedRoute>} />
          <Route path="/paciente/solicitacoes" element={<ProtectedRoute tipo="paciente" requireActive><SolicitacoesPaciente /></ProtectedRoute>} />
          <Route path="/paciente/perfil" element={<ProtectedRoute tipo="paciente" requireActive><PerfilPacientePaciente /></ProtectedRoute>} />

          <Route path="/gestor/dashboard" element={<ProtectedRoute tipo="gestor"><DashboardGestor /></ProtectedRoute>} />
          <Route path="/gestor/pacientes" element={<ProtectedRoute tipo="gestor"><GestorPacientes /></ProtectedRoute>} />
          <Route path="/gestor/paciente/:id" element={<ProtectedRoute tipo="gestor"><PerfilPaciente /></ProtectedRoute>} />
          <Route path="/gestor/medicamentos" element={<ProtectedRoute tipo="gestor"><MedicamentosGestor /></ProtectedRoute>} />
          <Route path="/gestor/comunicados" element={<ProtectedRoute tipo="gestor"><ComunicadosGestor /></ProtectedRoute>} />
          <Route path="/gestor/agendamentos" element={<ProtectedRoute tipo="gestor"><AgendamentosGestor /></ProtectedRoute>} />
          <Route path="/gestor/regulacao" element={<ProtectedRoute tipo="gestor"><RegulacaoGestor /></ProtectedRoute>} />
          <Route path="/gestor/vigilancia" element={<ProtectedRoute tipo="gestor"><VigilanciaGestor /></ProtectedRoute>} />
          <Route path="/gestor/usuarios" element={<ProtectedRoute tipo="gestor"><GestorUsuarios /></ProtectedRoute>} />
          <Route path="/gestor/medico" element={<ProtectedRoute tipo="gestor"><PainelMedico /></ProtectedRoute>} />
          <Route path="/gestor/relatorios" element={<ProtectedRoute tipo="gestor"><RelatoriosGestor /></ProtectedRoute>} />
          <Route
            path="/gestor/admin"
            element={
              <ProtectedRoute tipo="gestor" perfilPermitidos={['admin']}>
                <SuperadminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="ubs" replace />} />
            <Route path="ubs" element={<UBSAdmin />} />
            <Route path="gestores" element={<GestoresAdmin />} />
            <Route path="logs" element={<AuditAdmin />} />
          </Route>

          <Route path="/externa/dashboard" element={<ProtectedRoute tipo="externa"><DashboardExterna /></ProtectedRoute>} />
          <Route path="/externa/encaminhamentos" element={<ProtectedRoute tipo="externa"><EncaminhamentosExterna /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
