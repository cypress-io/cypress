module.exports = {
  'projectId': 'pid123',
  'videoUploadOnPasses': true,
  'e2e': {
    'supportFile': 'cypress/support/index.js',
    setupNodeEvents (on, config) {
      const plugin = require('./cypress/plugins')

      return plugin(on, config)
    },
  },
}
