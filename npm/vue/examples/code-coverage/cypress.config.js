const { devServer } = require('@cypress/webpack-dev-server')
const webpackConfig = require('./webpack.config')

module.exports = {
  'fixturesFolder': false,
  'video': false,
  'component': {
    devServer,
    devServerConfig: { webpackConfig },
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
}
