/* eslint-disable no-undef */
describe('http2 visit', () => {
  it('loads a page over HTTP/2', () => {
    cy.visit('/')
    cy.contains('h1', 'http2 visit').should('be.visible')
    cy.request('/protocol').its('body').should('deep.eq', { protocol: '2.0' })
  })
})
