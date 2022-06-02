const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents (on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    supportFile: 'src/platform/testing/e2e/cypress/support/index.js',
  },
})
