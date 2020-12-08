const webpackConfig = require('@vue/cli-service/webpack.config')

module.exports = (on, config) => {
  on('componentTesting:startDevServer', () => {
    return webpackConfig
  })
}
