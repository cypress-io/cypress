const webpackConfig = require('@vue/cli-service/webpack.config')

module.exports = (on, config) => {
  on('devserver:start', () => {
    return webpackConfig
  })
}
