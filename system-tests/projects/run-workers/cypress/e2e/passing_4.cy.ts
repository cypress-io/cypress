it('passes 4', () => {
  cy.task('recordSpec', Cypress.spec.relative)
  cy.wait(4000)
})
