/**
 * COMPONENTE PRINCIPAL DE ROTAS (App.jsx)
 * ---------------------------------------------------------
 * O App.jsx é o container central do nosso app.
 * Aqui configuramos o React Router para cuidar das páginas.
 * O Router avalia a URL atual do navegador e renderiza
 * o elemento correspondente (ex: "/login-paciente").
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login-paciente" element={<div>Login do Paciente</div>} />
        <Route path="/paciente/dashboard" element={<div>Dashboard do Paciente</div>} />
        <Route path="/login-gestor" element={<div>Login do Gestor</div>} />
        <Route path="/gestor/dashboard" element={<div>Dashboard Principal do Gestor</div>} />
      </Routes>
    </Router>
  );
}

export default App;