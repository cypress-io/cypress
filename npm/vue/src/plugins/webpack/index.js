/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')

/**
 * Registers Cypress preprocessor for Vue component testing.
 * IMPORTANT to return the config object with
 * with the any changed environment variables.
 *
 * @param {Cypress.PluginConfigOptions} config Cypress config object.
 * @example
 *  // in your project's plugins/index.js file
 *  const preprocessor = require('@cypress/vue/dist/plugins/webpack')
 *  module.exports = (on, config) => {
 *    preprocessor(on, config)
 *    // IMPORTANT return the config object
 *    return config
 *  }
 */
const cypressPluginsFn = (on, config, webpackConfig) => {
  on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

  return config
}

module.exports = cypressPluginsFn
