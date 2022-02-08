const { devServer } = require('@cypress/webpack-dev-server')

module.exports = {
  'fixturesFolder': false,
  'video': false,
  'component': {
    devServer (cypressDevServerConfig) {
      const webpackConfig = require('./webpack.config')

      return devServer(cypressDevServerConfig, webpackConfig)
    },
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
}
