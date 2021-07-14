const injectNextDevServer = require('@cypress/react/plugins/next')

module.exports = {
  component (on, config) {
    injectNextDevServer(on, config)
  },
}
