const { startDevServer } = require('@cypress/webpack-dev-server')
const findReactScriptsWebpackConfig = require('./findReactScriptsWebpackConfig')

module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    return startDevServer({ options, webpackConfig: findReactScriptsWebpackConfig(config) })
  })

  config.env.reactDevtools = true

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
