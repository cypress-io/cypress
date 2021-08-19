const { startDevServer } = require('@cypress/webpack-dev-server')
const findReactScriptsWebpackConfig = require('./findReactScriptsWebpackConfig')
const { getLegacySetupDevServer } = require('../utils/legacy-setup-dev-server')

function setupReactScriptsDevServer (devServerConfig, {
  webpackConfigPath,
} = {
  webpackConfigPath: 'react-scripts/config/webpack.config',
}) {
  return startDevServer({
    options: devServerConfig,
    webpackConfig: findReactScriptsWebpackConfig(devServerConfig.config, {
      webpackConfigPath,
    }),
  })
}

// Legacy signature
module.exports = getLegacySetupDevServer(setupReactScriptsDevServer, (config) => {
  config.env.reactDevtools = true

  return config
})

// New signature
module.exports.setupReactScriptsDevServer = setupReactScriptsDevServer
