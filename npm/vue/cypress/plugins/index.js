/// <reference types="cypress" />

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  if (config.testingType !== 'component') {
    throw Error(`This is a component testing project. testingType should be 'component'. Received ${config.testingType}`)
  }

  require('@cypress/code-coverage/task')(on, config)
  require('../../dist/plugins/webpack')(on, config, require('../../webpack.config'))

  return config
}
