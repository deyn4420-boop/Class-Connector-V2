import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg': '#080d17',
        'bg-light': '#0f1623',
        'surface': '#111827',
        'surface-2': '#1f2937',
        'surface-3': '#2d3748',
        'border': '#2d3748',
        'primary': '#6366f1',
        'primary-h': '#4f46e5',
        'primary-light': '#818cf8',
        'green': '#10b981',
        'amber': '#f59e0b',
        'red': '#ef4444',
        'text': '#f1f5f9',
        'muted': '#9ca3af',
      },
      borderRadius: {
        'xs': '6px',
        'sm': '8px',
        'base': '12px',
        'lg': '14px',
      },
      fontFamily: {
        'syne': ['Syne', 'sans-serif'],
        'outfit': ['Outfit', 'sans-serif'],
      },
      animation: {
        'fadeInUp': 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'slideInLeft': 'slideInLeft 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-gentle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          'from': { 'opacity': '0', 'transform': 'translateY(20px)' },
          'to': { 'opacity': '1', 'transform': 'translateY(0)' },
        },
        slideInLeft: {
          'from': { 'opacity': '0', 'transform': 'translateX(-10px)' },
          'to': { 'opacity': '1', 'transform': 'translateX(0)' },
        },
      },
      boxShadow: {
        'sm': '0 4px 12px rgba(0,0,0,0.1)',
        'md': '0 10px 30px rgba(0,0,0,0.3)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
