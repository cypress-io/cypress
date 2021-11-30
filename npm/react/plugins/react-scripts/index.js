const { startDevServer } = require('@cypress/webpack-dev-server')
const findReactScriptsWebpackConfig = require('./findReactScriptsWebpackConfig')
const { getLegacyDevServer } = require('../utils/legacy-setup-dev-server')

function devServer (cypressDevServerConfig, {
  webpackConfigPath,
  indexHtml,
} = {}) {
  return startDevServer({
    options: cypressDevServerConfig,
    webpackConfig: findReactScriptsWebpackConfig(cypressDevServerConfig.config, {
      webpackConfigPath: webpackConfigPath || 'react-scripts/config/webpack.config',
    }),
    indexHtml,
  })
}

// Legacy signature
module.exports = getLegacyDevServer(devServer, (config) => {
  config.env.reactDevtools = true

  return config
})

// New signature
module.exports.devServer = devServer
