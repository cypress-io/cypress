const injectWebpackDevServer = require('@cypress/react/plugins/react-scripts')

module.exports = (on, config) => {
  injectWebpackDevServer(on, config)
}
