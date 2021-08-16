const path = require('path')
const returnInjectDevServerFunction = require('../utils/wrap-devserver')
const { startDevServer } = require('@cypress/webpack-dev-server')
const tryLoadWebpackConfig = require('../utils/tryLoadWebpackConfig')

/** @type {(config: Cypress.PluginConfigOptions, path: string) => string} */
function normalizeWebpackPath (config, webpackConfigPath) {
  return path.isAbsolute(webpackConfigPath)
    ? webpackConfigPath
    : path.resolve(config.projectRoot, webpackConfigPath)
}

function startWebpackDevServer (options, { webpackFilename }) {
  const webpackConfig = tryLoadWebpackConfig(normalizeWebpackPath(options.config, webpackFilename))

  if (!webpackConfig) {
    throw new Error(`Can not load webpack config from path ${webpackFilename}.`)
  }

  return startDevServer({ options, webpackConfig })
}

module.exports = returnInjectDevServerFunction(startWebpackDevServer, (config) => {
  config.env.reactDevtools = true

  return config
})
