/// <reference types="cypress" />
describe('Dynamic import', () => {
  it('works', () => {
    // dynamically import module
    // and then invoke an exported method "reverse"
    cy.wrap(import('../utils'))
    .invoke('reverse', 'Hello').should('equal', 'olleH')
  })
})
