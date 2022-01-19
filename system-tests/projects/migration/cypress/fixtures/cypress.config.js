const { defineConfig } = require('cypress')

module.export = defineConfig({
  baseUrl: 'http://localhost:3000',
  retries: 2,
  defaultCommandTimeout: 5000,
  e2e: {
    setupNodeEvents(on, config) {
      require('/cypress/plugins/index.js')
    },
    defaultCommandTimeout: 10000,
    slowTestThreshold: 5000,
  },
  component: {
    setupNodeEvents(on, config) {
      require('/cypress/plugins/index.js')
    },
    slowTestThreshold: 5000,
    retries: 1,
  },
})