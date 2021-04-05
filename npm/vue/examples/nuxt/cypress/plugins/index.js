/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')
const { getWebpackConfig } = require('nuxt')

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    let webpackConfig = await getWebpackConfig('client', {
      for: 'dev',
    })

    startDevServer({ options, webpackConfig })
  })

  return config
}
