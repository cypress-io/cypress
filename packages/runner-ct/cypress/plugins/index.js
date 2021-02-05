/// <reference types="cypress" />
const path = require('path')
const percyHealthCheck = require('@percy/cypress/task')
const { startDevServer } = require('@cypress/webpack-dev-server')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  on('task', percyHealthCheck)
  on('dev-server:start', (options) => {
    const config = path.resolve(__dirname, '../../webpack.config.ts')

    return startDevServer({
      webpackConfig: require(config).default,
      options,
    })
  })

  return config
}
