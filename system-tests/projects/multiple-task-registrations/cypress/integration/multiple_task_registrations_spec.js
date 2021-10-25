it('merges task events', () => {
  cy.task('one').should('equal', 'one')
  cy.task('two').should('equal', 'two again')
  cy.task('three').should('equal', 'three')
})
