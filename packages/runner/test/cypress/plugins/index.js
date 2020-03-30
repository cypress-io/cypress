/// <reference types="cypress" />

const { getSnapshot, saveSnapshot } = require('./snapshot')

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
