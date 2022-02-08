const { devServer } = require('@cypress/webpack-dev-server')

module.exports = {
  'component': {
    supportFile: false,
    devServer (cypressDevServerConfig) {
      return devServer(cypressDevServerConfig, {
        output: {
          publicPath: '/',
        },
      })
    },
  },
}
