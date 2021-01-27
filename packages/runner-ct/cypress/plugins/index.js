/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')
const path = require('path')

module.exports = (on, config) => {
  on('dev-server:start', (options) => {
    // yarn tsc webpack.config.ts --esModuleInterop
    const config = path.resolve(__dirname, '..', '..', 'webpack.config.js')
    return startDevServer({
      webpackConfig: require(config).default,
      options,
    })
  })

  return config
}
