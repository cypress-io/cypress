/// <reference types="cypress" />

// Copied an example command from https://on.cypress.io/custom-commands
Cypress.Commands.add('clickLink', (label: string | number | RegExp) => {
  cy.get('a').contains(label).click()
})

// https://github.com/cypress-io/cypress/issues/7510
// The code below fails when @typescript-eslint/no-misused-promises is error
// and the return type of function in Cypress.Commands.add doesn't support Chainable.
Cypress.Commands.add('dataCy', (value) => {
  return cy.get(`[data-cy=${value}]`)
})
