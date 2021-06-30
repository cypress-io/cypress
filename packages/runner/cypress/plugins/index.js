// static file server that serves fixtures needed for testing
require('@packages/driver/cypress/plugins/server')
const { getSnapshot, saveSnapshot } = require('./snapshot/snapshotPlugin')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on) => {
  // throw Error('uh oh')
  on('task', {
    getSnapshot,
    saveSnapshot,
  })
}
