/* eslint-disable no-undef */
describe('record pass', () => {
  it('passes', () => {
    cy.visit('/scrollable.html')

    cy.viewport(400, 400)
    cy.get('#box')
    cy.screenshot('yay it passes')
  })

  it('is pending')
})
