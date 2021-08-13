// @ts-check

// load file setupDevServer that comes with this plugin
// https://github.com/bahmutov/cypress-react-unit-test#install
const setupDevServer = require('@cypress/react/plugins/react-scripts')

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  setupDevServer(on, config)

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
