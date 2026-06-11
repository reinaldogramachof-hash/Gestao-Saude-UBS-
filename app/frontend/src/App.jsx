/**
 * App.jsx — Roteador Principal do Gestão Saúde UBS+
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Define todas as rotas da aplicação, separando acessos por tipo de
 *         usuário (gestor ou paciente) via ProtectedRoute.
 *         O <Toaster> global garante feedback visual em qualquer tela.
 *
 * SEGURANÇA: ProtectedRoute lê o AuthContext e redireciona se não autenticado
 *            ou se o tipo de usuário não bater com a rota solicitada.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// ── Portal do Paciente ─────────────────────────────────────────────────────
import LoginPaciente from './pages/paciente/LoginPaciente';
import CadastroPaciente from './pages/paciente/CadastroPaciente';
import DashboardPaciente from './pages/paciente/DashboardPaciente';
import Medicamentos from './pages/paciente/Medicamentos';
import DetalheSolicitacao from './pages/paciente/DetalheSolicitacao';
import ComunicadosPaciente from './pages/paciente/ComunicadosPaciente';   // Épico 3
import AgendamentosPaciente from './pages/paciente/AgendamentosPaciente'; // Épico 4

// ── Portal do Gestor ───────────────────────────────────────────────────────
import LoginGestor from './pages/gestor/LoginGestor';
import DashboardGestor from './pages/gestor/DashboardGestor';
import GestorPacientes from './pages/gestor/GestorPacientes';
import PerfilPaciente from './pages/gestor/PerfilPaciente';
import MedicamentosGestor from './pages/gestor/MedicamentosGestor';
import ComunicadosGestor from './pages/gestor/ComunicadosGestor';   // Épico 3
import AgendamentosGestor from './pages/gestor/AgendamentosGestor'; // Épico 4
import GestorUsuarios from './pages/gestor/GestorUsuarios';         // Administração da equipe

// ─── Componente de Rota Protegida ─────────────────────────────────────────
// Impede acesso direto por URL sem autenticação e garante que o tipo de
// usuário bate com a rota (gestor não acessa rotas de paciente e vice-versa).
const ProtectedRoute = ({ children, tipo }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null; // Aguarda restauração da sessão do localStorage
  if (!isAuthenticated || user.tipo !== tipo) {
    return <Navigate to={tipo === 'gestor' ? '/login-gestor' : '/login-paciente'} replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      {/* Toaster global — exibe feedbacks de toast em qualquer rota */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontFamily: 'Inter, sans-serif', fontWeight: '600' },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* ── Raiz redireciona para login do paciente ── */}
          <Route path="/" element={<Navigate to="/login-paciente" replace />} />

          {/* ── Rotas públicas ── */}
          <Route path="/login-paciente"    element={<LoginPaciente />} />
          <Route path="/login-gestor"      element={<LoginGestor />} />
          <Route path="/cadastro-paciente" element={<CadastroPaciente />} />

          {/* ── Portal do Paciente (autenticado) ── */}
          <Route path="/paciente/dashboard"       element={<ProtectedRoute tipo="paciente"><DashboardPaciente /></ProtectedRoute>} />
          <Route path="/paciente/medicamentos"    element={<ProtectedRoute tipo="paciente"><Medicamentos /></ProtectedRoute>} />
          <Route path="/paciente/solicitacao/:id" element={<ProtectedRoute tipo="paciente"><DetalheSolicitacao /></ProtectedRoute>} />
          <Route path="/paciente/comunicados"     element={<ProtectedRoute tipo="paciente"><ComunicadosPaciente /></ProtectedRoute>} />
          <Route path="/paciente/agendamentos"    element={<ProtectedRoute tipo="paciente"><AgendamentosPaciente /></ProtectedRoute>} />

          {/* ── Portal do Gestor (autenticado) ── */}
          <Route path="/gestor/dashboard"     element={<ProtectedRoute tipo="gestor"><DashboardGestor /></ProtectedRoute>} />
          <Route path="/gestor/pacientes"     element={<ProtectedRoute tipo="gestor"><GestorPacientes /></ProtectedRoute>} />
          <Route path="/gestor/paciente/:id"  element={<ProtectedRoute tipo="gestor"><PerfilPaciente /></ProtectedRoute>} />
          <Route path="/gestor/medicamentos"  element={<ProtectedRoute tipo="gestor"><MedicamentosGestor /></ProtectedRoute>} />
          <Route path="/gestor/comunicados"   element={<ProtectedRoute tipo="gestor"><ComunicadosGestor /></ProtectedRoute>} />
          <Route path="/gestor/agendamentos"  element={<ProtectedRoute tipo="gestor"><AgendamentosGestor /></ProtectedRoute>} />
          <Route path="/gestor/usuarios"       element={<ProtectedRoute tipo="gestor"><GestorUsuarios /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
