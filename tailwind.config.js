/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#10a37f',
          600: '#0e906f',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#10a37f',
          600: '#0e906f',
        },
      },
      /* スクロールバーのスタイリング */
      fontSize: {
        'code': '0.9375rem', // 15px
      },
    },
  },
};