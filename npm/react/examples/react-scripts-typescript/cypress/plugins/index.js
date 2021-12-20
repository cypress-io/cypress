const devServer = require('@cypress/react/plugins/react-scripts')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  devServer(on, config)

  return config
}
