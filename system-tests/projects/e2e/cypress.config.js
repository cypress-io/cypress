const { defineConfig } = require('cypress')
const plugin = require('./cypress/plugins')

module.exports = defineConfig({
  retries: null,
  e2e: {
    setupNodeEvents (on, config) {
      return plugin(on, config)
    },
  },
})
