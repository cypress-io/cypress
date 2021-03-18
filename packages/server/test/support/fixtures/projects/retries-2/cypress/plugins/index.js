/// <reference types="cypress" />

const { useFixedFirefoxResolution } = require('../../../utils')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  if (config.testingType !== 'e2e') {
    throw Error(`This is an e2e testing project. testingType should be 'e2e'. Received ${config.testingType}`)
  }

  on('before:browser:launch', (browser, options) => {
    useFixedFirefoxResolution(browser, options, config)

    return options
  })
}
