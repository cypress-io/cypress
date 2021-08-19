const path = require('path')
const { startDevServer } = require('@cypress/webpack-dev-server')
const tryLoadWebpackConfig = require('../utils/tryLoadWebpackConfig')
const { getLegacySetupDevServer } = require('../utils/legacy-setup-dev-server')

/** @type {(config: Cypress.PluginConfigOptions, path: string) => string} */
function normalizeWebpackPath (config, webpackConfigPath) {
  return path.isAbsolute(webpackConfigPath)
    ? webpackConfigPath
    : path.resolve(config.projectRoot, webpackConfigPath)
}

function setupWebpackDevServer (devServerConfig, { webpackFilename }) {
  const webpackConfig = tryLoadWebpackConfig(normalizeWebpackPath(devServerConfig.config, webpackFilename))

  if (!webpackConfig) {
    throw new Error(`Can not load webpack config from path ${webpackFilename}.`)
  }

  return startDevServer({
    options: devServerConfig,
    webpackConfig,
  })
}

// Legacy signature
module.exports = getLegacySetupDevServer(setupWebpackDevServer, (config) => {
  config.env.reactDevtools = true

  return config
})

// New signature
module.exports.setupWebpackDevServer = setupWebpackDevServer
