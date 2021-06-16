const { startDevServer } = require('@cypress/webpack-dev-server')
const findReactScriptsWebpackConfig = require('./findReactScriptsWebpackConfig')

module.exports = (
  on,
  config, {
    webpackConfigPath,
  } = {
    webpackConfigPath: 'react-scripts/config/webpack.config',
  },
) => {
  on('dev-server:start', async (options) => {
    return startDevServer({
      options,
      webpackConfig: findReactScriptsWebpackConfig(config, {
        webpackConfigPath,
      }),
    })
  })

  config.env.reactDevtools = true

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
