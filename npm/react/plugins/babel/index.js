const { startDevServer } = require('@cypress/webpack-dev-server')
const getBabelWebpackConfig = require('./getBabelWebpackConfig')
const { getLegacySetupDevServer } = require('../utils/legacy-setup-dev-server')

function setupBabelDevServer (devServerConfig, options) {
  return startDevServer({
    options: devServerConfig,
    webpackConfig: getBabelWebpackConfig(devServerConfig.config, options),
  })
}

// Legacy signature
module.exports = getLegacySetupDevServer(setupBabelDevServer, (config) => {
  config.env.reactDevtools = true

  return config
})

// New signature
module.exports.setupBabelDevServer = setupBabelDevServer
