/* eslint-disable no-undef */
describe('http2 intercept spy', () => {
  it('spies on fetch over HTTP/2', () => {
    cy.intercept('GET', '/api/data').as('getData')
    cy.visit('/fetch')
    cy.wait('@getData').its('response.statusCode').should('eq', 200)
    cy.contains('#result', 'pong').should('be.visible')
  })
})
