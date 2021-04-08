const findNextWebpackConfig = require('./findNextWebpackConfig')

module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    const webpackConfig=await findNextWebpackConfig(config)
    const { startDevServer } = require('@cypress/webpack-dev-server')
    return startDevServer({ options, webpackConfig})
  })


  config.env.reactDevtools = true

  return config
}
