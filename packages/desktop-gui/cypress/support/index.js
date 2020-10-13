require('@packages/ui-components/cypress/support/customPercyCommand')
require('cypress-react-unit-test/dist/hooks')

const BluebirdPromise = require('bluebird')

beforeEach(function () {
  this.util = {
    deferred (Promise = BluebirdPromise) {
      const deferred = {}

      deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve
        deferred.reject = reject
      })

      return deferred
    },

    deepClone (obj) {
      return JSON.parse(JSON.stringify(obj))
    },
  }
})

Cypress.Commands.add('visitIndex', (options = {}) => {
  // disable livereload within the Cypress-loaded desktop GUI. it doesn't fully
  // reload the app because the stubbed out ipc calls don't work after the first
  // time, so it ends up a useless white page
  cy.route2({ path: /livereload/ }, '')

  return cy.visit('/', options)
})

Cypress.Commands.add('shouldBeOnIntro', () => {
  return cy.get('.main-nav .logo')
})

Cypress.Commands.add('shouldBeOnProjectSpecs', () => {
  cy.contains('.folder', 'integration')

  return cy.contains('.folder', 'unit')
})

Cypress.Commands.add('logOut', () => {
  cy.contains('Jane Lane').click()

  return cy.contains('Log Out').click()
})

Cypress.Commands.add('shouldBeLoggedOut', () => {
  return cy.contains('.main-nav a', 'Log In')
})

Cypress.Commands.add('setAppStore', (options = {}) => {
  return cy.window()
  .then((win) => {
    return win.AppStore.set(options)
  })
})
