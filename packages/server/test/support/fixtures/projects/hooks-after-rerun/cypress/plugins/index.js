/// <reference types="cypress" />

const state = {}

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on) => {
  on('task', {
    incrState (arg) {
      state[arg] = state[arg] + 1 || 1

      return null
    },
    getState () {
      return state
    },
  })
}
