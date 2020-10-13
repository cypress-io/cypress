// load file preprocessor that comes with this plugin
// https://github.com/bahmutov/cypress-react-unit-test#install
const preprocessor = require('cypress-react-unit-test/plugins/react-scripts')
const { initPlugin: initSnapshots } = require('cypress-plugin-snapshots/plugin')

module.exports = (on, config) => {
  preprocessor(on, config)
  // initialize the snapshots plugin following
  // https://github.com/meinaart/cypress-plugin-snapshots
  initSnapshots(on, config)

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
