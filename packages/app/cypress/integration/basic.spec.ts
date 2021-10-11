describe('App', () => {
  it('resolves the home page', () => {
    cy.visit('http://localhost:5556')
    cy.get('[data-e2e-href="/runner"]').click()
    cy.get('[data-e2e-href="/settings"]').click()
  })
})
