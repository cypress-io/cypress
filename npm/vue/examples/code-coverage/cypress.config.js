module.exports = {
  'componentFolder': 'src',
  'fixturesFolder': false,
  'testFiles': '**/*.spec.js',
  'video': false,
  'component': {
    setupNodeEvents (on, config) {
      const { startDevServer } = require('@cypress/webpack-dev-server')
      const webpackConfig = require('./webpack.config')

      on('dev-server:start', (options) => {
        return startDevServer({
          options,
          webpackConfig,
        })
      })

      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
}
