/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        bangers: ['"Bangers"', 'cursive', 'sans-serif'],
        comic: ['"Patrick Hand"', '"Comic Neue"', 'cursive', 'sans-serif'],
        sans: ['"Nunito"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        shin: {
          yellow:       '#FFD93D',
          'yellow-soft':'#FFEAA7',
          'yellow-dim': '#C69200',
          red:          '#E63946',
          'red-soft':   '#FF6B6B',
          'red-dark':   '#C1121F',
          blue:         '#8ECAE6',
          ocean:        '#219EBC',
          navy:         '#0F1026',
          card:         '#161836',
          border:       '#353966',
          cream:        '#FFF8E7',
          outline:      '#2B2D42',
          muted:        '#8D99AE',
          white:        '#FFFFFF',
        },
      },
      boxShadow: {
        sticker: '4px 4px 0px #2B2D42',
        'sticker-lg': '6px 6px 0px #2B2D42',
        'sticker-sm': '2px 2px 0px #2B2D42',
        'sticker-red': '4px 4px 0px #E63946',
        'sticker-yellow': '4px 4px 0px #FFD93D',
        'sticker-blue': '4px 4px 0px #8ECAE6',
      },
      animation: {
        'shin-bounce': 'shinBounce 2s ease-in-out infinite',
        'shin-wiggle': 'shinWiggle 1.5s ease-in-out infinite',
        'shin-float': 'shinFloat 5s ease-in-out infinite',
        'shin-pulse': 'shinPulse 2s ease-in-out infinite',
      },
      keyframes: {
        shinBounce: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        shinWiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%':      { transform: 'rotate(-4deg)' },
          '75%':      { transform: 'rotate(4deg)' },
        },
        shinFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':      { transform: 'translateY(-10px) rotate(2deg)' },
        },
        shinPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.04)', opacity: '0.85' },
        },
      },
    },
  },
  plugins: [],
};
