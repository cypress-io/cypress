describe('Slow', () => {
  // Long enough that a poller reliably observes the `running` stage, which is the only
  // stage the AUT-frame reads reject with RUN_IN_PROGRESS.
  it('stays running long enough to be observed mid-run', () => {
    cy.visit('cypress/e2e/aut-content.html')
    cy.wait(8000)
    cy.get('#status').should('have.text', 'ready')
  })
})
