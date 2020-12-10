const preprocessor = require('@cypress/vue/dist/plugins/webpack')
const webpackConfig = require('@vue/cli-service/webpack.config')

module.exports = (on, config) => {
  preprocessor(on, config, webpackConfig)

  // IMPORTANT return the config object
  return config
}
