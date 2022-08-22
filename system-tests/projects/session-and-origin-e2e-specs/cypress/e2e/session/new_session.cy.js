it('t1', () => {
  const setupFn = cy.stub().as('runSetup')

  cy.visit('cypress/fixtures/login.html')

  cy.session('user1', () => {
    cy.visit('cypress/fixtures/login.html')
    cy.then(setupFn)
  })

  cy.url().should('eq', 'about:blank')
})
