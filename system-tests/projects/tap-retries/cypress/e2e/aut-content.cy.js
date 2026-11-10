describe('AUT Content', () => {
  // A single test, so the page the AUT frame holds once the run settles is always
  // this fixture page — that page is what the dom/aria/inspect reads assert against.
  it('renders the tap AUT fixture page', () => {
    cy.visit('cypress/e2e/aut-content.html')
    cy.get('#status').should('have.text', 'ready')
  })
})
