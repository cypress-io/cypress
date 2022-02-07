module.exports = {
  'video': false,
  'fixturesFolder': false,
  'viewportWidth': 1000,
  'viewportHeight': 1000,
  'env': {
    'coverage': false,
  },
  'component': {
    setupNodeEvents (on, config) {
      // load file devServer that comes with this plugin
      // https://github.com/bahmutov/cypress-react-unit-test#install
      const devServer = require('@cypress/react/plugins/react-scripts')

      devServer(on, config)

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    },
  },
}

require('@applitools/eyes-cypress')(module)
