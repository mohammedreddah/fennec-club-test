/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFFFFF',
        sand: '#FBEAEC',
        ink: '#241416',
        fennec: {
          50: '#FDEEF0',
          100: '#F8CDD2',
          300: '#E8808C',
          500: '#C81E3A',
          600: '#A3132C',
          700: '#7A0E21',
        },
        dune: {
          50: '#F7F0F1',
          100: '#E8DADC',
          300: '#BDA0A3',
          600: '#5E4548',
        },
        pine: {
          500: '#2F5D50',
          600: '#234238',
        },
        present: '#2F5D50',
        absent: '#B3122A',
        pending: '#A3132C',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(36, 20, 22, 0.06), 0 4px 16px rgba(36, 20, 22, 0.06)',
      },
    },
  },
  plugins: [],
};
