// tailwind.config.mjs
import containerQueries from '@tailwindcss/container-queries';
/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'selector',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
    },
  },
  plugins: [
    containerQueries,
  ],
};

export default config;
