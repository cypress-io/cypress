/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')

const webpackConfig = {
  output: {
    publicPath: '/',
  },
}

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  if (config.testingType !== 'component') {
    throw Error(`This is an component testing project. testingType should be 'component'. Received ${config.testingType}`)
  }

  on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

  return config
}
