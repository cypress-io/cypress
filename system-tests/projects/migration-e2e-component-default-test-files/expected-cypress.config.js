const { defineConfig } = require('cypress')

module.exports = defineConfig({
  test: 'value',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents (on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    specPattern: 'cypress/custom-integration/**/*.cy.{js,jsx,ts,tsx}',
  },
  component: {
    setupNodeEvents (on, config) {},
    specPattern: 'cypress/custom-component/**/*.cy.{js,jsx,ts,tsx}',
  },
})
