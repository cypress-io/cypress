const plugin = require('./cypress/plugins')

module.exports = {
  'retries': null,
  'e2e': {
    setupNodeEvents (on, config) {
      return plugin(on, config)
    },
  },
  'component': {
    'supportFile': false,
    'specPattern': 'cypress/component/**/*spec.js',
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
