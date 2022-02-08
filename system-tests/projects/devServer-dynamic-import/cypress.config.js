module.exports = {
  component: {
    supportFile: false,
    devServer: import('@cypress/react/plugins/load-webpack/index.js'),
    devServerConfig: {
      webpackFilename: 'webpack.config.js',
    },
  },
}
