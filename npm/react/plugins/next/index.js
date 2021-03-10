const { startDevServer } = require('@cypress/webpack-dev-server')
const findNextWebpackConfig = require('./findNextWebpackConfig')

module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    return startDevServer({ options, webpackConfig: await findNextWebpackConfig(config) })
  })

  config.env.reactDevtools = true

  return config
}
