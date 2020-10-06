// load file preprocessor that comes with this plugin
// https://github.com/bahmutov/cypress-react-unit-test#install
const preprocessor = require('cypress-react-unit-test/plugins/react-scripts')
const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin')

module.exports = (on, config) => {
  addMatchImageSnapshotPlugin(on, config)
  preprocessor(on, config)
  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
