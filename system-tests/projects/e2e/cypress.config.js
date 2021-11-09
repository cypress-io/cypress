const plugin = require('./plugins')

module.exports = {
  'retries': null,
  e2e: {
    setupNodeEvents (on, config) {
      return plugin(on, config)
    },
  },
  component: {
    setupNodeEvents (on, config) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      const webpackConfig = {
        output: {
          publicPath: '/',
        },
      }

      on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

      return plugin(on, config)
    },
  },
}
