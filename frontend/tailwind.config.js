/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#f5f1eb',
        ink: '#171717',
        accent: '#1f6feb',
        ember: '#ff8a4c',
        mist: '#eef2f8',
      },
      boxShadow: {
        panel: '0 16px 40px rgba(15, 23, 42, 0.08)',
        soft: '0 6px 22px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui'],
        display: ['"Fraunces"', 'ui-serif', 'Georgia'],
      },
      backgroundImage: {
        grid: 'radial-gradient(circle at 1px 1px, rgba(31,111,235,0.16) 1px, transparent 0)',
      },
    },
  },
  plugins: [],
};
