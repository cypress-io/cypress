const { startDevServer } = require('@cypress/webpack-dev-server')
const findReactScriptsWebpackConfig = require('./findReactScriptsWebpackConfig')

function devServer (cypressDevServerConfig, {
  webpackConfigPath,
  indexHtmlFile,
} = {}) {
  return startDevServer({
    options: cypressDevServerConfig,
    webpackConfig: findReactScriptsWebpackConfig(cypressDevServerConfig.config, {
      webpackConfigPath: webpackConfigPath || 'react-scripts/config/webpack.config',
    }),
    indexHtmlFile,
  })
}

// New signature
module.exports.devServer = devServer
