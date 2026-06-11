/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefcff',
          100: '#d5f4ff',
          500: '#00BAF2',
          600: '#009cd3',
          700: '#002970',
          accent: '#00D084',
        },
        ink: {
          light: '#14213d',
          dark: '#f8fafc',
        },
      },
      boxShadow: {
        soft: '0 18px 45px rgba(20, 33, 61, 0.08)',
      },
    },
  },
  plugins: [],
};
