const { devServer } = require('@cypress/webpack-dev-server')

module.exports = {
  'component': {
    supportFile: false,
    devServer,
    devServerConfig: {
      output: {
        publicPath: '/',
      },
    },
  },
}
