it('fails', () => {
  cy.task('recordSpec', Cypress.spec.relative)
  cy.wait(4000)
  cy.wrap(1).should('eq', 2)
})
