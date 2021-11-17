module.exports = {
  'component': {
    devServer (cypressConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      startDevServer({ options: cypressConfig, ...devServerConfig })
    },
    devServerConfig: {
      webpackConfig: {
        output: {
          publicPath: '/',
        },
      },
    },
  },
}
