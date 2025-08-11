/** @type {import('tailwindcss').Config} */

const { TailwindConfig, TailwindIconExtractor } = require('@cypress-design/css')
const path = require('path')

module.exports = {
  presets: [TailwindConfig()],
  content: {
    files: [
      './src/**/*.{js,jsx,ts,tsx}',
      './index.html',
      path.resolve(
        __dirname,
        '../../node_modules/@cypress-design/*/dist/*.js|ts',
      ),
    ],
    extract: ['mdx', 'tsx', 'jsx', 'js', 'ts'].reduce((acc, ext) => {
      acc[ext] = TailwindIconExtractor

      return acc
    }, {}),
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
