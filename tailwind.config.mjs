// tailwind.config.mjs

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'selector',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Você pode estender o tema aqui se quiser valores de desfoque personalizados,
      // mas para backdrop-blur-sm, os valores padrão do Tailwind já devem ser suficientes
      // uma vez que o utilitário seja gerado.
    },
  },
  // NOVO: A seção 'plugins' é crucial para Tailwind v4
  plugins: [
    // Este plugin é necessário para que as classes como backdrop-blur-sm sejam geradas
    // No Tailwind CSS v4, muitos utilitários são "opt-in" via plugins.
    // O backdrop-filter faz parte do conjunto de filtros.
    require('@tailwindcss/container-queries'), // Adicione este plugin se você precisar de container queries
    // Se o problema persistir, pode ser necessário um plugin mais específico para filtros
    // ou uma configuração direta no PostCSS para adicionar o backdrop-filter.
    // Por enquanto, vamos tentar com a configuração padrão do v4.
  ],
};

export default config;
