it('passes 2', () => {
  cy.task('recordSpec', Cypress.spec.relative)
  cy.wait(4000)
})
