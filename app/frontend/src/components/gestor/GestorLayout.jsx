/**
 * COMPONENTE: GestorLayout.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Layout base de todas as páginas do portal do gestor.
 *         Gerencia o estado da sidebar (aberto/fechado) para mobile
 *         e garante o layout correto em desktop (sidebar fixo) e mobile (drawer).
 *
 * COMPORTAMENTO:
 *   - Desktop (lg+): sidebar sempre visível à esquerda (w-72), sem overlay
 *   - Mobile (<lg): sidebar oculta por padrão, aparece como drawer ao clicar no hamburger
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
        transition-transform duration-300 ease-in-out
        ${sidebarAberta ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Passa callback para o SideNav fechar o drawer ao clicar num link */}
        <SideNavGestor onFechar={() => setSidebarAberta(false)} />
      </div>

      {/* ── Área principal: topbar + conteúdo da página ── */}
      {/* min-w-0 evita overflow horizontal quando sidebar está fechada */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar recebe callback para abrir o drawer no mobile */}
        <TopBarGestor onAbrirSidebar={() => setSidebarAberta(true)} />

        {/* Padding responsivo: compacto no mobile, generoso no desktop */}
        <main className="p-4 md:p-6 lg:p-10 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
