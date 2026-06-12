// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fondos
        'bg-base':     '#0a0a0f',
        'bg-surface':  '#111118',
        'bg-elevated': '#18181f',
        'bg-overlay':  '#1f1f28',
        'bg-hover':    '#25252f',

        // Acentos
        accent:      '#e63946',
        'accent-dim':'#c42d3a',
        amber:       '#f4a261',
        'amber-dim': '#e07b3c',

        // Texto
        'text-primary':   '#f0eff4',
        'text-secondary': '#9190a0',
        'text-muted':     '#4e4d5c',
      },

      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        sans:    ['DM Sans', 'sans-serif'],
      },

      borderColor: {
        DEFAULT: 'rgba(255, 255, 255, 0.06)',
        hover:   'rgba(255, 255, 255, 0.12)',
        focus:   'rgba(230, 57, 70, 0.4)',
      },

      borderRadius: {
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        '2xl':'24px',
      },

      boxShadow: {
        sm:     '0 1px 3px rgba(0, 0, 0, 0.4)',
        md:     '0 4px 16px rgba(0, 0, 0, 0.5)',
        lg:     '0 8px 32px rgba(0, 0, 0, 0.6)',
        accent: '0 0 20px rgba(230, 57, 70, 0.2)',
      },

      animation: {
        'fade-in':      'fadeIn 0.4s ease both',
        'slide-right':  'slideRight 0.3s ease both',
        'skeleton':     'skeleton 1.5s infinite',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        skeleton: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },

      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl':'1536px',
      },
    },
  },
  plugins: [],
}

export default config
