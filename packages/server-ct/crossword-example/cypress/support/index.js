// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Component Testing resets

require('cypress-vue-unit-test/dist/support')

// Import commands.js using ES2015 syntax:
// import './commands'

// Alternatively you can use CommonJS syntax:
require('./commands')

require('@/styles/index.scss')

if (window.Cypress) {
  // send any errors caught by the Vue handler
  // to the Cypress top level error handler to fail the test
  // https://github.com/cypress-io/cypress/issues/7910
}

beforeEach(() => {
  cy.viewport(1600, 1000)
  // cy.route2('*/2012-02-14', crossword)
})

afterEach(() => {
  // const el = document.getElementById('app')
  // if (el) el.parentElement.remove(el)
})
