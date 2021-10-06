const path = require('path')
const findNextWebpackConfig = require('./findNextWebpackConfig')
const { getLegacyDevServer } = require('../utils/legacy-setup-dev-server')

async function devServer (cypressDevServerConfig, { indexHtml } = {}) {
  const webpackConfig = await findNextWebpackConfig(cypressDevServerConfig.config)

  // require('webpack') now points to nextjs bundled version
  const { startDevServer } = require('@cypress/webpack-dev-server')

  return startDevServer({
    options: cypressDevServerConfig,
    webpackConfig,
    indexHtml: indexHtml || path.resolve(__dirname, 'index-template.html'),
  })
}

// Legacy signature
module.exports = getLegacyDevServer(devServer, (config) => {
  config.env.reactDevtools = true

  return config
})

// New signature
module.exports.devServer = devServer
