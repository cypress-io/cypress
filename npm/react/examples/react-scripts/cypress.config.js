module.exports = {
  'video': false,
  'viewportWidth': 500,
  'viewportHeight': 800,
  'experimentalFetchPolyfill': true,
  'component': {
    'specPattern': 'src/**/*cy-spec.js',
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
