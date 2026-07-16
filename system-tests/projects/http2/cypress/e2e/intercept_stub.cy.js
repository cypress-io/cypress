/* eslint-disable no-undef */
describe('http2 intercept stub', () => {
  it('stubs fetch responses over HTTP/2', () => {
    cy.intercept('GET', '/api/data', { message: 'stubbed' })
    cy.visit('/fetch')
    cy.contains('#result', 'stubbed').should('be.visible')
  })
})
