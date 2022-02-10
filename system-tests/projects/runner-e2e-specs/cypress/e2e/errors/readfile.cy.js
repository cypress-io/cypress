describe('cy.readFile', () => {
  it('existence failure', () => {
    cy.readFile('does-not-exist', { timeout: 100 })
  })
})
