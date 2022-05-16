const { defineConfig } = require('cypress')
const plugin = require('./cypress/plugins')

module.exports = defineConfig({
  retries: null,
  e2e: {
    specPattern: 'cypress/e2e/**/*.{js,jsx,mjs,ts,tsx,coffee}',
    setupNodeEvents (on, config) {
      return plugin(on, config)
    },
  },
})
