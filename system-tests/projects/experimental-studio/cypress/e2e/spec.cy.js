describe('studio', { testIsolation: false }, () => {
  it('visits a basic html page', () => {
    cy.visit('cypress/e2e/index.html')
  })
})
