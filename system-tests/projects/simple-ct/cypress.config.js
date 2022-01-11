module.exports = {
  'component': {
    supportFile: false,
    devServer (cypressConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({
        options: cypressConfig,
        webpackConfig: {
          output: {
            publicPath: '/',
          },
        },
      })
    },
  },
}
