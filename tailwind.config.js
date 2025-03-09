/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./app/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#10a37f',
          600: '#0e906f',
        },
      },
      fontSize: {
        'code': '0.9375rem', // 15px
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};