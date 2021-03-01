/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')
const webpackConfig = require('../../webpack.config')

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  require('@cypress/code-coverage/task')(on, config)
  on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

  return config
}
