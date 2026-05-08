/* eslint-disable no-undef */
describe('record pass', () => {
  it('passes', () => {
    cy.visit('/scrollable.html')
    cy.viewport(400, 400)
    cy.get('#box')
    cy.screenshot('yay it passes')

    cy.env(['TEST_STDIO']).then(({ TEST_STDIO }) => {
      if (TEST_STDIO) {
        cy.task('console:log', 'plugin stdout')
        cy.task('console:error', 'plugin stderr')
      }
    })
  })

  it('is pending')
})
