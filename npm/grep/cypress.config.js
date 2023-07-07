const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    defaultCommandTimeout: 1000,
    setupNodeEvents (on, config) {
      require('./src/plugin')(config)

      return config
    },
    specPattern: '**/spec.js',
    excludeSpecPattern: ['excludeSpecPatternAsArray'],
  },
  env: {
    grepFilterSpecs: true,
  },
  fixturesFolder: false,
  video: false,
})
