const getBabelWebpackConfig = require('./getBabelWebpackConfig')
const { startDevServer } = require('@cypress/webpack-dev-server')

module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    return startDevServer({ options, webpackConfig: getBabelWebpackConfig(on, config) })
  })

  config.env.reactDevtools = true

  return config
}
