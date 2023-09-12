const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    defaultCommandTimeout: 1000,
    setupNodeEvents (on, config) {
      require('./src/plugin')(config)

      return config
    },
    specPattern: '**/spec.js',
  },
  fixturesFolder: false,
})
