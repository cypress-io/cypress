const plugin = require('./cypress/plugins')

module.exports = {
  'retries': null,
  'e2e': {
    setupNodeEvents (on, config) {
      return plugin(on, config)
    },
  },
}
