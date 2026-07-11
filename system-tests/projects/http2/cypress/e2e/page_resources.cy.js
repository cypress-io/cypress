/* eslint-disable no-undef */
describe('http2 page resources', () => {
  it('loads subresources over HTTP/2', () => {
    cy.visit('/resources')
    cy.get('#script-loaded').should('contain', 'loaded')
    cy.get('#style-applied').should('have.css', 'color', 'rgb(255, 0, 0)')
  })
})
