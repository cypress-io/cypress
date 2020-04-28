/// <reference types="cypress" />
it('loads page for E2E', () => {
  cy.visit('index.html')
  cy.window().should('have.property', 'React')
})
