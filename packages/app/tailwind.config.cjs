const cypressCSS = require('@cypress-design/css')

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [cypressCSS.TailwindConfig()],
  content: {
    files: [
      './src/**/*.{vue,js,ts,jsx,tsx,scss,css}', //
      '../frontend-shared/src/**/*.{vue,js,ts,jsx,tsx,scss,css}',
    ],
    extract: ['vue', 'js', 'tsx'].reduce((acc, ext) => {
      acc[ext] = cypressCSS.TailwindIconExtractor

      return acc
    }, {}),
  },
}
