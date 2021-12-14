const plugin = require('./cypress/plugins')

module.exports = {
  'retries': null,
  'e2e': {
    'supportFile': 'cypress/support/index.js',
    setupNodeEvents (on, config) {
      return plugin(on, config)
    },
  },
}
