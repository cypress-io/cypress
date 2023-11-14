it('visits', { defaultCommandTimeout: 200 }, () => {
  cy.visit('cypress/fixtures/dom.html')
  cy.get('#button').should('not.be.visible')
})
