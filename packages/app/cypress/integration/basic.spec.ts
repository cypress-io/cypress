describe('App', () => {
  it('resolves the home page', () => {
    cy.visit('http://localhost:5556')
    cy.get('[href="/__vite__/runner"]').click()
    cy.get('[href="/__vite__/settings"]').click()
  })
})
