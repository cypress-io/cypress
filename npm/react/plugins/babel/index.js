const { startDevServer } = require('@cypress/webpack-dev-server')
const getBabelWebpackConfig = require('./getBabelWebpackConfig')
const { getLegacyDevServer } = require('../utils/legacy-setup-dev-server')

function devServer (cypressDevServerConfig, devServerConfig = {}) {
  return startDevServer({
    options: cypressDevServerConfig,
    webpackConfig: getBabelWebpackConfig(cypressDevServerConfig.config, devServerConfig),
    indexHtmlFile: devServerConfig.indexHtmlFile,
  })
}

// Legacy signature
module.exports = getLegacyDevServer(devServer, (config) => {
  config.env.reactDevtools = true

  return config
})

// New signature
module.exports.devServer = devServer
