// @see https://github.com/cypress-io/cypress/issues/15901
it('does not crash', () => {
  cy.intercept('POST', 'http://localhost:5000/api/sample')
  cy.visit('index.html')
})
