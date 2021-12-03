module.exports = {
  'video': false,
  'viewportWidth': 500,
  'viewportHeight': 800,
  'experimentalFetchPolyfill': true,
  'componentFolder': 'cypress/components',
  'env': {
    'coverage': true,
  },
  'component': {
    'specPattern': '**/*.spec.{js,jsx}',
    setupNodeEvents (on, config) {
      const devServer = require('@cypress/react/plugins/next')

      devServer(on, config)

      return config
    },
  },
}
