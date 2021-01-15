/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')
const path = require('path')

module.exports = (on, config) => {
  on('dev-server:start', (options) => {
    return startDevServer({
      webpackConfigPath: path.resolve(__dirname, '..', '..', 'node_modules', '@vue', 'cli-service', 'webpack.config.js'),
      options,
    })
  })

  return config
}
