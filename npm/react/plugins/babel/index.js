const getBabelWebpackConfig = require('./getBabelWebpackConfig')
const { startDevServer } = require('@cypress/webpack-dev-server')

module.exports = (on, config, moduleOptions) => {
  on('dev-server:start', async (options) => {
    return startDevServer({ options, webpackConfig: getBabelWebpackConfig(on, config, moduleOptions) })
  })

  config.env.reactDevtools = true

  return config
}
