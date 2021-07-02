// static file server that serves fixtures needed for testing
require('@packages/driver/cypress/plugins/server')
const { getSnapshot, saveSnapshot } = require('./snapshot/snapshotPlugin')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on) => {
  on('task', {
    getSnapshot,
    saveSnapshot,
  })
}
