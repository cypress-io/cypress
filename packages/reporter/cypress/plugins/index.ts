const percyHealthCheck = require('@percy/cypress/task')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on: Function) => {
  on('task', percyHealthCheck)
}
