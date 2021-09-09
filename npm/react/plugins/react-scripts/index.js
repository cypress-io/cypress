const { startDevServer } = require('@cypress/webpack-dev-server')
const findReactScriptsWebpackConfig = require('./findReactScriptsWebpackConfig')
const { getLegacyDevServer } = require('../utils/legacy-setup-dev-server')

function devServer (cypressDevServerConfig, {
  webpackConfigPath,
} = {
  webpackConfigPath: 'react-scripts/config/webpack.config',
}) {
  return startDevServer({
    options: cypressDevServerConfig,
    webpackConfig: findReactScriptsWebpackConfig(cypressDevServerConfig.config, {
      webpackConfigPath,
    }),
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
