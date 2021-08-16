const returnInjectDevServerFunction = require('../utils/wrap-devserver')
const { startDevServer } = require('@cypress/webpack-dev-server')
const findReactScriptsWebpackConfig = require('./findReactScriptsWebpackConfig')

function startReactScriptsDevServer (options, {
  webpackConfigPath,
} = {
  webpackConfigPath: 'react-scripts/config/webpack.config',
}) {
  return startDevServer({
    options,
    webpackConfig: findReactScriptsWebpackConfig(options.config, {
      webpackConfigPath,
    }),
  })
}

module.exports = returnInjectDevServerFunction(startReactScriptsDevServer, (config) => {
  config.env.reactDevtools = true

  return config
})
