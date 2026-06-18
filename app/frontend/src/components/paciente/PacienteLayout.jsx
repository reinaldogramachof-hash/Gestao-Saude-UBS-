/**
 * COMPONENTE: PacienteLayout.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Wrapper de layout para todas as páginas do portal do paciente.
 *
 * ARQUITETURA DE SCROLL (atualizada):
 *   O container usa h-screen + flex-col para ocupar exatamente a tela.
 *   O conteúdo interno (children) fica em uma div com overflow-y-auto,
 *   que é a única área que rola. O BottomNavPaciente fica FORA dessa div,
 *   como último item do flex — sempre visível, nunca rola.
 *
 *   Desktop: centralizado em max-w-md com sombra, simulando app mobile.
 *   Mobile: tela cheia, comportamento idêntico a um app nativo.
 *
 * PROPS:
 *   - children: conteúdo da página
 *   - semNav: boolean — se true, oculta o BottomNavPaciente
 *             (usar em LoginPaciente, CadastroPaciente, DetalheSolicitacao)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import BottomNavPaciente from './BottomNavPaciente';

export default function PacienteLayout({ children, semNav = false }) {
  return (
    // Removido max-w-md e fundo externo
    <div className="h-screen bg-surface flex flex-col overflow-hidden">

      {/*
        Container principal — flex column com altura fixa da tela.
        O conteúdo scrollável fica em um filho interno (overflow-y-auto).
        A barra de navegação sobe para o topo no desktop via order-first.
      */}
      <div className="w-full flex flex-col h-full">

        {/*
          Área de conteúdo: ocupa todo o espaço disponível (flex-1)
          e rola independentemente.
        */}
        <div className={`flex-1 overflow-y-auto ${semNav ? '' : 'pb-20 md:pb-0'}`}>
          {children}
        </div>

        {/* Nav inferior (mobile) / superior (desktop via order-first) */}
        {!semNav && <BottomNavPaciente />}

      </div>
    </div>
  );
}
