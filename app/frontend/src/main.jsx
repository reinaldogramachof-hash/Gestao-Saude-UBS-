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
import * as Sentry from '@sentry/react'

// ---------------------------------------------------------
// SENTRY - Monitoramento de erros React em producao
// Ativo apenas no build de producao para capturar falhas reais
// de componentes e erros JS nao tratados sem gerar ruido local.
// ---------------------------------------------------------
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.1,
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
