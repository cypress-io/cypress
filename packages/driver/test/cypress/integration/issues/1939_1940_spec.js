// https://github.com/cypress-io/cypress/issues/1940
it('sets the AUT document.hasFocus to top.document.hasFocus', () => {
  // the AUT's hasFocus() method should always return whatever
  // the top does.
  cy.visit('/timeout')
  .then(() => {
    if (top.document.hasFocus()) {
      return cy.document().invoke('hasFocus').should('be.true')
    }

    cy.document().invoke('hasFocus').should('be.false')
  })
})
