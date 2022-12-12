const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    defaultCommandTimeout: 1000,
    setupNodeEvents (on, config) {
      require('@cypress/grep/src/plugin')(config)

      return config
    },
    specPattern: '**/spec.js',
  },
  fixturesFolder: false,
  video: false,
})
