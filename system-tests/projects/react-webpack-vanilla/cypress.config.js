const { startDevServer } = require('@cypress/webpack-dev-server')

module.exports = {
  component: {
    devServer (options) {
      return startDevServer({
        options,
        webpackConfig: { devServer: { port: 3000 } },
      })
    },
    supportFile: false,
  },
}
