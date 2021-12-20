const path = require('path')
const { startDevServer } = require('@cypress/webpack-dev-server')
const tryLoadWebpackConfig = require('../utils/tryLoadWebpackConfig')
const { getLegacyDevServer } = require('../utils/legacy-setup-dev-server')

/** @type {(config: Cypress.PluginConfigOptions, path: string) => string} */
function normalizeWebpackPath (config, webpackConfigPath) {
  return path.isAbsolute(webpackConfigPath)
    ? webpackConfigPath
    : path.resolve(config.projectRoot, webpackConfigPath)
}
/**
 * Injects dev-server based on the webpack config file.
 *
 * **Important:** `webpackFilename` path is relative to the project root (cypress.json location)
 * @type {(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, options: { webpackFilename: string  }) => Cypress.PluginConfigOptions}
 */
function devServer (cypressDevServerConfig, { webpackFilename }) {
  const webpackConfig = tryLoadWebpackConfig(normalizeWebpackPath(cypressDevServerConfig.config, webpackFilename))

  if (!webpackConfig) {
    throw new Error(`Can not load webpack config from path ${webpackFilename}.`)
  }

  return startDevServer({
    options: cypressDevServerConfig,
    webpackConfig,
  })
}

// Legacy signature
module.exports = getLegacyDevServer(devServer, (config) => {
  config.env.reactDevtools = true

  return config
})

// New signature
module.exports.devServer = devServer

module.exports.defineDevServerConfig = function (devServerConfig) {
  return devServerConfig
}
