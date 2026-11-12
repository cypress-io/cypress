it('passes 3', () => {
  cy.task('recordSpec', Cypress.spec.relative)
  cy.wait(4000)
})
