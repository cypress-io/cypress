it('can type into an input in an iframe that calls auto focus', () => {
  cy.visit('/outer.html')
  cy.get('iframe')
  .its('0.contentDocument.body').should('not.be.empty')
  .then(cy.wrap)
  .find('input')
  .type(42)
})
