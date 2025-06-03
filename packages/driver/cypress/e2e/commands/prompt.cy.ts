describe('src/cy/commands/prompt', () => {
  it('executes the prompt command', () => {
    // TODO: (cy.prompt) We will look into supporting other browsers
    // as this is rolled out. We will add error messages for other browsers
    // and add tests if necessary
    if (Cypress.isBrowser('webkit') || Cypress.isBrowser('firefox')) {
      return
    }

    cy.visit('/fixtures/dom.html')

    // TODO: add more tests when cy.prompt is built out, but for now this just
    // verifies that the command executes without throwing an error
    cy.prompt('Hello, world!')
  })
})
