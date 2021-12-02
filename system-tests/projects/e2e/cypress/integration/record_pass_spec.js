/* eslint-disable no-undef */
describe('record pass', () => {
  beforeEach(() => {
    cy.visit('/scrollable.html')
  })

  it('passes', { env: { foo: true } }, () => {
    cy.viewport(400, 400)
    cy.get('#box')
    cy.screenshot('yay it passes')

    if (Cypress.env('TEST_STDIO')) {
      cy.task('console:log', 'plugin stdout')
      cy.task('console:error', 'plugin stderr')
    }
  })

  it('is pending')
})
