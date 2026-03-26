// eslint-disable-next-line
it('asserts on browser args', () => {
  cy.task('assertPsOutput', Cypress.browser.name)
})
