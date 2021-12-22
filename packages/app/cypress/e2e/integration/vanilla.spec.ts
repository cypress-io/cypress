it('is true', () => {
  cy.visit('http://example.com')
  cy.contains('Example Domain')
})
