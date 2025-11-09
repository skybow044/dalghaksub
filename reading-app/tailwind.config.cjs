const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: colors.zinc[50],
        foreground: colors.zinc[900],
        border: colors.zinc[200],
        card: colors.white,
        muted: colors.zinc[100],
        'muted-foreground': colors.zinc[500],
        primary: colors.indigo[600]
      },
      fontFamily: {
        sans: ['"Inter"', '"IRANSansWeb"', ...defaultTheme.fontFamily.sans]
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};
