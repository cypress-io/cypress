const { defineConfig } = require('cypress')
const cypressGrepPlugin = require('./src/plugin')

module.exports = defineConfig({
  e2e: {
    defaultCommandTimeout: 1000,
    setupNodeEvents (on, config) {
      cypressGrepPlugin(config)

      on('task', {
        grep (config) {
          return cypressGrepPlugin(config)
        },
      })

      return config
    },
    specPattern: '**/spec.js',
  },
  fixturesFolder: false,
})
