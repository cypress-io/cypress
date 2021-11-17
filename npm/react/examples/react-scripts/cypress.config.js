module.exports = {
  'video': false,
  'testFiles': '**/*cy-spec.js',
  'viewportWidth': 500,
  'viewportHeight': 800,
  'experimentalFetchPolyfill': true,
  'componentFolder': 'src',
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
