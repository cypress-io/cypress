it('should work', () => {
  cy.wrap(import('./lazy.js')).its('default.hello').should('eq', 'world')
})
