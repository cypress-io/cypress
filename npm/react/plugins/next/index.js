const findNextWebpackConfig = require('./findNextWebpackConfig')

module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    const webpackConfig = await findNextWebpackConfig(config)

    // require('webpack') now points to nextjs bundled version
    const { startDevServer } = require('@cypress/webpack-dev-server')

    return startDevServer({ options, webpackConfig })
  })

  config.env.reactDevtools = true

  return config
}
