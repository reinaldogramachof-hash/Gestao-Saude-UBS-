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
    // Fundo externo acinzentado no desktop para destacar o card central
    <div className="h-screen bg-surface-container-low flex justify-center overflow-hidden">

      {/*
        Container principal — flex column com altura fixa da tela.
        O conteúdo scrollável fica em um filho interno (overflow-y-auto).
        O nav fica como último filho do flex, sempre fixo na base.
      */}
      <div className="w-full max-w-md bg-surface flex flex-col shadow-none md:shadow-2xl">

        {/*
          Área de conteúdo: ocupa todo o espaço disponível (flex-1)
          e rola independentemente. O padding-bottom reserva espaço
          para o nav quando ele está visível.
        */}
        <div className={`flex-1 overflow-y-auto ${semNav ? '' : 'pb-20'}`}>
          {children}
        </div>

        {/* Nav inferior — renderizada fora da área de scroll, sempre visível */}
        {!semNav && <BottomNavPaciente />}

      </div>
    </div>
  );
}
