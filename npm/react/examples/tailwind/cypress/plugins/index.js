// load file preprocessor that comes with this plugin
// https://github.com/bahmutov/cypress-react-unit-test#install
const injectReactScriptsDevServer = require('@cypress/react/plugins/react-scripts')

module.exports = (on, config) => {
  injectReactScriptsDevServer(on, config)

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
