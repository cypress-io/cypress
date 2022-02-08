module.exports = {
  'componentFolder': 'src',
  'component': {
    'supportFile': false,
    devServer (cypressDevServerConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({ options: cypressDevServerConfig, ...devServerConfig })
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
