describe('Cypress.stop() in afterEach', () => {
  afterEach(() => {
    console.log('afterEach 1')
  })

  afterEach(() => {
    Cypress.stop()
    console.log('afterEach 2')
  })

  afterEach(() => {
    console.log('afterEach 3')
  })

  it('should run this test', () => {
    cy.url().should('equal', 'about:blank')
  })

  it('should not run this test', () => {
    throw new Error('This test should not run')
  })
})
