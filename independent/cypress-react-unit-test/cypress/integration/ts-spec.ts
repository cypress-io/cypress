describe('Cypress TypeScript', () => {
  it('works', () => {
    cy.wrap({ life: 42 })
      .its('life')
      .should('equal', 42)
  })
})
