const devServer = require('@cypress/react/plugins/next')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  devServer(on, config)

  return config
}
