/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')
const webpackConfig = require('@vue/cli-service/webpack.config').default

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    delete webpackConfig.output

    return startDevServer({
      options,
      webpackConfig,
    })
  })

  return config
}
