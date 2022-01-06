const { defineConfig } = require('cypress')

module.exports = defineConfig({
  pageLoadTimeout: 10000,
  e2e: {
    supportFile: false,
    specPattern: 'cypress/integration/**/*',
    defaultCommandTimeout: 500,
    videoCompression: 20,
  },
})
