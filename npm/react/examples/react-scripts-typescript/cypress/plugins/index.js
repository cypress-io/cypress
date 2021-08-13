// @ts-check

const injectDevServer = require('@cypress/react/plugins/react-scripts')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  injectDevServer(on, config)

  return config
}
