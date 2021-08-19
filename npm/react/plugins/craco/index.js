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
// - Note that this also includes a change to the second argument!
module.exports.setupCracoDevServer = (devServerConfig, { cracoConfig }) => {
  return setupCracoDevServer(devServerConfig, cracoConfig)
}
