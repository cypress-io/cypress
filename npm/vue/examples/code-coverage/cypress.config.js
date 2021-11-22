module.exports = {
  'componentFolder': 'src',
  'fixturesFolder': false,
  'testFiles': '**/*.spec.js',
  'video': false,
  'component': {
    devServer (cypressConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')
      const webpackConfig = require('./webpack.config')

      return startDevServer({
        options: cypressConfig,
        webpackConfig,
      })
    },
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
}
