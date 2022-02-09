// @ts-check

// load file devServer that comes with this plugin
// https://github.com/bahmutov/cypress-react-unit-test#install
const devServer = require('@cypress/react/plugins/react-scripts')
// @ts-ignore
const happoTask = require('happo-cypress/task')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  on('task', happoTask)
  devServer(on, config)

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
