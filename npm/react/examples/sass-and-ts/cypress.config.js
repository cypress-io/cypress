module.exports = {
  'video': false,
  'fixturesFolder': false,
  'viewportWidth': 500,
  'viewportHeight': 500,
  'env': {
    'coverage': true,
  },
  'component': {
    setupNodeEvents (on, config) {
      // load Webpack file devServer that comes with this plugin
      // https://github.com/bahmutov/cypress-react-unit-test#install
      const devServer = require('@cypress/react/plugins/load-webpack')

      devServer(on, config, {
        webpackFilename: 'webpack.config.js',
      })

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    },
  },
}
