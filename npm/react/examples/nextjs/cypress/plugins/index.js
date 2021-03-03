const injectNextDevServer = require('@cypress/react/plugins/next')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  injectNextDevServer(on, config)

  return config
}
