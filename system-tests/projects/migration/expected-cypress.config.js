const { defineConfig } = require('cypress')

module.exports = defineConfig({
  retries: 2,
  defaultCommandTimeout: 5000,
  fixturesFolder: false,
  test: 'value',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents (on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    defaultCommandTimeout: 10000,
    slowTestThreshold: 5000,
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.spec.{tsx,js}',
  },
  component: {
    setupNodeEvents (on, config) {},
    slowTestThreshold: 500,
    retries: 1,
    specPattern: 'src/**/*.spec.{tsx,js}',
  },
})
