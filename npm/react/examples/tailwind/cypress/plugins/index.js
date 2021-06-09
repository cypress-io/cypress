const injectReactScriptsDevServer = require('@cypress/react/plugins/react-scripts')

module.exports = (on, config) => {
  injectReactScriptsDevServer(on, config)
}
