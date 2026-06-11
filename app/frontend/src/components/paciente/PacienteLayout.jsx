/**
 * COMPONENTE: PacienteLayout.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Wrapper de layout para todas as páginas do portal do paciente.
 *         No mobile: ocupa tela cheia naturalmente.
 *         No desktop: centraliza o conteúdo em max-w-md, simulando
 *         a experiência de app mobile (card centralizado com sombra).
 *         Inclui o BottomNavPaciente automaticamente em todas as páginas.
 *
 * PROPS:
 *   - children: conteúdo da página
 *   - semNav: boolean — se true, não renderiza o BottomNavPaciente
 *             (usar em páginas como login onde o nav não faz sentido)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import BottomNavPaciente from './BottomNavPaciente';

export default function PacienteLayout({ children, semNav = false }) {
  return (
    // Fundo externo levemente acinzentado no desktop para destacar o card
    <div className="min-h-screen bg-surface-container-low flex justify-center">

      {/*
        Container principal da página:
        - Mobile: largura total, sem sombra
        - Desktop: centralizado em max-w-md com sombra discreta
        - position: relative — necessário para o BottomNavPaciente (absolute)
          se posicionar corretamente dentro do card no desktop
      */}
      <div className={`
        w-full max-w-md bg-surface min-h-screen relative
        ${semNav ? '' : 'pb-24'}
        shadow-none md:shadow-2xl
      `}>
        {children}

        {/* Nav inferior — omitida em páginas de login */}
        {!semNav && <BottomNavPaciente />}
      </div>
    </div>
  );
}
