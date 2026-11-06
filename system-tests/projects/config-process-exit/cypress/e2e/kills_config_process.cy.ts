it('kills the config process while the test is running', () => {
  cy.task('killConfigProcess')
})
