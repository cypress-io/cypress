const { startDevServer } = require('@cypress/webpack-dev-server')
const { createWebpackDevConfig } = require('@craco/craco')
const { getLegacySetupDevServer } = require('../utils/legacy-setup-dev-server')

function setupCracoDevServer (devServerConfig, cracoConfig) {
  return startDevServer({
    options: devServerConfig,
    webpackConfig: createWebpackDevConfig(cracoConfig),
  })
}

// Legacy signature
module.exports = getLegacySetupDevServer(setupCracoDevServer, (config) => {
  config.env.reactDevtools = true

  return config
})

// New signature
module.exports.setupCracoDevServer = setupCracoDevServer
