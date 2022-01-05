module.exports = {
  'component': {
    devServer (cypressConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({
        options: cypressConfig,
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
