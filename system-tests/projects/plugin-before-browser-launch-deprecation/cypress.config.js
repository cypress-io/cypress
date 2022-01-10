module.exports = {
  'e2e': {
<<<<<<< HEAD
    specPattern: 'cypress/e2e/**/*',
=======
    supportFile: false,
    specPattern: 'cypress/integration/**/*',
>>>>>>> origin/10.0-release
    setupNodeEvents (on, config) {
      const plugin = require('./plugins')

      return plugin(on, config)
    },
  },
}
