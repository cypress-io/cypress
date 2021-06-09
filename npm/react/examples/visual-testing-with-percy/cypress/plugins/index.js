// load file preprocessor that comes with this plugin
// https://github.com/bahmutov/@cypress/react#install
const injectDevServer = require('@cypress/react/plugins/react-scripts')

module.exports = (on, config) => {
  injectDevServer(on, config)
}
