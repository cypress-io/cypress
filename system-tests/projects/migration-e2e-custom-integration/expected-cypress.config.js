const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents (on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
})
