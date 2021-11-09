module.exports = {
  component: {
    setupNodeEvents (on, config) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      const webpackConfig = {
        output: {
          publicPath: '/',
        },
      }

      on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

      return config
    },
  },
}
