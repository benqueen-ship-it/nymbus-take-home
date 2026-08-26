/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f2ff',
          100: '#cce5ff',
          200: '#99cbff',
          300: '#66b0ff',
          400: '#3396ff',
          500: '#0066FF',  // Primary blue (from AuraPOS logo)
          600: '#0055CC',  // Darker blue (Aura text)
          700: '#004499',
          800: '#003366',
          900: '#1E2A3A',  // Dark navy (POS text)
        },
        accent: {
          50: '#e6fff7',
          100: '#ccffef',
          200: '#99ffe0',
          300: '#66ffd0',
          400: '#33ffc1',
          500: '#00D4AA',  // Cyan/teal accent (inner ring)
          600: '#00AA88',
          700: '#008066',
          800: '#005544',
          900: '#002B22',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
