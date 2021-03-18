/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')

const webpackConfig = {
  output: {
    publicPath: '/',
  },
  devServer: {
    publicPath: '/',
  },
}

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  if (config.testingType !== 'e2e') {
    throw Error(`This is an e2e testing project. testingType should be 'e2e'. Received ${config.testingType}`)
  }

  require('@cypress/code-coverage/task')(on, config)
  on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

  return config
}
