/// <reference types="cypress" />
const { onFileDefaultPreprocessor } = require('../../preprocessor/webpack')

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
  require('@cypress/code-coverage/task')(on, config)
  on('file:preprocessor', onFileDefaultPreprocessor(config, webpackConfig))

  return config
}

module.exports = cypressPluginsFn
