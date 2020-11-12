const webpackConfig = require('@vue/cli-service/webpack.config')

module.exports = (on, config) => {
  on('devserver:config', () => {
    return webpackConfig
  })

  // return config
}
