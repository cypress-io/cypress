const plugin = require('./cypress/plugins')

module.exports = {
  'retries': null,
  'e2e': {
    'supportFile': 'cypress/support/index.js',
    setupNodeEvents (on, config) {
      return plugin(on, config)
    },
  },
  'component': {
    'supportFile': 'cypress/support/index.js',
    devServer (cypressConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({ options: cypressConfig, ...devServerConfig })
    },
    devServerConfig: {
      webpackConfig: {
        output: {
          publicPath: '/',
        },
      },
    },
    setupNodeEvents (on, config) {
      return plugin(on, config)
    },
  },
}
