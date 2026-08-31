/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        floor: {
          950: '#0a0e14',
          900: '#0f1419',
          800: '#151c25',
          700: '#1c2632',
          600: '#24303f',
        },
        slot: {
          gold: '#d4a853',
          red: '#c94a4a',
          green: '#3d9b5c',
          amber: '#e5a84a',
        },
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: { '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
}
