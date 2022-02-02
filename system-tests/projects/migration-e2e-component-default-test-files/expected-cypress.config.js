const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents (on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    specPattern: 'cypress/custom-integration/**/*.cy.{js,jsx,ts,tsx}',
  },
  component: {
    setupNodeEvents (on, config) {},
    specPattern: '**/*.cy.{js,jsx,ts,tsx}',
  },
})
