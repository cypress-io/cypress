const cp = require('child_process')
const percyHealthCheck = require('@percy/cypress/task')

cp.exec('http-server -p 5006 dist')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on: Function) => {
  on('task', percyHealthCheck)
}
