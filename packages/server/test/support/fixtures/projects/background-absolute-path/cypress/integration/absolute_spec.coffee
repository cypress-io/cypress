it "uses the background file", ->
  cy.task('returns:arg', 'foo').should('equal', 'foo')
