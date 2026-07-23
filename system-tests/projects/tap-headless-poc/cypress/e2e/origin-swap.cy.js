// 127.0.0.1 is a different superdomain than the localhost baseUrl, so this
// visit forces the runner top-frame origin swap that tap discovery must survive.
it('swaps the runner to a different superdomain', () => {
  cy.visit('http://127.0.0.1:4622/')
  cy.get('#secondary').should('contain', 'Secondary origin')
})
