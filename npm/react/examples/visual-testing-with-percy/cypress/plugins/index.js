// load file preprocessor that comes with this plugin
// https://github.com/bahmutov/@cypress/react#install
const percyHealthCheck = require('@percy/cypress/task')
const preprocessor = require('@cypress/react/plugins/react-scripts')

module.exports = (on, config) => {
  on('task', percyHealthCheck)
  preprocessor(on, config)

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
