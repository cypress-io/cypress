describe('cypress grep', () => {
  it('should run', { tags: ['runs'] }, () => {
    cy.visit('cypress/e2e/index.html')
    cy.get('h1').should('contain', 'Hello World')
  })

  it('should not run', () => {
    cy.visit('cypress/e2e/index.html')
    cy.get('h1').should('contain', 'Hello World')
  })
})
