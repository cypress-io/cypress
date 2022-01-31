const { defineConfig } = require('cypress')

module.exports = defineConfig({
  retries: 2,
  defaultCommandTimeout: 5000,
  fixturesFolder: false,
  e2e: {
    setupNodeEvents (on, config) {
      return require('cypress/plugins/index.ts')(on, config)
    },
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.spec.{tsx,js}',
    defaultCommandTimeout: 10000,
    slowTestThreshold: 5000,
  },
  component: {
    specPattern: 'src/**/*.spec.{tsx,js}',
    slowTestThreshold: 5000,
    retries: 1,
  },
})
