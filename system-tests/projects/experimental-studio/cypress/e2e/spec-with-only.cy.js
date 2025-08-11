describe('spec with .only tests', () => {
  // eslint-disable-next-line mocha/no-exclusive-tests
  it.only('should be the only test to run normally', () => {
    cy.visit('cypress/e2e/index.html')
    cy.get('h1').should('contain', 'Hello World')
  })

  it('should be skipped in normal mode', () => {
    cy.visit('cypress/e2e/index.html')
    cy.get('p').should('contain', 'Count is 0')
  })

  it('another test that should be skipped', () => {
    cy.visit('cypress/e2e/index.html')
    cy.get('#increment').click()
  })
})
