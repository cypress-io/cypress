describe('Launchpad', () => {
  it('resolves the home page', () => {
    cy.visit('http://localhost:5555')
    cy.get('h1').should('contain', 'Welcome')
  })
})
