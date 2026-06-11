/**
 * POSTCSS — CONFIGURAÇÃO (postcss.config.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: O PostCSS é uma ferramenta que transforma CSS.
 *         O Tailwind usa o PostCSS para processar as classes utilitárias
 *         e gerar o arquivo CSS final. O Autoprefixer adiciona prefixos
 *         de compatibilidade com navegadores mais antigos (-webkit-, etc).
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default {
  plugins: {
    tailwindcss:  {},  // Processa as classes do Tailwind
    autoprefixer: {},  // Adiciona prefixos para compatibilidade de navegador
  },
};
