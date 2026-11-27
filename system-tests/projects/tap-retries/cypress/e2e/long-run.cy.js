describe('Long Run', () => {
  // Nothing waits for this to finish — the instance is killed mid-run — so the
  // wait only has to outlast a sequence of tap commands.
  it('stays running for as long as the reads need', () => {
    cy.visit('cypress/e2e/aut-content.html')
    cy.get('#status').should('have.text', 'ready')
    cy.wait(60000)
  })
})
