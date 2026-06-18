/**
 * COMPONENTE: GestorLayout.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Layout base de todas as páginas do portal do gestor.
 *         Gerencia a abertura do drawer no mobile e o modo retraído persistente
 *         no desktop, garantindo que os dois comportamentos sejam independentes.
 *
 * COMPORTAMENTO:
 *   - Desktop (lg+): sidebar sempre visível, alternando entre w-72 e w-16
 *   - Mobile (<lg): sidebar oculta por padrão, aparece como drawer ao clicar no hamburger
 *   - Mobile ignora o modo retraído e sempre usa a largura completa w-72
 *   - Overlay escuro semi-transparente cobre o conteúdo quando sidebar está aberta no mobile
 *
 * PROPS:
 *   - children: conteúdo da página (renderizado no <main> interno)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import SideNavGestor from './SideNavGestor';
import TopBarGestor from './TopBarGestor';

export default function GestorLayout({ children }) {
  // Estado controla visibilidade do sidebar — fechado por padrão no mobile
  const [sidebarAberta, setSidebarAberta] = useState(false);
  // A preferência de largura pertence apenas ao desktop e sobrevive ao refresh.
  const [retraida, setRetraida] = useState(() =>
    localStorage.getItem('gestao_ubs_sidebar_retraida') === 'true'
  );

  // Persiste imediatamente a preferência para manter a interface consistente
  // quando o gestor navega, recarrega a página ou inicia uma nova sessão.
  const toggleSidebar = () => {
    const novoValor = !retraida;
    setRetraida(novoValor);
    localStorage.setItem('gestao_ubs_sidebar_retraida', String(novoValor));
  };

  return (
    <div className="bg-surface min-h-screen flex text-on-surface font-body">

      {/* ── Overlay: aparece quando o drawer está aberto no mobile ── */}
      {/* Clicar no overlay fecha o sidebar sem navegar */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      {/* ── Sidebar: drawer deslizante no mobile, coluna fixa no desktop ── */}
      {/* No mobile: position fixed + translateX animado */}
      {/* No desktop (lg+): position sticky, sempre visível, sem transform */}
      <div className={`
        fixed lg:sticky top-0 h-screen z-40
        transition-all duration-300 ease-in-out
        ${sidebarAberta ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${retraida ? 'lg:w-16' : 'lg:w-72'} w-72
      `}>
        {/* O SideNav recebe separadamente o fechamento mobile e o toggle desktop. */}
        <SideNavGestor
          onFechar={() => setSidebarAberta(false)}
          retraida={retraida}
          onToggle={toggleSidebar}
        />
      </div>

      {/* ── Área principal: topbar + conteúdo da página ── */}
      {/* min-w-0 evita overflow horizontal quando sidebar está fechada */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar recebe callback para abrir o drawer no mobile */}
        <TopBarGestor onAbrirSidebar={() => setSidebarAberta(true)} />

        {/* Padding responsivo: compacto no mobile, generoso no desktop */}
        <main className="flex-1 overflow-y-auto bg-surface">
          <div className="max-w-screen-2xl mx-auto w-full p-4 md:p-6 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
