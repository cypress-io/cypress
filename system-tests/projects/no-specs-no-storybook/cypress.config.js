const { devServer } = require('@cypress/react/plugins/load-webpack')

module.exports = {
  component: {
    supportFile: false,
    devServer,
    devServerConfig: {
      webpackFilename: 'webpack.config.js',
    },
  },
  e2e: {
    supportFile: false,
  },
}
