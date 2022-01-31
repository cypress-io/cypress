/* eslint-disable no-undef */
describe('simple passing spec', () => {
  it('passes', () => {
    cy.wrap(true).should('be.true')
  })
})
