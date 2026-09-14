describe('Pin Target', () => {
  // The click mutates #status, so its "before" and "after" snapshots hold
  // different DOM — pinning one is distinguishable from the live page.
  it('clicks the toggle', () => {
    cy.visit('cypress/e2e/pin-target.html')
    cy.get('#toggle').click()
    cy.get('#status').should('have.text', 'clicked')
  })
})
