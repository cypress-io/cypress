/* eslint-disable no-undef */
describe('http2 multiplex intercept', () => {
  it('spies on every concurrent stream', () => {
    cy.intercept('GET', '/api/item/*').as('items')
    cy.visit('/multiplex')
    cy.get('#count', { timeout: 10000 }).should('contain', '20')
    cy.get('@items.all').should('have.length', 20)
  })
})
