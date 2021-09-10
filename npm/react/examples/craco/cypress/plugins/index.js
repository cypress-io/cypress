const cracoConfig = require('../../craco.config.js')
const devServer = require('@cypress/react/plugins/craco')

module.exports = (on, config) => {
  devServer(on, config, cracoConfig)

  return config
}
