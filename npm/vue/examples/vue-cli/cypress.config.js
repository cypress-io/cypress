module.exports = {
  'video': false,
  'fixturesFolder': false,
  'component': {
    devServer (cypressDevServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')
      const webpackConfig = require('@vue/cli-service/webpack.config')

      // HtmlPwaPlugin is coupled to a hook in HtmlWebpackPlugin
      // that was deprecated after 3.x. We currently only support
      // HtmlWebpackPlugin 4.x and 5.x.
      // TODO: Figure out how to deal with 2 major versions old HtmlWebpackPlugin
      // which is still in widespread usage.
      const modifiedWebpackConfig = {
        ...webpackConfig,
        plugins: (webpackConfig.plugins || []).filter((x) => {
          return x.constructor.name !== 'HtmlPwaPlugin'
        }),
      }

      return startDevServer({
        options: cypressDevServerConfig,
        webpackConfig: modifiedWebpackConfig,
      })
    },
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
}
