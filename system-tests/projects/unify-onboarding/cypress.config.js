const { devServer } = require('@cypress/webpack-dev-server')

module.exports = {
  'component': {
    devServer (cypressDevServerConfig) {
      return devServer(cypressDevServerConfig, {
        output: {
          publicPath: '/',
        },
      })
    },
  },
  'e2e': {
    'supportFile': false,
  },
}
