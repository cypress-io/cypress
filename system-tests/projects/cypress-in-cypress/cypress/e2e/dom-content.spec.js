describe('Dom Content', { testIsolation: false }, () => {
  it('renders the test content', () => {
    cy.visit('cypress/e2e/dom-content.html')
  })
})
