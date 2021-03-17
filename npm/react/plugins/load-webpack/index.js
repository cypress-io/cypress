// @ts-check
const path = require('path')
const { startDevServer } = require('@cypress/webpack-dev-server')
const tryLoadWebpackConfig = require('../utils/tryLoadWebpackConfig')

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
function injectWebpackDevServer (on, config, { webpackFilename }) {
  const webpackConfig = tryLoadWebpackConfig(normalizeWebpackPath(config, webpackFilename))

  if (!webpackConfig) {
    throw new Error(`Can not load webpack config from path ${webpackFilename}.`)
  }

  on('dev-server:start', async (options) => {
    return startDevServer({ options, webpackConfig })
  })

  config.env.reactDevtools = true

  return config
}

module.exports = injectWebpackDevServer
