/// <reference types="cypress" />
describe('integration tests', () => {
  it('loads page for E2E', () => {
    cy.visit('index.html')
    cy.window().should('have.property', 'React')
  })

  it('loads page again', () => {
    cy.visit('index.html')
    cy.window().should('have.property', 'React')
  })
})
