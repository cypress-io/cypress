const path = require('path')
const findNextWebpackConfig = require('./findNextWebpackConfig')
const { getLegacySetupDevServer } = require('../utils/legacy-setup-dev-server')

async function setupNextDevServer (devServerConfig) {
  const webpackConfig = await findNextWebpackConfig(devServerConfig.config)

  // require('webpack') now points to nextjs bundled version
  const { startDevServer } = require('@cypress/webpack-dev-server')

  return startDevServer({
    options: devServerConfig,
    webpackConfig,
    template: path.resolve(__dirname, 'index-template.html'),
  })
}

// Legacy signature
module.exports = getLegacySetupDevServer(setupNextDevServer, (config) => {
  config.env.reactDevtools = true

  return config
})

// New signature
module.exports.setupNextDevServer = setupNextDevServer
