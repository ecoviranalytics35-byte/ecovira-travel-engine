/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ec: {
          bg: 'var(--ec-bg)',
          surface: 'var(--ec-surface)',
          'surface-2': 'var(--ec-surface-2)',
          ink: 'var(--ec-ink)',
          'ink-2': 'var(--ec-ink-2)',
          muted: 'var(--ec-muted)',
          border: 'var(--ec-border)',
          night: 'var(--ec-night)',
          'night-2': 'var(--ec-night-2)',
          'night-border': 'var(--ec-night-border)',
          gold: 'var(--ec-gold)',
          'gold-2': 'var(--ec-gold-2)',
          'gold-muted': 'var(--ec-gold-muted)',
          teal: 'var(--ec-teal)',
          'teal-2': 'var(--ec-teal-2)',
          'teal-muted': 'var(--ec-teal-muted)',
          success: 'var(--ec-success)',
          warn: 'var(--ec-warn)',
          error: 'var(--ec-error)',
          info: 'var(--ec-info)',
        },
      },
      borderRadius: {
        'ec-lg': 'var(--ec-radius-lg)',
        'ec-md': 'var(--ec-radius-md)',
        'ec-sm': 'var(--ec-radius-sm)',
      },
      boxShadow: {
        'ec-1': 'var(--ec-shadow-1)',
        'ec-2': 'var(--ec-shadow-2)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
      },
    },
  },
  plugins: [],
}