const preprocessor = require('@cypress/react/plugins/next')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  preprocessor(on, config)

  return config
}
