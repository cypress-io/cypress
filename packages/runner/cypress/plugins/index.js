// static file server that serves fixtures needed for testing
require('@packages/driver/cypress/plugins/server')
const { getSnapshot, saveSnapshot } = require('./snapshot/snapshotPlugin')
const percyHealthCheck = require('@percy/cypress/task')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on) => {
  on('task', percyHealthCheck)

  on('task', {
    getSnapshot,
    saveSnapshot,
  })
}
