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
  require('@cypress/code-coverage/task')(on, config)
  on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

  return config
}
