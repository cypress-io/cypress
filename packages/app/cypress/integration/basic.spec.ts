describe('App', () => {
  it('resolves the home page', () => {
    cy.visit('dist-e2e/index.html')
    cy.get('[href="#/runs"]').click()
    cy.get('[href="#/settings"]').click()
  })
})
