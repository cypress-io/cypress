module.exports = {
  component: {
    supportFile: false,
    devServer: require('@cypress/react/plugins/load-webpack'),
    devServerConfig: {
      webpackFilename: 'webpack.config.js',
    },
  },
  e2e: {
    supportFile: false,
  },
}
