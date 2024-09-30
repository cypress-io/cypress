describe('font flooding', () => {
  it('will not occur', () => {
    cy.visit('cypress/fixtures/font-flooding.html')
    cy.get('#btn').click()
    cy.get('#btn').should('have.text', 'Clicked')
  })

  it('will not occur', () => {
    cy.visit('cypress/fixtures/font-flooding.html')
    cy.get('#btn').click()
    cy.get('#btn').should('have.text', 'Clicked')
  })
})
