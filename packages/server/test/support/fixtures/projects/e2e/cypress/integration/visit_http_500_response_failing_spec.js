/* eslint-disable no-undef */
describe('when server response is 500', () => {
  it('fails', () => {
    cy.visit('http://localhost:3434/fail')
  })
})
