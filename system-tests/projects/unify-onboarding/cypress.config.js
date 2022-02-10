module.exports = {
  'component': {
    devServer (cypressDevServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({
        options: cypressDevServerConfig,
        webpackConfig: {
          output: {
            publicPath: '/',
          },
        } })
    },
  },
  'e2e': {
    'supportFile': false,
  },
}
