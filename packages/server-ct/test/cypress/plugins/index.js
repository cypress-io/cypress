// const webpackConfig = require('@vue/cli-service/webpack.config')
// process.chdir('../../../../../npm/evergreen/examples/webpack-vue-cli')

const webpackConfig = require('../../../../../npm/evergreen/examples/webpack-vue-cli/node_modules/@vue/cli-service/webpack.config')

module.exports = (on, config) => {
  on('devserver:config', () => {
    return webpackConfig
  })

  return config
}
