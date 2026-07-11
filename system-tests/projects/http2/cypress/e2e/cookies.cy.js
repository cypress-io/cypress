/* eslint-disable no-undef */
describe('http2 cookies', () => {
  it('sets and reads cookies over HTTP/2', () => {
    cy.request('/set-cookie')
    cy.getCookie('h2-cookie').should('have.property', 'value', 'set')
  })
})
