module.exports = {
  'e2e': {
    specPattern: 'cypress/integration/**/*',
    setupNodeEvents (on, config) {
      const plugin = require('./plugins')

      return plugin(on, config)
    },
  },
}
