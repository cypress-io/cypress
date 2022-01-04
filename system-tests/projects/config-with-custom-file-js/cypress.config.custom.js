const { defineConfig } = require('cypress')

module.exports = defineConfig({
  pageLoadTimeout: 10000,
  e2e: {
    specPattern: 'cypress/integration/**/*',
    defaultCommandTimeout: 500,
    videoCompression: 20,
  },
})
