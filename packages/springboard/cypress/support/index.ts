/// <reference types="cypress" />

import 'windi.css'

Cypress.Commands.add('visitIndex', (options?: Partial<Cypress.VisitOptions>) => {
  // disable livereload within the Cypress-loaded desktop GUI. it doesn't fully
  // reload the app because the stubbed out ipc calls don't work after the first
  // time, so it ends up a useless white page
  cy.intercept({ path: /livereload/ }, '')

  cy.visit('/', options)
})
