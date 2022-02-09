module.exports = {
  'component': {
    supportFile: false,
    devServer (cypressDevServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({
        options: cypressDevServerConfig,
        webpackConfig: {
          output: {
            publicPath: '/',
          },
        },
      })
    },
  },
}
