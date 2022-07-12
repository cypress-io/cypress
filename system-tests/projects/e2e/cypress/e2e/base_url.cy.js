/* eslint-disable no-undef */
describe('base url', () => {
  it('can visit', () => {
    cy.visit('/html')
    cy.contains('Herman Melville')
  })
})
