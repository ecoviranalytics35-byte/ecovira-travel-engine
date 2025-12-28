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
          'bg-2': 'var(--ec-bg-2)',
          card: 'var(--ec-card)',
          'card-2': 'var(--ec-card-2)',
          border: 'var(--ec-border)',
          text: 'var(--ec-text)',
          muted: 'var(--ec-muted)',
          dim: 'var(--ec-dim)',
          teal: 'var(--ec-teal)',
          'teal-d': 'var(--ec-teal-d)',
          'teal-glow': 'var(--ec-teal-glow)',
          gold: 'var(--ec-gold)',
          'gold-2': 'var(--ec-gold-2)',
          'gold-glow': 'var(--ec-gold-glow)',
          // Legacy compatibility
          'bg-primary': 'var(--ec-bg-primary)',
          'bg-secondary': 'var(--ec-bg-secondary)',
          'bg-glass': 'var(--ec-bg-glass)',
          'bg-glass-hover': 'var(--ec-bg-glass-hover)',
          'teal-primary': 'var(--ec-teal-primary)',
          'teal-hover': 'var(--ec-teal-hover)',
          'teal-border': 'var(--ec-teal-border)',
          'teal-border-hover': 'var(--ec-teal-border-hover)',
          'gold-primary': 'var(--ec-gold-primary)',
          'gold-secondary': 'var(--ec-gold-secondary)',
          'text-primary': 'var(--ec-text-primary)',
          'text-secondary': 'var(--ec-text-secondary)',
          'text-muted': 'var(--ec-text-muted)',
        },
      },
      borderRadius: {
        'ec-card': 'var(--ec-r-lg)',
        'ec-button': 'var(--ec-r-md)',
        'ec-input': 'var(--ec-r-md)',
        'ec-lg': 'var(--ec-r-lg)',
        'ec-md': 'var(--ec-r-md)',
        'ec-sm': 'var(--ec-r-sm)',
      },
      boxShadow: {
        'ec-card': 'var(--ec-shadow-card)',
        'ec-hairline': 'var(--ec-shadow-hairline)',
        'ec-glass': 'var(--ec-shadow-glass)',
        'ec-glass-hover': 'var(--ec-shadow-glass-hover)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}