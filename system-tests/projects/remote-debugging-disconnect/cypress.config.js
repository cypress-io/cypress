module.exports = {
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      const plugins = require('./plugins')

      return plugins(on, config)
    },
  },
}
