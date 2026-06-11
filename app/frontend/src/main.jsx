/**
 * PONTO DE ENTRADA DO REACT (main.jsx)
 * ---------------------------------------------------------
 * Este arquivo é a raiz do nosso Frontend. Ele é o primeiro 
 * arquivo JS executado pelo navegador (definido no index.html).
 * Aqui nós pegamos o componente principal <App /> e o "injetamos" 
 * na div com id "root" do HTML usando o ReactDOM.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'  // Tailwind CSS + estilos globais (DEVE vir antes do App)
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)