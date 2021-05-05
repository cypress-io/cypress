const cracoConfig = require('../../craco.config.js')
const injectDevServer = require('@cypress/react/plugins/craco')

module.exports = (on, config) => {
  injectDevServer(on, config, cracoConfig)

  return config
}
