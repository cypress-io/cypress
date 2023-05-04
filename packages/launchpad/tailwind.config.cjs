const config = require('@packages/frontend-shared/tailwind.config.cjs')

config.content.files = [
  './src/**/*.{vue,js,ts,jsx,tsx,scss,css}', //
  '../frontend-shared/src/**/*.{vue,js,ts,jsx,tsx,scss,css}',
],

module.exports = config
