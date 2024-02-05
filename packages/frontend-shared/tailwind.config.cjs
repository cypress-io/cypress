const cypressCSS = require('@cypress-design/css')

const containerPlugin = require('@tailwindcss/container-queries')

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [cypressCSS.TailwindConfig()],
  content: {
    files: [
      '../../node_modules/@cypress-design/vue-*/dist/*.js',
      './src/**/*.{vue,js,ts,jsx,tsx,scss,css}',
    ],
    extract: ['vue', 'js', 'tsx'].reduce((acc, ext) => {
      acc[ext] = cypressCSS.TailwindIconExtractor

      return acc
    }, {}),
  },
  theme: {
    extend: {
      zIndex: {
        '1': '1',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        '51': '51',
      },
      rotate: {
        '270': '270deg',
      },
    },
  },
  plugins: [
    containerPlugin,
    function ({ addVariant }) {
      addVariant('children', '& > *')
    },
  ],
}
