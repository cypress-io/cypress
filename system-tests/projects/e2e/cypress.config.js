const { devServer } = require('@cypress/webpack-dev-server')

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
    devServer,
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
