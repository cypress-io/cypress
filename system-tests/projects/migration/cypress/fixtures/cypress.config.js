const { defineConfig } = require('cypress')

module.export = defineConfig({
  retries: 2,
  defaultCommandTimeout: 5000,
  fixturesFolder: false,
  e2e: {
    setupNodeEvents(on, config) {
      return require('cypress/plugins/index.ts')
    },
    baseUrl: 'http://localhost:3000',
    specPattern: '**/*.spec.{tsx,js}',
    defaultCommandTimeout: 10000,
    slowTestThreshold: 5000,
  },
  component: {
    setupNodeEvents(on, config) {
      return require('cypress/plugins/index.ts')
    },
    baseUrl: 'http://localhost:3000',
    specPattern: '**/*.spec.{tsx,js}',
    slowTestThreshold: 5000,
    retries: 1,
  },
})