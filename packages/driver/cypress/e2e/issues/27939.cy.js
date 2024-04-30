// Chrome, Firefox, Electron, and Webkit all have navigator.webdriver set to true in Cypress tests.
// https://w3c.github.io/webdriver/#interface
// https://github.com/cypress-io/cypress/issues/27939
it('visit', () => {
  cy.visit('/fixtures/issue-27939.html')
  cy.get('#content').should('have.text', 'navigator.webdriver is true')
})
