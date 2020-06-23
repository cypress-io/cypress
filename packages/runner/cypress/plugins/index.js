// static file server that serves fixtures needed for testing
require('@packages/driver/cypress/plugins/server')
const { getSnapshot, saveSnapshot } = require('./snapshot/snapshotPlugin')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on('task', {
    getSnapshot,
    saveSnapshot,
  })
}
