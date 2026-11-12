it('passes 1', () => {
  cy.task('recordSpec', Cypress.spec.relative)
  cy.wait(4000)
})
