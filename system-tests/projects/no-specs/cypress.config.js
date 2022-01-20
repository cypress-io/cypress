module.exports = {
  component: {
    supportFile: 'cypress/component/support.js',
    devServer: require('@cypress/react/plugins/load-webpack'),
    devServerConfig: {
      webpackFilename: 'webpack.config.js',
    },
  },
  e2e: {
    supportFile: 'cypress/component/support.js',
  },
}
