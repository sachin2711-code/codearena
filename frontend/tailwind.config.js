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
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        shin: {
          bg:      '#0d0b1e',
          panel:   '#13112a',
          border:  '#2a2550',
          yellow:  '#FFD700',
          'yellow-soft': '#FFE566',
          'yellow-dim':  '#7a6500',
          red:     '#E8192C',
          'red-soft': '#FF4D5E',
          'red-dim':  '#6b0010',
          blue:    '#4FC3F7',
          'blue-soft': '#B3E5FC',
          'blue-dim':  '#0d4a66',
          white:   '#F5F0FF',
          muted:   '#7b75a8',
        },
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow':  'bounce 2s infinite',
        'spin-slow':    'spin 3s linear infinite',
        'shin-bounce':  'shinBounce 1.8s ease-in-out infinite',
        'shin-pulse':   'shinPulse 2s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
      },
      keyframes: {
        shinBounce: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-5px)' },
        },
        shinPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
