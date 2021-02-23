/// <reference types="cypress" />
const path = require('path')
const percyHealthCheck = require('@percy/cypress/task')
const { startDevServer } = require('@cypress/webpack-dev-server')

function injectStylesInlineForPercyInPlace (webpackConfig) {
  webpackConfig.module.rules = webpackConfig.module.rules.map((rule) => {
    if (rule?.use[0]?.loader.includes('mini-css-extract-plugin')) {
      return {
        ...rule,
        use: [{
          loader: 'style-loader',
        }],
      }
    }

    return rule
  })
}
/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  on('task', percyHealthCheck)

  on('dev-server:start', (options) => {
    /** @type {import('webpack').Configuration} */
    const { default: webpackConfig } = require(path.resolve(__dirname, '..', '..', 'webpack.config.ts'))

    injectStylesInlineForPercyInPlace(webpackConfig)

    return startDevServer({
      webpackConfig,
      options,
    })
  })

  return config
}
