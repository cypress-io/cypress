describe('Cypress.stop() in test', () => {
  it('should run this test', () => {
    console.log('test 1')
  })

  it('should stop during test execution', () => {
    cy.url().should('equal', 'about:blank')
    Cypress.stop()
    console.log('test 2')
  })

  it('should not run this test', () => {
    throw new Error('This test should not run')
  })
})
