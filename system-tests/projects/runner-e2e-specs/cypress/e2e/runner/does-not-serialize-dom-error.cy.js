it('visits', { defaultCommandTimeout: 200, retries: 2 }, () => {
  cy.visit('cypress/fixtures/dom.html')
  cy.get('#button').should('not.be.visible')
})
