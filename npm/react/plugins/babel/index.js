const returnSetupDevServerFunction = require('../utils/return-setupdevserver-function')
const getBabelWebpackConfig = require('./getBabelWebpackConfig')
const { startDevServer } = require('@cypress/webpack-dev-server')

function startBabelDevServer (options, moduleOptions) {
  return startDevServer({ options, webpackConfig: getBabelWebpackConfig(options.config, moduleOptions) })
}

module.exports = returnSetupDevServerFunction(startBabelDevServer, (config) => {
  config.env.reactDevtools = true

  return config
})
