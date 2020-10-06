const preprocessor = require('@cypress/vue/dist/plugins/webpack')

module.exports = (on, config) => {
  preprocessor(on, config)

  // IMPORTANT return the config object
  return config
}
