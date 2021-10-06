describe('App', () => {
  it('resolves the home page', () => {
    cy.visit('http://localhost:5556')
    cy.get('[href="#/runs"]').click()
    cy.get('[href="#/settings"]').click()
  })
})
