it('scope', () => {
  cy.visit('/fixtures/issue-5183-4757-4921.html')
  cy.get('article').within(() => {
    cy.get('h1')
  })
  .should('have.class', 'post')

  cy.contains('Hello World!').should('be.visible')
})
