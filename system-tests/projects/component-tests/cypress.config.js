module.exports = {
  'projectId': 'abc123',
  e2e: {
    specPattern: 'cypress/e2e/**/*',
  },
  component: {
    specPattern: 'cypress/component-tests/**/*',
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
      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
}
