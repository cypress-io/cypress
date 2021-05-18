// @ts-check
const { startDevServer } = require('@cypress/vite-dev-server')

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  on('dev-server:start', (options) => startDevServer({ options }))

  return config
}
