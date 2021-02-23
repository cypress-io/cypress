/* eslint-disable no-undef */
describe('record pass', () => {
  it('passes', { env: { foo: true } }, () => {
    cy.visit('/scrollable.html')
    cy.viewport(400, 400)
    cy.get('#box')
    cy.screenshot('yay it passes')
  })

  it('is pending')
})
