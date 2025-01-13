const { defineConfig } = require('cypress')

module.exports = defineConfig({
  retries: null,
  e2e: {
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support.js',
  },
})
