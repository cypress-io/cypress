const webpackConfig = require('@vue/cli-service/webpack.config')

console.log(JSON.stringify(webpackConfig, null, 1))
module.exports = (on, config) => {
  on('devserver:config', () => {
    return webpackConfig
  })
}
