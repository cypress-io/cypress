const preprocessor = require('cypress-react-unit-test/plugins/next')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  preprocessor(on, config)

  return config
}
