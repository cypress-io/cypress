const { startDevServer } = require('@cypress/webpack-dev-server')
const findReactScriptsWebpackConfig = require('./findReactScriptsWebpackConfig')
const { getLegacyDevServer } = require('../utils/legacy-setup-dev-server')
const fs = require('fs')
const path = require('path')

function devServer (cypressDevServerConfig, {
  webpackConfigPath,
} = {
  webpackConfigPath: 'react-scripts/config/webpack.config',
}) {
  if (fs.existsSync(path.join(cypressDevServerConfig.config.projectRoot, '.storybook'))) {
    cypressDevServerConfig.preview = {
      files: [],
      loaderFn: path.join(__dirname, '../../dist/react-scripts/preview-storybook.js'),
    }

    cypressDevServerConfig.config.addTranspiledFolders = (cypressDevServerConfig.config.addTranspiledFolders || []).concat('.storybook')
  }

  return startDevServer({
    options: cypressDevServerConfig,
    webpackConfig: findReactScriptsWebpackConfig(cypressDevServerConfig.config, {
      webpackConfigPath,
    }),
  })
}

// Legacy signature
module.exports = getLegacyDevServer(devServer, (config) => {
  // config.env.reactDevtools = true

  return config
})

// New signature
module.exports.devServer = devServer

module.exports.defineDevServerConfig = function (devServerConfig) {
  return devServerConfig
}
