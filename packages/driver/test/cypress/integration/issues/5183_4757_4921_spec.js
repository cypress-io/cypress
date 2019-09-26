it('scope', () => {
  cy.visit('/fixtures/issue-5183-4757-4921.html')
  cy.get('article').within(() => {
    cy.get('h1').should('contain', 'My Blog Post')
  })
  .should('have.class', 'post')

  cy.contains('Hello World!').should('be.visible')
})

it('FAILS with contains after each', () => {
  cy.visit('/fixtures/issue-5183-4757-4921.html')
  cy.contains('My Blog Post')
  cy.get('span').each(() => {})
  cy.contains('My Blog Post')
})

it('Works with other nested commands', () => {
  cy.visit('/fixtures/issue-5183-4757-4921.html')
  cy.contains('My Blog Post')
  cy.get('article').then((article) => {
    cy.log('This happens')
  })

  cy.contains('Hello World!')
})
