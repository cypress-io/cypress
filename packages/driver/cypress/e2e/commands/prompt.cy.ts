describe('src/cy/commands/prompt', () => {
  it('executes the prompt command', () => {
    // TODO: test the error messages
    if (Cypress.isBrowser('webkit') || Cypress.isBrowser('firefox')) {
      return
    }

    cy.visit('/fixtures/dom.html')

    // TODO: add more tests when cy.prompt is built out, but for now this just
    // verifies that the command executes without throwing an error
    cy.prompt('Hello, world!')
  })
})
