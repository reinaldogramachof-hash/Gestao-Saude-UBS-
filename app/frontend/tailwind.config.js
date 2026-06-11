/**
 * TAILWIND CSS — CONFIGURAÇÃO (tailwind.config.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Define as classes CSS personalizadas do projeto.
 *         Tailwind lê este arquivo e gera apenas as classes que usamos,
 *         mantendo o arquivo CSS final pequeno.
 *
 * DESIGN TOKEN: As cores abaixo foram extraídas dos wireframes do Stitch e
 *               seguem o sistema Material Design 3 (paleta verde saúde).
 *               Cores com prefixo "on-" são para texto/ícones sobre aquela cor.
 * ─────────────────────────────────────────────────────────────────────────────
 */
/** @type {import('tailwindcss').Config} */
export default {
  // Quais arquivos o Tailwind deve escanear para gerar as classes
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],

  darkMode: 'class',

  theme: {
    extend: {
      // ─── Paleta de Cores (Material Design 3 — Verde Saúde) ────────────────
      colors: {
        // Cor primária: verde institucional
        'primary':                  '#006b2c',
        'primary-container':        '#00873a',
        'primary-fixed':            '#7ffc97',
        'primary-fixed-dim':        '#62df7d',
        'on-primary':               '#ffffff',
        'on-primary-container':     '#f7fff2',
        'on-primary-fixed':         '#002109',
        'on-primary-fixed-variant': '#005320',
        'inverse-primary':          '#62df7d',

        // Cor secundária: verde mais suave
        'secondary':                '#3b6842',
        'secondary-container':      '#baecbc',
        'secondary-fixed':          '#bdefbe',
        'secondary-fixed-dim':      '#a1d3a4',
        'on-secondary':             '#ffffff',
        'on-secondary-container':   '#406c46',
        'on-secondary-fixed':       '#002109',
        'on-secondary-fixed-variant': '#23502c',

        // Cor terciária: rosa (usado para urgências e alertas)
        'tertiary':                  '#a72d51',
        'tertiary-container':        '#c74668',
        'tertiary-fixed':            '#ffd9de',
        'tertiary-fixed-dim':        '#ffb2bf',
        'on-tertiary':               '#ffffff',
        'on-tertiary-container':     '#fffbff',
        'on-tertiary-fixed':         '#3f0016',
        'on-tertiary-fixed-variant': '#8a143c',

        // Cores de superfície (fundos, cards, containers)
        'surface':                    '#f6faf6',
        'surface-dim':                '#d7dbd7',
        'surface-bright':             '#f6faf6',
        'surface-container-lowest':   '#ffffff',
        'surface-container-low':      '#f1f5f1',
        'surface-container':          '#ebefeb',
        'surface-container-high':     '#e5e9e5',
        'surface-container-highest':  '#dfe3e0',
        'surface-variant':            '#dfe3e0',
        'surface-tint':               '#006e2d',
        'inverse-surface':            '#2d312f',
        'inverse-on-surface':         '#eef2ee',

        // Cores de texto e ícones
        'on-surface':                 '#181d1a',
        'on-surface-variant':         '#3e4a3d',
        'on-background':              '#181d1a',

        // Fundos gerais
        'background':                 '#f6faf6',

        // Bordas e divisores
        'outline':                    '#6e7b6c',
        'outline-variant':            '#bdcaba',

        // Estado de erro (vermelho)
        'error':                      '#ba1a1a',
        'error-container':            '#ffdad6',
        'on-error':                   '#ffffff',
        'on-error-container':         '#93000a',
      },

      // ─── Tipografia ────────────────────────────────────────────────────────
      fontFamily: {
        'headline': ['Manrope', 'sans-serif'],   // Títulos e destaques
        'body':     ['Inter', 'sans-serif'],      // Texto corrido
        'label':    ['Inter', 'sans-serif'],      // Labels e botões
      },

      // ─── Raios de borda ────────────────────────────────────────────────────
      borderRadius: {
        DEFAULT: '0.25rem',
        'lg':    '0.5rem',
        'xl':    '0.75rem',
        '2xl':   '1rem',
        '3xl':   '1.5rem',
        'full':  '9999px',
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'), // Estiliza inputs, selects e checkboxes automaticamente
  ],
};
