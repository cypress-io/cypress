const { defineConfig } = require('cypress')

module.exports = defineConfig({
  retries: 2,
  defaultCommandTimeout: 5000,
  fixturesFolder: false,
  e2e: {
    setupNodeEvents (on, config) {
      return require('cypress/plugins/index.ts')(on, config)
    },
    defaultCommandTimeout: 10000,
    slowTestThreshold: 5000,
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.spec.{tsx,js}',
  },
  component: {
    setupNodeEvents (on, config) {},
    slowTestThreshold: 5000,
    retries: 1,
    specPattern: '**/*.spec.{tsx,js}',
  },
})
