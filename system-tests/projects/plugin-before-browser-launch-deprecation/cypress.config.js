module.exports = {
  'e2e': {
    supportFile: false,
    specPattern: 'cypress/integration/**/*',
    setupNodeEvents (on, config) {
      const plugin = require('./plugins')

      return plugin(on, config)
    },
  },
}
