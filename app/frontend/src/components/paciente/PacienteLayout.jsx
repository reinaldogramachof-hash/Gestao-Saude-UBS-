/**
 * COMPONENTE: PacienteLayout.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Wrapper de layout para todas as páginas do portal do paciente.
 *
 * ARQUITETURA DE NAVEGAÇÃO (atualizada - TASK_12):
 *   Substitui o antigo BottomNavPaciente por um padrão Header + Drawer lateral (hamburger).
 *   O contêiner principal usa h-screen + flex-col para ocupar exatamente a tela.
 *   O HeaderPaciente fica fixo no topo com altura de 56px (h-14).
 *   O conteúdo interno (children) fica em uma div com overflow-y-auto e pt-14
 *   para compensar a barra superior fixa.
 *   O DrawerPaciente desliza da esquerda quando o hamburger menu (☰) é clicado.
 *
 * PROPS:
 *   - children: conteúdo da página
 *   - semNav: boolean — se true, oculta o Header superior e o Drawer lateral
 *             (usar em LoginPaciente, CadastroPaciente, DetalheSolicitacao)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeaderPaciente from './HeaderPaciente';
import DrawerPaciente from './DrawerPaciente';
import BottomNavSimples from './BottomNavSimples';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Intervalo curto e estável para manter o badge de avisos sincronizado mesmo
// quando o paciente permanece parado na mesma tela durante vários minutos.
const POLLING_COMUNICADOS_MS = 15000;

export default function PacienteLayout({ children, semNav = false }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pacienteDados, setPacienteDados] = useState(null);

  // Busca e monitora quantidade de comunicados não lidos a cada troca de rota,
  // por polling leve em segundo plano e por eventos globais disparados por
  // páginas internas quando alguma atualização relevante acontece.
  useEffect(() => {
    if (semNav || !user) return;
    
    const buscarContagem = () => {
      api.get('/paciente/comunicados')
        .then(r => {
          const unread = r.data.filter(c => !c.lido).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    };

    // Execução inicial ao montar ou trocar de rota
    buscarContagem();

    // Adiciona listener para escutar evento customizado disparado quando o paciente
    // marca comunicados como lidos dentro da página de comunicados.
    window.addEventListener('comunicado-lido', buscarContagem);
    window.addEventListener('comunicados-atualizados', buscarContagem);
    const pollingId = setInterval(buscarContagem, POLLING_COMUNICADOS_MS);
    
    // Cleanup dos listeners e do polling ao desmontar o componente
    return () => {
      clearInterval(pollingId);
      window.removeEventListener('comunicado-lido', buscarContagem);
      window.removeEventListener('comunicados-atualizados', buscarContagem);
    };
  }, [pathname, semNav, user]);

  // Carrega informações da UBS do paciente logado (como o nome para exibição no Drawer)
  useEffect(() => {
    if (semNav || !user) return;

    api.get('/paciente/meus-dados')
      .then(r => setPacienteDados(r.data))
      .catch(() => {});
  }, [semNav, user]);

  return (
    <div className="h-screen bg-surface flex flex-col overflow-hidden">
      
      {/* 
        Container principal:
        No novo modelo com Header fixo no topo, adicionamos o HeaderPaciente.
        O children ocupa flex-1 com pt-14 (56px) para compensar a barra superior fixa.
        O DrawerPaciente fica posicionado absolutamente, abrindo lateralmente.
      */}
      <div className="w-full flex flex-col h-full relative">
        
        {/* Header superior fixo */}
        {!semNav && (
          <HeaderPaciente 
            onOpenDrawer={() => setDrawerAberto(true)} 
            unreadCount={unreadCount} 
          />
        )}

        {/* Conteúdo scrollável principal */}
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden ${semNav ? '' : 'pb-20'}`}
          style={semNav ? {} : { paddingTop: 'var(--content-top)' }}
        >
          {children}
        </div>

        {/* Drawer lateral oculto/deslizante */}
        {!semNav && (
          <DrawerPaciente
            aberto={drawerAberto}
            onClose={() => setDrawerAberto(false)}
            unreadCount={unreadCount}
            pacienteNome={user?.nome}
            ubsNome={pacienteDados?.ubs?.nome || 'Carregando...'}
          />
        )}

        {/* Bottom Navigation fixa inferior de 3 botões */}
        {!semNav && <BottomNavSimples />}

      </div>
    </div>
  );
}
