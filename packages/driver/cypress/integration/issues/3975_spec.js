describe('issue 3975 redirect bug', () => {
  it('should visit the correct url', () => {
    cy.visit('/fixtures/nested/3975_a.html')
    cy.get('h1').should('contain', 'Loaded')
  })
})
