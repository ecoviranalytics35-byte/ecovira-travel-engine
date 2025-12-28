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
          bg: {
            primary: 'var(--ec-bg-primary)',
            secondary: 'var(--ec-bg-secondary)',
            glass: 'var(--ec-bg-glass)',
            'glass-hover': 'var(--ec-bg-glass-hover)',
          },
          teal: {
            primary: 'var(--ec-teal-primary)',
            hover: 'var(--ec-teal-hover)',
            glow: 'var(--ec-teal-glow)',
            border: 'var(--ec-teal-border)',
            'border-hover': 'var(--ec-teal-border-hover)',
          },
          gold: {
            primary: 'var(--ec-gold-primary)',
            secondary: 'var(--ec-gold-secondary)',
            muted: 'var(--ec-gold-muted)',
          },
          text: {
            primary: 'var(--ec-text-primary)',
            secondary: 'var(--ec-text-secondary)',
            muted: 'var(--ec-text-muted)',
          },
        },
      },
      borderRadius: {
        'ec-card': 'var(--ec-radius-card)',
        'ec-button': 'var(--ec-radius-button)',
        'ec-input': 'var(--ec-radius-input)',
      },
      boxShadow: {
        'ec-glass': 'var(--ec-shadow-glass)',
        'ec-glass-hover': 'var(--ec-shadow-glass-hover)',
        'ec-button': 'var(--ec-shadow-button)',
        'ec-button-hover': 'var(--ec-shadow-button-hover)',
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