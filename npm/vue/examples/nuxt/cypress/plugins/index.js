/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')
const { getWebpackConfig } = require('nuxt')

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    // Use the modern configuration of webpack since we
    // will never use it with Internet Explorer within cypress
    let webpackConfig = await getWebpackConfig('modern', 'dev')

    return startDevServer({
      options,
      webpackConfig,
    })
  })

  return config
}
