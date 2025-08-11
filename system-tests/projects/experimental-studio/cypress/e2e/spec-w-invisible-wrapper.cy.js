describe('studio functionality', () => {
  it('visits a basic html page with an invisible wrapper', function () {
    cy.visit('cypress/e2e/invisible-wrapper.html')
  })
})
