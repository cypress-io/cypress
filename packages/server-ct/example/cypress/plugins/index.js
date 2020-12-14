const webpackConfig = require('../../webpack.config')
const { startDevServer } = require('@cypress/webpack-dev-server')

module.exports = (on, config) => {
  require('@cypress/code-coverage/task')(on, config)
  on('devserver:start', (options) => startDevServer(options, webpackConfig))

  return config
}
