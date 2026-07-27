describe('Console Props', () => {
  it('logs inspectable command details', () => {
    cy.visit('cypress/e2e/pin-target.html')
    cy.get('#toggle')
    Cypress.log({ name: 'empty-console-props' }).set('consoleProps', null)
  })
})
