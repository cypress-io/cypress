/// <reference types="cypress" />

const { useFixedFirefoxResolution } = require('../../../utils')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config, mode) => {
  if (mode !== 'e2e') {
    throw Error('This is an e2e project. mode should be `e2e`.')
  }

  on('before:browser:launch', (browser, options) => {
    useFixedFirefoxResolution(browser, options, config)

    return options
  })
}
