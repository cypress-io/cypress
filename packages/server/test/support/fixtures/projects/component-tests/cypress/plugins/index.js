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
module.exports = (on, config, mode) => {
  if (mode !== 'e2e') {
    throw Error('This is an e2e project. mode should be `e2e`.')
  }

  require('@cypress/code-coverage/task')(on, config)
  on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

  return config
}
