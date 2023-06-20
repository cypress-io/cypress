module.exports = {
  'projectId': 'pid123',
  'videoUploadOnPasses': false,
  'defaultCommandTimeout': 9999,
  'e2e': {
    setupNodeEvents (on, config) {
      const plugin = require('./cypress/plugins')

      return plugin(on, config)
    },
  },
}
