const { defineConfig } = require('cypress')

module.exports = defineConfig({
  pageLoadTimeout: 10000,
  e2e: {
    specPattern: 'cypress/e2e/**/*',
    supportFile: false,
    defaultCommandTimeout: 500,
    videoCompression: 20,
  },
})
