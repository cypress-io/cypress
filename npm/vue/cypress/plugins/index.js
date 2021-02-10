/// <reference types="cypress" />

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  require('@cypress/code-coverage/task')(on, config)
  require('../../dist/plugins/webpack/index.js')(on, config, require('../../webpack.config'))

  return config
}
