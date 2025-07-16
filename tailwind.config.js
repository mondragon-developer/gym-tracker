/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fff4e6',
          100: '#ffe4cc',
          200: '#ffc999',
          300: '#ffad66',
          400: '#ff9233',
          500: '#ff7700',
          600: '#e55a00',
          700: '#cc4400',
          800: '#b32e00',
          900: '#991700',
        },
        secondary: {
          50: '#e6f3ff',
          100: '#cce7ff',
          200: '#99cfff',
          300: '#66b7ff',
          400: '#339fff',
          500: '#0066cc',
          600: '#0052a3',
          700: '#003d7a',
          800: '#002952',
          900: '#001429',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        accent: {
          50: '#fef7ee',
          100: '#fdead7',
          200: '#fbd5ae',
          300: '#f7b27a',
          400: '#f38744',
          500: '#f0671f',
          600: '#e14d15',
          700: '#bb3a14',
          800: '#952f18',
          900: '#782917',
        }
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
}

