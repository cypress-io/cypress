module.exports = {
  'projectId': 'pid123',
  'e2e': {
    setupNodeEvents (on, config) {
      const plugin = require('./cypress/plugins')

      return plugin(on, config)
    },
  },
}
