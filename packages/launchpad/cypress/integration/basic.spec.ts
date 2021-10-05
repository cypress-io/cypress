describe('Launchpad', () => {
  it('resolves the home page', () => {
    cy.visit('dist-e2e/index.html')
    cy.get('h1').should('contain', 'Welcome')
  })
})
