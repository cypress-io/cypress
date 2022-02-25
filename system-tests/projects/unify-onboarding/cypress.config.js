const { devServer } = require('@cypress/webpack-dev-server')

module.exports = {
  'component': {
    devServer,
    devServerConfig: {
      output: {
        publicPath: '/',
      },
    },
  },
  'e2e': {
    'supportFile': false,
  },
}
