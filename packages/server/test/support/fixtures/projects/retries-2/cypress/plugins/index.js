/// <reference types="cypress" />

const { useFixedFirefoxResolution } = require('../../../utils')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  on('before:browser:launch', (browser, options) => {
    useFixedFirefoxResolution(browser, options, config)

    return options
  })
}
