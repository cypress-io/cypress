const { devServer } = require('@cypress/webpack-dev-server')

module.exports = {
  e2e: {
    specPattern: 'cypress/e2e/**/*',
  },
  component: {
    specPattern: 'cypress/component-tests/**/*',
    devServer,
    devServerConfig: {
      webpackConfig: {
        output: {
          publicPath: '/',
        },
      },
    },
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
}
