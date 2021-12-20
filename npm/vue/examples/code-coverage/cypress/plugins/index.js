/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')
const webpackConfig = require('../../webpack.config')

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  on('dev-server:start', (options) => {
    return startDevServer({
      options,
      webpackConfig,
    })
  })

  require('@cypress/code-coverage/task')(on, config)

  return config
}
