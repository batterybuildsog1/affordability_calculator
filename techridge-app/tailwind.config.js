/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#0a0a0f',
          900: '#141420',
          800: '#1e1e2e',
          700: '#2a2a3e',
          600: '#3a3a4e',
          500: '#4a4a5e',
          400: '#6a6a7e',
          300: '#8a8a9e',
          200: '#aaaaae',
          100: '#cacacf',
        },
        product: {
          apt: '#06b6d4', // cyan-500
          condo: '#8b5cf6', // violet-500
          blackridge: '#f59e0b', // amber-500
          townhouse: '#10b981', // emerald-500
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

