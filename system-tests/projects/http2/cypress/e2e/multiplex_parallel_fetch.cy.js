/* eslint-disable no-undef */
describe('http2 multiplex parallel fetch', () => {
  it('completes many concurrent streams on one connection', () => {
    cy.visit('/multiplex')
    cy.get('#count', { timeout: 10000 }).should('contain', '20')
    cy.get('#sum').should('contain', '190')
  })
})
