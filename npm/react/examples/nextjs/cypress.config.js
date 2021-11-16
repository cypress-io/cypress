module.exports = {
  'video': false,
  'testFiles': '**/*.spec.{js,jsx}',
  'viewportWidth': 500,
  'viewportHeight': 800,
  'experimentalFetchPolyfill': true,
  'componentFolder': 'cypress/components',
  'env': {
    'coverage': true,
  },
  'component': {
    setupNodeEvents (on, config) {
      const devServer = require('@cypress/react/plugins/next')

      devServer(on, config)

      return config
    },
  },
}
