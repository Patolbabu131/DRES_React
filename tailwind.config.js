/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lightBackground: '#ffffff',
        lightSurface: '#ffffff',
        lightPrimary: '#386CFD',
        lightSecondary: '#6B8FFD',
        darkBackground: '#000000',
        darkSurface: '#0C0C0C',
        darkPrimary: '#2185D5',
        darkSecondary: '#4BA3EC',
      },
    },
  },
  plugins: [],
}