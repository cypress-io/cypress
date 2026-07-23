describe('tap headless poc', () => {
  it('loads the primary origin', () => {
    cy.visit('/')
    cy.get('#primary').should('contain', 'Primary origin')
    cy.title().should('eq', 'Primary origin')
  })

  it('produces a varied command log for tap commands', () => {
    cy.visit('/')
    cy.get('h1').should('be.visible')
    cy.wrap([1, 2, 3]).should('have.length', 3)
  })
})
