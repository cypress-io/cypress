const { devServer } = require('@cypress/webpack-dev-server')
const webpackConfig = require('@vue/cli-service/webpack.config')

module.exports = {
  component: {
    devServer,
    devServerConfig: {
      webpackConfig,
    },
    indexHtmlFile: 'cypress/support/custom-component-index.html',
  },
}
