const { startDevServer } = require('../../../npm/webpack-dev-server')
const webpackConfig = require('../../webpack.config.js')

module.exports = (on, config) => {
  on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

  return config
}
