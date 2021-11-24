module.exports = {
  'componentFolder': 'src',
  'fixturesFolder': false,
  'video': false,
  'component': {
    'testFiles': '**/*.spec.js',
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
