/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')
const webpackConfig = require('../../webpack.config')

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  if (config.testingType !== 'component') {
    throw Error(`This is a component testing project. testingType should be 'component'. Received ${config.testingType}`)
  }

  require('@cypress/code-coverage/task')(on, config)
  on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

  return config
}
