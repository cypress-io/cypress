module.exports = {
  'video': false,
  'fixturesFolder': false,
  'testFiles': '**/*cy-spec.js',
  'viewportWidth': 500,
  'viewportHeight': 500,
  'componentFolder': 'src',
  'env': {
    'coverage': true,
  },
  config: {
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
