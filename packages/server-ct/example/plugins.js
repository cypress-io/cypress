const webpackConfig = require('@vue/cli-service/webpack.config')
const webpackDevserver = require('@cypress/webpack-devserver')

module.exports = (on, config) => {
  on('devserver:config', () => {
    return webpackDevserver(webpackConfig)
  })
}
