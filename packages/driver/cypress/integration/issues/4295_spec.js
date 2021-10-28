it('rewrites document.referrer on the AUT to be empty string on visit', () => {
  cy.visit('http://localhost:3500/fixtures/generic.html')

  cy.window().its('document').its('referrer').should('equal', '')
})

it('does not rewrite document.referrer if navigation was triggered by click on a link', () => {
  cy.visit('http://localhost:3500/fixtures/generic.html')

  cy.get('#dimensions').click()

  cy.window().its('document').its('referrer').should('equal', 'http://localhost:3500/fixtures/generic.html')
})

it('does not rewrite document.referrer on visit if modifyObstructiveCode is false', () => {
  Cypress.config('modifyObstructiveCode', false)

  cy.visit('http://localhost:3500/fixtures/generic.html')

  cy.window().its('document').its('referrer').should('equal', 'http://localhost:3500/__/')
})
