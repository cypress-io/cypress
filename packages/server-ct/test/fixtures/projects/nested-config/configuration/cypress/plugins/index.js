const { startDevServer } = require('@cypress/webpack-dev-server')

module.exports = (on, config) => {
  on('dev-server:start', (options) => startDevServer({ options, webpackConfig: {} }))

  return config
}
