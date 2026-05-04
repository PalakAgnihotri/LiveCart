/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#7c3aed', dark: '#6d28d9', light: '#a78bfa' },
        live:  { DEFAULT: '#ef4444' },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      animation: {
        'pulse-live': 'pulse 1.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
