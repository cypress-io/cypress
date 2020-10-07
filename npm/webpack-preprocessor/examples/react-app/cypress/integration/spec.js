/// <reference types="cypress" />
// this spec file will be bundled using the same Webpack options
// as the React App itself. See ../plugins/index.js

describe('Todo app', () => {
  it('works', () => {
    cy.visit('/')
    cy.get('.todo').should('have.length', 3)
    cy.get('input').type('Write Cypress tests{enter}')
    cy.get('.todo').should('have.length', 4)
  })
})
