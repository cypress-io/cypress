const { defineConfig } = require('cypress')

module.exports = defineConfig({
  pageLoadTimeout: 10000,
  e2e: {
<<<<<<< HEAD
    specPattern: 'cypress/e2e/**/*',
=======
    supportFile: false,
    specPattern: 'cypress/integration/**/*',
>>>>>>> origin/10.0-release
    defaultCommandTimeout: 500,
    videoCompression: 20,
  },
})
