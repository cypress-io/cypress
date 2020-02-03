/// <reference path="../../../../../../../../../cli/types/index.d.ts"/>

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  on('before:browser:launch', (browser, options) => {
    options.windowSize = 'fullscreen'

    return options
  })
}
