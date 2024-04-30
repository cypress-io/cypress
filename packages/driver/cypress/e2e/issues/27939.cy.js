// Chrome, Firefox, and Electron all have navigator.webdriver set to true in Cypress tests.
// TODO: Webkit should have this set, this needs to be fixed https://github.com/cypress-io/cypress/issues/29446
// https://w3c.github.io/webdriver/#interface
// https://github.com/cypress-io/cypress/issues/27939
it('visit', { browser: '!webkit' }, () => {
  cy.visit('/fixtures/issue-27939.html')
  cy.get('#content').should('have.text', 'navigator.webdriver is true')
})
