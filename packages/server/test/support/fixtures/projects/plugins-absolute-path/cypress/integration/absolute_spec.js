it('uses the plugins file', () => {
  cy.task('returns:arg', 'foo').should('equal', 'foo')
})
